using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Simulador.Avaliacao;
using Simulador.Cenarios;
using Simulador.Dialogo;
using Simulador.Dominio;
using Simulador.Infra;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.ConfigureKestrel(k => k.Limits.MaxRequestBodySize = 32 * 1024);

var portEnv = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(portEnv) && string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ASPNETCORE_URLS")))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{portEnv}");
}

builder.Services.ConfigureHttpJsonOptions(opt =>
{
    opt.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();
var origensConfig = builder.Configuration["Cors:AllowedOrigins"];
var origensPermitidas = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
{
    "http://localhost:5173",
    "http://127.0.0.1:5173"
};
if (!string.IsNullOrWhiteSpace(origensConfig))
{
    foreach (var origem in origensConfig.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        origensPermitidas.Add(origem.TrimEnd('/'));
}
builder.Services.AddCors(opt =>
{
    opt.AddDefaultPolicy(p => p
        .WithOrigins([.. origensPermitidas])
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var provedor = builder.Configuration["EventStore:Provedor"];
if (string.IsNullOrWhiteSpace(provedor))
{
    if (!builder.Environment.IsDevelopment())
        throw new InvalidOperationException("EventStore:Provedor e obrigatorio fora de Development.");
    provedor = "InMemory";
}

PostgresEventStore? pgStore = null;
if (string.Equals(provedor, "Postgres", StringComparison.OrdinalIgnoreCase))
{
    var cs = builder.Configuration.GetConnectionString("Postgres");
    if (string.IsNullOrWhiteSpace(cs))
        throw new InvalidOperationException("ConnectionStrings:Postgres obrigatoria quando EventStore:Provedor=Postgres.");
    pgStore = new PostgresEventStore(cs);
    builder.Services.AddSingleton<IEventStore>(pgStore);
}
else if (string.Equals(provedor, "InMemory", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddSingleton<IEventStore, InMemoryEventStore>();
}
else
{
    throw new InvalidOperationException($"EventStore:Provedor '{provedor}' invalido. Use 'InMemory' ou 'Postgres'.");
}

builder.Services.AddSingleton<ICatalogoCenarios, CatalogoCenarios>();
builder.Services.AddSingleton<IClienteDialogo>(sp =>
{
    var cfg = sp.GetRequiredService<IConfiguration>();
    var apiKey = cfg["LLM_API_KEY"];
    var habilitarLlm = bool.TryParse(cfg["Dialogo:HabilitarLlm"], out var h) && h;
    return new DialogoComFallback(apiKey, habilitarLlm);
});

builder.Services.Configure<ForwardedHeadersOptions>(opt =>
{
    opt.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    opt.KnownIPNetworks.Clear();
    opt.KnownProxies.Clear();
    opt.ForwardLimit = 2;
});

// Limite por IP e por minuto. Padrao 120; o E2E local eleva via RateLimit__PermitLimit,
// pois toda a suite roda em 127.0.0.1 e compartilha uma unica janela.
var limitePorMinuto = builder.Configuration.GetValue("RateLimit:PermitLimit", 120);
if (limitePorMinuto <= 0)
    limitePorMinuto = 120;

builder.Services.AddRateLimiter(opt =>
{
    opt.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    opt.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
    {
        if (ctx.Request.Path.StartsWithSegments("/health"))
            return RateLimitPartition.GetNoLimiter("health");
        var ip = ctx.Connection.RemoteIpAddress?.ToString() ?? "local";
        return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = limitePorMinuto,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        });
    });
});

var app = builder.Build();

if (pgStore is not null)
{
    await pgStore.InicializarSchemaAsync();
}
else
{
    app.Logger.LogWarning("EventStore operando em modo InMemory (Development).");
}

try
{
    var storeInicial = app.Services.GetRequiredService<IEventStore>();
    await storeInicial.ExpurgarExpiradasAsync();
}
catch (Exception ex)
{
    app.Logger.LogWarning(ex, "Falha nao fatal ao expurgar sessoes expiradas na inicializacao.");
}

app.UseExceptionHandler();
app.UseForwardedHeaders();
app.UseCors();
app.UseRateLimiter();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(opt => opt.SwaggerEndpoint("/openapi/v1.json", "IT Flight Simulator API v1"));
}

static IResult ErroProblema(int status, string type, string detail, object? extras = null)
{
    var ext = new Dictionary<string, object?> { ["type"] = type };
    if (extras is not null)
    {
        foreach (var prop in extras.GetType().GetProperties())
            ext[prop.Name] = prop.GetValue(extras);
    }
    return Results.Problem(detail: detail, statusCode: status, type: type, extensions: ext);
}

app.MapGet("/health/live", () => Results.Ok(new { status = "live" }));
app.MapGet("/health/ready", async (CancellationToken ct) =>
{
    if (pgStore is not null)
    {
        try
        {
            await pgStore.VerificarSaudeAsync(ct);
            return Results.Ok(new { status = "ready", store = "Postgres" });
        }
        catch
        {
            return Results.Json(new { status = "degraded", store = "Postgres" }, statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    }
    return Results.Ok(new { status = "ready", store = "InMemory" });
});

app.MapPost("/api/sessoes", async (
    CriarSessaoDto? body,
    ICatalogoCenarios catalogo,
    IEventStore store,
    CancellationToken ct) =>
{
    var cenarioId = string.IsNullOrWhiteSpace(body?.CenarioId) ? "pasta-rede-inacessivel" : body.CenarioId.Trim();
    var versao = string.IsNullOrWhiteSpace(body?.VersaoManifesto)
        ? cenarioId switch
        {
            "pasta-rede-inacessivel" => "v1.1",
            "sre-cloud-latencia" or "diagnostico-sql-readonly" => "v2.0",
            _ => "v0.1-hackathon"
        }
        : body.VersaoManifesto.Trim();

    if (!catalogo.SuportaVersao(cenarioId, versao))
        return ErroProblema(400, "nivel_indisponivel", $"Cenario '{cenarioId}' versao '{versao}' nao suportado.");

    var permitirParamsTeste = app.Configuration.GetValue("Demo:PermitirParametrosDeTeste", true);
    if (!permitirParamsTeste && (!string.IsNullOrWhiteSpace(body?.CausaForcada) || body?.Semente.HasValue == true))
        return ErroProblema(400, "parametros_teste_desabilitados", "Parametros de teste (causaForcada e semente) desabilitados neste ambiente.");

    var semente = body?.Semente ?? DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    var cenario = catalogo.Obter(cenarioId, versao, body?.CausaForcada, semente);
    var inicio = Motor.Iniciar(cenario, semente);

    var sessaoId = Guid.NewGuid();
    var agora = DateTimeOffset.UtcNow;
    var ttlDias = int.TryParse(app.Configuration["Sessao:TtlDias"], out var d) && d > 0 ? d : 30;
    var registro = new RegistroSessao(
        sessaoId, semente, cenario.CenarioId, cenario.Causa, cenario.Nivel, cenario.VersaoManifesto, agora, agora.AddDays(ttlDias));

    await store.CriarSessaoAsync(registro, inicio.Eventos, ct);
    return Results.Created($"/api/sessoes/{sessaoId}", new
    {
        sessaoId,
        semente,
        ultimoSeq = inicio.NovoEstado.Meta.UltimoSeq
    });
});

app.MapGet("/api/sessoes/{id:guid}", async (
    Guid id,
    ICatalogoCenarios catalogo,
    IEventStore store,
    CancellationToken ct) =>
{
    var (meta, eventos) = await store.ObterSessaoAsync(id, ct);
    if (meta is null) return ErroProblema(404, "sessao_nao_encontrada", "Sessao nao encontrada.");
    if (meta.ExpiraEm < DateTimeOffset.UtcNow) return ErroProblema(410, "sessao_expirada", "Sessao expirada.");

    var estado = Projecao.Reconstruir(eventos, catalogo);
    return Results.Ok(ProjetarSessaoPublica(estado));
});

app.MapPost("/api/sessoes/{id:guid}/acoes", async (
    HttpContext http,
    Guid id,
    ExecutarAcaoDto? body,
    ICatalogoCenarios catalogo,
    IEventStore store,
    CancellationToken ct) =>
{
    if (http.Request.ContentLength > 32 * 1024)
        return ErroProblema(413, "payload_excedido", "Corpo da requisicao excede o limite de 32 KB.");
    if (body is null || string.IsNullOrWhiteSpace(body.Tipo) || body.SeqEsperado <= 0)
        return ErroProblema(400, "validacao", "tipo e seqEsperado (> 0) sao obrigatorios.");
    if (body.Dados is not null && JsonSerializer.SerializeToUtf8Bytes(body.Dados).Length > 16 * 1024)
        return ErroProblema(413, "payload_excedido", "Dados da acao excedem o limite de 16 KB.");

    var (meta, eventos) = await store.ObterSessaoAsync(id, ct);
    if (meta is null) return ErroProblema(404, "sessao_nao_encontrada", "Sessao nao encontrada.");
    if (meta.ExpiraEm < DateTimeOffset.UtcNow) return ErroProblema(410, "sessao_expirada", "Sessao expirada.");

    if (eventos[^1].Seq != body.SeqEsperado)
        return ErroProblema(409, "conflito_seq", "Sequencia desatualizada.", new { ultimoSeq = eventos[^1].Seq });

    var cenario = catalogo.Obter(meta.CenarioId, meta.VersaoManifesto, meta.Causa, meta.Semente);
    var estadoAtual = Projecao.Reconstruir(eventos, catalogo);
    var acao = new Acao(body.Tipo.Trim(), body.Dados);
    var resultado = Motor.Aplicar(estadoAtual, acao, cenario);

    var anexar = await store.AnexarAsync(id, body.SeqEsperado, resultado.Eventos, ct);
    if (anexar.Conflito)
        return ErroProblema(409, "conflito_seq", "Conflito de concorrencia.", new { ultimoSeq = anexar.UltimoSeq });

    return Results.Ok(new
    {
        eventos = resultado.Eventos,
        projecao = ProjetarSessaoPublica(resultado.NovoEstado)
    });
});

app.MapPost("/api/sessoes/{id:guid}/chat", async (
    Guid id,
    ChatDto? body,
    ICatalogoCenarios catalogo,
    IEventStore store,
    IClienteDialogo dialogo,
    CancellationToken ct) =>
{
    if (body is null || body.SeqEsperado <= 0 || string.IsNullOrWhiteSpace(body.Mensagem) || body.Mensagem.Length > 500)
        return ErroProblema(400, "validacao", "mensagem (1..500 chars) e seqEsperado (> 0) sao obrigatorios.");

    var persona = body.Persona?.Trim().ToLowerInvariant();
    if (persona is not ("cliente" or "techlead"))
        return ErroProblema(400, "validacao", "persona deve ser 'cliente' ou 'techlead'.");

    var (meta, eventos) = await store.ObterSessaoAsync(id, ct);
    if (meta is null) return ErroProblema(404, "sessao_nao_encontrada", "Sessao nao encontrada.");
    if (meta.ExpiraEm < DateTimeOffset.UtcNow) return ErroProblema(410, "sessao_expirada", "Sessao expirada.");

    if (eventos[^1].Seq != body.SeqEsperado)
        return ErroProblema(409, "conflito_seq", "Sequencia desatualizada.", new { ultimoSeq = eventos[^1].Seq });

    var estadoAtual = Projecao.Reconstruir(eventos, catalogo);
    var resp = await dialogo.ResponderAsync(estadoAtual, persona, body.Mensagem.Trim(), ct);
    var resultado = Motor.RegistrarChat(estadoAtual, persona, body.Mensagem.Trim(), resp.Mensagem, resp.Origem);

    var anexar = await store.AnexarAsync(id, body.SeqEsperado, resultado.Eventos, ct);
    if (anexar.Conflito)
        return ErroProblema(409, "conflito_seq", "Conflito de concorrencia.", new { ultimoSeq = anexar.UltimoSeq });

    return Results.Ok(new
    {
        eventos = resultado.Eventos,
        projecao = ProjetarSessaoPublica(resultado.NovoEstado)
    });
});

app.MapGet("/api/sessoes/{id:guid}/avaliacao", async (
    Guid id,
    ICatalogoCenarios catalogo,
    IEventStore store,
    CancellationToken ct) =>
{
    var (meta, eventos) = await store.ObterSessaoAsync(id, ct);
    if (meta is null) return ErroProblema(404, "sessao_nao_encontrada", "Sessao nao encontrada.");
    if (meta.ExpiraEm < DateTimeOffset.UtcNow) return ErroProblema(410, "sessao_expirada", "Sessao expirada.");

    var estado = Projecao.Reconstruir(eventos, catalogo);
    var relatorio = Juiz360.Avaliar(estado, eventos);
    return Results.Ok(relatorio);
});

app.MapGet("/api/sessoes/{id:guid}/replay", async (
    Guid id,
    ICatalogoCenarios catalogo,
    IEventStore store,
    CancellationToken ct) =>
{
    var (meta, eventos) = await store.ObterSessaoAsync(id, ct);
    if (meta is null) return ErroProblema(404, "sessao_nao_encontrada", "Sessao nao encontrada.");
    if (meta.ExpiraEm < DateTimeOffset.UtcNow) return ErroProblema(410, "sessao_expirada", "Sessao expirada.");

    var estado = Projecao.Reconstruir(eventos, catalogo);
    var relatorio = Juiz360.Avaliar(estado, eventos);
    var criteriosPorSeq = relatorio.Criterios
        .Where(c => c.EventoSeq.HasValue)
        .GroupBy(c => c.EventoSeq!.Value)
        .ToDictionary(g => g.Key, g => g.Select(c => c.Id).ToArray());

    return Results.Ok(new
    {
        sessaoId = id,
        meta = new
        {
            cenarioId = estado.Meta.CenarioId,
            causa = relatorio.Concluida ? estado.Meta.Causa : null,
            nivel = estado.Meta.Nivel,
            semente = estado.Meta.Semente,
            versaoManifesto = estado.Meta.VersaoManifesto
        },
        ultimoSeq = estado.Meta.UltimoSeq,
        eventos = eventos.Select(e => new
        {
            seq = e.Seq,
            tipo = e.Tipo,
            minutoSimulado = e.MinutoSimulado,
            // SessaoIniciada gravada antes do alinhamento das escalas traz o rotulo antigo em "nivel". O evento fica
            // intacto no Postgres (append-only, e o hash da trilha o le); a leitura devolve o nome da projecao.
            payload = e.Tipo == "SessaoIniciada"
                ? e.Dados.Where(kv => relatorio.Concluida || !string.Equals(kv.Key, "causa", StringComparison.OrdinalIgnoreCase))
                    .ToDictionary(kv => kv.Key, kv => string.Equals(kv.Key, "nivel", StringComparison.Ordinal) ? estado.Meta.Nivel : kv.Value)
                : e.Dados,
            criterios = criteriosPorSeq.TryGetValue(e.Seq, out var cs) ? cs : []
        }),
        avaliacao = relatorio,
        curriculo = relatorio.Concluida
            ? new
            {
                competencias = relatorio.CurriculoVivo.CompetenciasComprovadas,
                hash = relatorio.CurriculoVivo.HashAuditoriaSha256,
                algoritmo = "SHA-256/JCS-RFC8785",
                versaoManifesto = estado.Meta.VersaoManifesto
            }
            : null
    });
});

app.MapPost("/api/carreira/resumo", async (
    CarreiraResumoDto? body,
    ICatalogoCenarios catalogo,
    IEventStore store,
    CancellationToken ct) =>
{
    var ids = body?.SessaoIds?.Distinct().Take(20).ToArray() ?? [];
    var sessoesConfirmadas = new List<object>();
    var sessoesNaoConfirmadas = new List<Guid>();
    var xpPorCenario = new Dictionary<string, int>(StringComparer.Ordinal);
    var competencias = new HashSet<string>(StringComparer.Ordinal);
    var concluiuHelpDeskN1 = false;
    var concluiuServiceDeskN1Jr = false;
    var concluiuN2Pleno = false;
    var concluiuN3ARedesNuvem = false;
    var concluiuN3BDataCenterBackup = false;
    var concluiuN3CTriagem = false;
    var concluiuN3CSql = false;

    foreach (var id in ids)
    {
        var (meta, eventos) = await store.ObterSessaoAsync(id, ct);
        if (meta is null || meta.ExpiraEm < DateTimeOffset.UtcNow)
        {
            sessoesNaoConfirmadas.Add(id);
            continue;
        }
        var estado = Projecao.Reconstruir(eventos, catalogo);
        var av = Juiz360.Avaliar(estado, eventos);
        if (av.Concluida)
        {
            xpPorCenario[meta.CenarioId] = Math.Max(
                xpPorCenario.GetValueOrDefault(meta.CenarioId),
                av.XpTotal);
            foreach (var comp in av.CurriculoVivo.CompetenciasComprovadas)
                competencias.Add(comp);
        }

        // Promocoes por escala do Catalogo de Rotas. Help Desk N1, Service Desk N1 Jr e N2 Pleno seguem a regra
        // que ja valia para a escala correspondente; as quatro missoes da N3 Senior exigem todos os criterios.
        if (meta.CenarioId == "reset-senha-desbloqueio" && av.Concluida && !av.IncidenteSeguranca)
            concluiuHelpDeskN1 = true;
        if (meta.CenarioId == "pasta-rede-inacessivel" && av.Concluida && av.Criterios.FirstOrDefault(c => c.Id == "J2")?.Atendido == true)
            concluiuServiceDeskN1Jr = true;
        if (meta.CenarioId == "incidente-massivo" && av.Concluida)
            concluiuN2Pleno = true;
        if (meta.CenarioId == "sre-cloud-latencia" && av.Concluida && !av.IncidenteSeguranca && av.Criterios.All(c => c.Atendido))
            concluiuN3ARedesNuvem = true;
        if (meta.CenarioId == "falha-backup-restore" && av.Concluida && !av.IncidenteSeguranca && av.Criterios.All(c => c.Atendido))
            concluiuN3BDataCenterBackup = true;
        if (meta.CenarioId == "triagem-engenharia-social" && av.Concluida && !av.IncidenteSeguranca)
            concluiuN3CTriagem = true;
        if (meta.CenarioId == "diagnostico-sql-readonly" && av.Concluida && !av.IncidenteSeguranca && av.Criterios.All(c => c.Atendido))
            concluiuN3CSql = true;

        sessoesConfirmadas.Add(new
        {
            sessaoId = id,
            cenarioId = meta.CenarioId,
            // O nome da escala vem da projecao (catalogo atual), nao do meta gravado no Postgres: sessoes antigas
            // ainda dentro do prazo de 30 dias guardam o rotulo da escada anterior e passam a sair com o nome novo.
            nivel = estado.Meta.Nivel,
            concluida = av.Concluida,
            xp = av.XpTotal,
            hashSessao = av.CurriculoVivo.HashAuditoriaSha256
        });
    }

    var xpTotal = xpPorCenario.Values.Sum();
    var concluiuAlgumaN3 = concluiuN3ARedesNuvem || concluiuN3BDataCenterBackup || concluiuN3CTriagem || concluiuN3CSql;
    var jornadaCompleta = concluiuHelpDeskN1 && concluiuServiceDeskN1Jr && concluiuN2Pleno
        && concluiuN3ARedesNuvem && concluiuN3BDataCenterBackup && concluiuN3CTriagem && concluiuN3CSql;
    var cargoAtual = jornadaCompleta ? "N3 Sênior - Jornada Concluída"
        : concluiuAlgumaN3 ? "N3 Sênior"
        : concluiuN2Pleno ? "N2 Pleno"
        : concluiuServiceDeskN1Jr ? "Service Desk N1 Jr"
        : concluiuHelpDeskN1 ? "Help Desk N1"
        : "Sem escala concluída";

    var nucleo = new
    {
        cargoAtual,
        xpTotal,
        competencias = competencias.OrderBy(c => c, StringComparer.Ordinal).ToArray(),
        sessoesConfirmadas
    };
    var jsonNucleo = JcsCanonico.Serializar(nucleo);
    var hash = Convert.ToHexStringLower(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(jsonNucleo)));
    var assinatura = AssinadorCurriculoVivo.AssinarHex(jsonNucleo);

    return Results.Ok(new
    {
        apelido = string.IsNullOrWhiteSpace(body?.Apelido) ? null : body.Apelido.Trim(),
        cargoAtual,
        xpTotal,
        promocoes = new
        {
            helpDeskN1Concluido = concluiuHelpDeskN1,
            serviceDeskN1JrConcluido = concluiuServiceDeskN1Jr,
            n2PlenoConcluido = concluiuN2Pleno,
            n3ARedesNuvemConcluido = concluiuN3ARedesNuvem,
            n3BDataCenterBackupConcluido = concluiuN3BDataCenterBackup,
            n3CTriagemConcluido = concluiuN3CTriagem,
            n3CSqlConcluido = concluiuN3CSql
        },
        competencias = nucleo.competencias,
        sessoesConfirmadas,
        sessoesNaoConfirmadas,
        integridade = new
        {
            hash,
            algoritmo = "SHA-256/JCS-RFC8785",
            regraHash = "SHA-256 sobre UTF-8 do JSON canonico JCS (RFC 8785) {cargoAtual, xpTotal, competencias[], sessoesConfirmadas[]} sem apelido, promocoes/badges e sem hash.",
            assinatura,
            algoritmoAssinatura = AssinadorCurriculoVivo.Algoritmo,
            kid = AssinadorCurriculoVivo.KeyId,
            chavePublicaJwk = AssinadorCurriculoVivo.ChavePublicaJwk
        }
    });
});

app.Run();

static object ProjetarSessaoPublica(EstadoSessao estado) => new
{
    carreira = estado.Carreira,
    chamados = estado.Itsm.Chamados,
    problemas = estado.Itsm.Problemas,
    estacao = estado.Estacao,
    dialogo = estado.Dialogo,
    meta = new
    {
        cenarioId = estado.Meta.CenarioId,
        semente = estado.Meta.Semente,
        nivel = estado.Meta.Nivel,
        versaoManifesto = estado.Meta.VersaoManifesto,
        minutoSimulado = estado.Meta.MinutoSimulado,
        ultimoSeq = estado.Meta.UltimoSeq
    },
    ultimoSeq = estado.Meta.UltimoSeq
};

public sealed record CriarSessaoDto(string? CenarioId, string? VersaoManifesto, string? CausaForcada, long? Semente);
public sealed record ExecutarAcaoDto(string Tipo, IReadOnlyDictionary<string, JsonElement>? Dados, int SeqEsperado);
public sealed record ChatDto(string Persona, string Mensagem, int SeqEsperado);
public sealed record CarreiraResumoDto(IReadOnlyList<Guid>? SessaoIds, string? Apelido);

public partial class Program;
