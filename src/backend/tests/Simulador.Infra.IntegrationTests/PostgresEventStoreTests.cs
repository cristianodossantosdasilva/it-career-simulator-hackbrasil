using System.Text.Json;
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Simulador.Avaliacao;
using Simulador.Cenarios;
using Simulador.Dominio;
using Simulador.Infra;

namespace Simulador.Infra.IntegrationTests;

[Trait("Category", "PostgresIntegration")]
public sealed class PostgresEventStoreTests
{
    private static string ConnectionString =>
        Environment.GetEnvironmentVariable("SIMULADOR_TEST_POSTGRES")
        ?? throw new InvalidOperationException("Defina SIMULADOR_TEST_POSTGRES para executar os testes de integração PostgreSQL.");

    [Fact]
    public async Task ReconstrucaoPostgres_EEquivalenteAoInMemory_X12()
    {
        var postgres = await NovoStore();
        var memoria = new InMemoryEventStore();
        var sessao = NovaSessao();
        var iniciais = EventosIniciais();
        await postgres.CriarSessaoAsync(sessao, iniciais);
        await memoria.CriarSessaoAsync(sessao, iniciais);
        var complemento = new EnvelopeEvento(2, "ChamadoAssumido", new Dictionary<string, object?> { ["chamadoId"] = "CH-0001" }, 1);
        Assert.True((await postgres.AnexarAsync(sessao.Id, 1, [complemento])).Sucesso);
        Assert.True((await memoria.AnexarAsync(sessao.Id, 1, [complemento])).Sucesso);

        var (_, eventosPg) = await postgres.ObterSessaoAsync(sessao.Id);
        var (_, eventosMemoria) = await memoria.ObterSessaoAsync(sessao.Id);
        Assert.Equal(JsonSerializer.Serialize(eventosMemoria), JsonSerializer.Serialize(eventosPg));
        var catalogo = new CatalogoCenarios();
        var estadoPg = Projecao.Reconstruir(eventosPg, catalogo);
        var estadoMemoria = Projecao.Reconstruir(eventosMemoria, catalogo);
        Assert.Equal(JsonSerializer.Serialize(estadoMemoria), JsonSerializer.Serialize(estadoPg));
        Assert.Equal(Hash(eventosMemoria), Hash(eventosPg));
    }

    [Fact]
    public async Task AnexarConcorrente_ComMesmoSeqEsperado_GravaUmaUnicaTrilhaSemParcialidade()
    {
        var store = await NovoStore();
        var sessao = NovaSessao();
        await store.CriarSessaoAsync(sessao, EventosIniciais());
        var a = new EnvelopeEvento(2, "NotaChamadoAdicionada", new Dictionary<string, object?> { ["chamadoId"] = "CH-0001", ["tipo"] = "Interna", ["texto"] = "evidencia A" }, 1);
        var b = a with { Dados = new Dictionary<string, object?> { ["chamadoId"] = "CH-0001", ["tipo"] = "Interna", ["texto"] = "evidencia B" } };

        var resultados = await Task.WhenAll(store.AnexarAsync(sessao.Id, 1, [a]), store.AnexarAsync(sessao.Id, 1, [b]));
        Assert.Single(resultados, x => x.Sucesso);
        Assert.Single(resultados, x => x.Conflito);
        var (_, eventos) = await store.ObterSessaoAsync(sessao.Id);
        Assert.Equal(2, eventos.Count);
        Assert.Equal(2, eventos[^1].Seq);
        Assert.Contains(eventos[^1].Dados["texto"]?.ToString(), new[] { "evidencia A", "evidencia B" });
    }

    [Fact]
    public async Task Store_PersisteExpiracaoParaContrato410()
    {
        var store = await NovoStore();
        var expirada = NovaSessao() with { ExpiraEm = DateTimeOffset.UtcNow.AddDays(-1) };
        await store.CriarSessaoAsync(expirada, EventosIniciais());
        var (lida, _) = await store.ObterSessaoAsync(expirada.Id);
        Assert.NotNull(lida);
        Assert.True(lida!.ExpiraEm < DateTimeOffset.UtcNow);
    }

