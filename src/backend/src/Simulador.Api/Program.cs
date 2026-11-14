using System.Text.Json;
using System.Text.Json.Serialization;
using Simulador.Avaliacao;
using Simulador.Cenarios;
using Simulador.Dialogo;
using Simulador.Dominio;
using Simulador.Infra;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(opt =>
{
    opt.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();
builder.Services.AddCors(opt =>
{
    opt.AddDefaultPolicy(p => p
        .WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
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

var app = builder.Build();

if (pgStore is not null)
{
    await pgStore.InicializarSchemaAsync();
}
else
{
    app.Logger.LogWarning("EventStore operando em modo InMemory (Development).");
}

app.UseExceptionHandler();
app.UseCors();

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
        await pgStore.VerificarSaudeAsync(ct);
        return Results.Ok(new { status = "ready", store = "Postgres" });
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
        ? (cenarioId == "pasta-rede-inacessivel" ? "v1.1" : "v0.1-hackathon")
        : body.VersaoManifesto.Trim();

    if (!catalogo.SuportaVersao(cenarioId, versao))
        return ErroProblema(400, "nivel_indisponivel", $"Cenario '{cenarioId}' versao '{versao}' nao suportado.");

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

    var estado = Projecao.Reconstruir(eventos, catalogo);
    return Results.Ok(ProjetarSessaoPublica(estado));
});

app.MapPost("/api/sessoes/{id:guid}/acoes", async (
    Guid id,
    ExecutarAcaoDto? body,
    ICatalogoCenarios catalogo,
    IEventStore store,
    CancellationToken ct) =>
{
    if (body is null || string.IsNullOrWhiteSpace(body.Tipo) || body.SeqEsperado <= 0)
        return ErroProblema(400, "validacao", "tipo e seqEsperado (> 0) sao obrigatorios.");

    var (meta, eventos) = await store.ObterSessaoAsync(id, ct);
    if (meta is null) return ErroProblema(404, "sessao_nao_encontrada", "Sessao nao encontrada.");

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
            payload = e.Dados,
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
    var xpTotal = 0;
    var competencias = new HashSet<string>(StringComparer.Ordinal);
    var concluiuN1 = false;
    var concluiuN2 = false;
    var concluiuN3 = false;

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
        xpTotal += av.XpTotal;
        foreach (var comp in av.CurriculoVivo.CompetenciasComprovadas)
            competencias.Add(comp);

        if (meta.CenarioId == "triagem-engenharia-social" && av.Concluida && !av.IncidenteSeguranca)
            concluiuN1 = true;
        if (meta.CenarioId == "pasta-rede-inacessivel" && av.Concluida && av.Criterios.FirstOrDefault(c => c.Id == "J2")?.Atendido == true)
            concluiuN2 = true;
        if (meta.CenarioId == "incidente-massivo" && av.Concluida)
            concluiuN3 = true;

        sessoesConfirmadas.Add(new
        {
            sessaoId = id,
            cenarioId = meta.CenarioId,
            nivel = meta.Nivel,
            concluida = av.Concluida,
            xp = av.XpTotal,
            hashSessao = av.CurriculoVivo.HashAuditoriaSha256
        });
    }

    var cargoAtual = concluiuN3 ? "Analista Pleno (N2) - Jornada Concluida"
        : concluiuN2 ? "Analista Pleno (N2)"
        : concluiuN1 ? "Analista Jr (N1)"
        : "Estagiario";

    var nucleo = new
    {
        cargoAtual,
        xpTotal,
        competencias = competencias.OrderBy(c => c, StringComparer.Ordinal).ToArray(),
        sessoesConfirmadas
    };
    var jsonNucleo = JsonSerializer.Serialize(nucleo);
    var hash = Convert.ToHexStringLower(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(jsonNucleo)));

    return Results.Ok(new
    {
        apelido = string.IsNullOrWhiteSpace(body?.Apelido) ? null : body.Apelido.Trim(),
        cargoAtual,
        xpTotal,
        promocoes = new { nivel1Concluido = concluiuN1, nivel2Concluido = concluiuN2, nivel3Concluido = concluiuN3 },
        competencias = nucleo.competencias,
        sessoesConfirmadas,
        sessoesNaoConfirmadas,
        integridade = new
        {
            hash,
            algoritmo = "SHA-256",
            regraHash = "SHA-256 sobre UTF-8 do JSON canonico {cargoAtual, xpTotal, competencias[], sessoesConfirmadas[]} sem apelido e sem hash."
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
