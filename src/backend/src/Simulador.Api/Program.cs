using System.Text.Json;
using Simulador.Avaliacao;
using Simulador.Cenarios;
using Simulador.Dialogo;
using Simulador.Dominio;
using Simulador.Infra;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();
builder.Services.AddCors(opt =>
{
    opt.AddDefaultPolicy(p => p
        .WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
        .AllowAnyHeader()
        .AllowAnyMethod());
});

builder.Services.AddSingleton<ICatalogoCenarios, CatalogoCenarios>();
builder.Services.AddSingleton<IEventStore, InMemoryEventStore>();
builder.Services.AddSingleton<IClienteDialogo, FallbackRoteirizadoDialogo>();

var app = builder.Build();

app.UseExceptionHandler();
app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(opt => opt.SwaggerEndpoint("/openapi/v1.json", "IT Flight Simulator API v1"));
}

app.MapGet("/health/live", () => Results.Ok(new { status = "live" }));
app.MapGet("/health/ready", () => Results.Ok(new { status = "ready", store = "InMemory" }));

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
        return Results.BadRequest(new { erro = "cenario_ou_versao_invalida", cenarioId, versao });

    var semente = body?.Semente ?? DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    var cenario = catalogo.Obter(cenarioId, versao, body?.CausaForcada, semente);
    var inicio = Motor.Iniciar(cenario, semente);

    var sessaoId = Guid.NewGuid();
    var agora = DateTimeOffset.UtcNow;
    var registro = new RegistroSessao(
        sessaoId, semente, cenario.CenarioId, cenario.Causa, cenario.Nivel, cenario.VersaoManifesto, agora, agora.AddHours(24));

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
    if (meta is null) return Results.NotFound(new { erro = "sessao_nao_encontrada" });

    var estado = Projecao.Reconstruir(eventos, catalogo);
    return Results.Ok(new
    {
        carreira = estado.Carreira,
        chamados = estado.Itsm.Chamados,
        problemas = estado.Itsm.Problemas,
        estacao = estado.Estacao,
        dialogo = estado.Dialogo,
        meta = estado.Meta,
        ultimoSeq = estado.Meta.UltimoSeq
    });
});

app.MapPost("/api/sessoes/{id:guid}/acoes", async (
    Guid id,
    ExecutarAcaoDto? body,
    ICatalogoCenarios catalogo,
    IEventStore store,
    CancellationToken ct) =>
{
    if (body is null || string.IsNullOrWhiteSpace(body.Tipo) || body.SeqEsperado <= 0)
        return Results.BadRequest(new { erro = "requisicao_invalida", mensagem = "tipo e seqEsperado (> 0) sao obrigatorios." });

    var (meta, eventos) = await store.ObterSessaoAsync(id, ct);
    if (meta is null) return Results.NotFound(new { erro = "sessao_nao_encontrada" });

    if (eventos[^1].Seq != body.SeqEsperado)
        return Results.Conflict(new { ultimoSeq = eventos[^1].Seq });

    var cenario = catalogo.Obter(meta.CenarioId, meta.VersaoManifesto, meta.Causa, meta.Semente);
    var estadoAtual = Projecao.Reconstruir(eventos, catalogo);
    var acao = new Acao(body.Tipo.Trim(), body.Dados);
    var resultado = Motor.Aplicar(estadoAtual, acao, cenario);

    var anexar = await store.AnexarAsync(id, body.SeqEsperado, resultado.Eventos, ct);
    if (anexar.Conflito)
        return Results.Conflict(new { ultimoSeq = anexar.UltimoSeq });

    return Results.Ok(new
    {
        eventos = resultado.Eventos,
        projecao = new
        {
            carreira = resultado.NovoEstado.Carreira,
            chamados = resultado.NovoEstado.Itsm.Chamados,
            problemas = resultado.NovoEstado.Itsm.Problemas,
            estacao = resultado.NovoEstado.Estacao,
            dialogo = resultado.NovoEstado.Dialogo,
            meta = resultado.NovoEstado.Meta,
            ultimoSeq = resultado.NovoEstado.Meta.UltimoSeq
        }
    });
});

app.MapGet("/api/sessoes/{id:guid}/avaliacao", async (
    Guid id,
    ICatalogoCenarios catalogo,
    IEventStore store,
    CancellationToken ct) =>
{
    var (meta, eventos) = await store.ObterSessaoAsync(id, ct);
    if (meta is null) return Results.NotFound(new { erro = "sessao_nao_encontrada" });

    var estado = Projecao.Reconstruir(eventos, catalogo);
    var relatorio = Juiz360.Avaliar(estado, eventos);
    return Results.Ok(relatorio);
});

app.Run();

public sealed record CriarSessaoDto(string? CenarioId, string? VersaoManifesto, string? CausaForcada, long? Semente);
public sealed record ExecutarAcaoDto(string Tipo, IReadOnlyDictionary<string, JsonElement>? Dados, int SeqEsperado);

public partial class Program;