    [Fact]
    public async Task Api_Responde410ParaSessaoExpiradaNoPostgres()
    {
        var connectionString = ConnectionString;
        var store = new PostgresEventStore(connectionString);
        await store.InicializarSchemaAsync();
        using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["EventStore:Provedor"] = "Postgres",
                ["ConnectionStrings:Postgres"] = connectionString
            })));
        using var client = factory.CreateClient();
        var create = await client.PostAsJsonAsync("/api/sessoes", new { cenarioId = "pasta-rede-inacessivel", versaoManifesto = "v1.1", causaForcada = "C1", semente = 801L });
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        using var body = JsonDocument.Parse(await create.Content.ReadAsStringAsync());
        var id = body.RootElement.GetProperty("sessaoId").GetGuid();
        await using (var conn = new NpgsqlConnection(connectionString))
        {
            await conn.OpenAsync();
            await using var cmd = new NpgsqlCommand("UPDATE sessoes SET expira_em = @expira WHERE id = @id", conn);
            cmd.Parameters.AddWithValue("expira", DateTimeOffset.UtcNow.AddSeconds(-1));
            cmd.Parameters.AddWithValue("id", id);
            Assert.Equal(1, await cmd.ExecuteNonQueryAsync());
        }
        var response = await client.GetAsync($"/api/sessoes/{id}");
        Assert.Equal(HttpStatusCode.Gone, response.StatusCode);
    }

    [Fact]
    public void ConsoleN4b_NaoReferenciaInfraDeBanco()
    {
        var dominio = typeof(Motor).Assembly;
        Assert.DoesNotContain(dominio.GetReferencedAssemblies(), a => a.Name is not null &&
            (a.Name.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) || a.Name.Contains("SqlClient", StringComparison.OrdinalIgnoreCase) || a.Name.Contains("EntityFramework", StringComparison.OrdinalIgnoreCase)));
        Assert.DoesNotContain(dominio.GetTypes(), t => t.Name.Contains("EventStore", StringComparison.OrdinalIgnoreCase) || t.Name.Contains("Repository", StringComparison.OrdinalIgnoreCase));
        var sql = new CatalogoCenarios().Obter("diagnostico-sql-readonly", "v2.0", null, 17);
        var antes = Motor.Iniciar(sql, 17).NovoEstado;
        var depois = Motor.Aplicar(antes, new Acao("estacao.executar_comando", DadosJson(new { comando = "SELECT * FROM pedidos" })), sql);
        Assert.Equal(antes.Estacao, depois.NovoEstado.Estacao);
        Assert.Contains(depois.Eventos, e => e.Tipo == "ComandoExecutado");
    }

    private static async Task<PostgresEventStore> NovoStore()
    {
        var store = new PostgresEventStore(ConnectionString);
        await store.InicializarSchemaAsync();
        return store;
    }

    private static RegistroSessao NovaSessao() => new(Guid.NewGuid(), 17, "pasta-rede-inacessivel", "C1", "N1", "v1.1", DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(30));

    private static IReadOnlyList<EnvelopeEvento> EventosIniciais() => [new EnvelopeEvento(1, "SessaoIniciada", Dados(new { cenarioId = "pasta-rede-inacessivel", causa = "C1", versaoManifesto = "v1.1", semente = 17L }), 0)];

    private static Dictionary<string, object?> Dados(object value) => JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(JsonSerializer.Serialize(value))!
        .ToDictionary(kv => kv.Key, kv => kv.Value.ValueKind switch
        {
            JsonValueKind.String => (object?)kv.Value.GetString(),
            JsonValueKind.Number when kv.Value.TryGetInt64(out var n) => n,
            _ => kv.Value.ToString()
        });

    private static IReadOnlyDictionary<string, JsonElement> DadosJson(object value) =>
        JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(JsonSerializer.Serialize(value))!;

    private static string Hash(IReadOnlyList<EnvelopeEvento> eventos) => Juiz360.Avaliar(Projecao.Reconstruir(eventos, new CatalogoCenarios()), eventos).CurriculoVivo.HashAuditoriaSha256;
}
