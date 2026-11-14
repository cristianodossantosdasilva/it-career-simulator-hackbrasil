using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Simulador.Api.Tests;

public class ApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ApiTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task HealthLive_Retorna200()
    {
        var resp = await _client.GetAsync("/health/live");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task FluxoHttpCompleto_C1_RetornaAvaliacaoAprovadaEConflito409()
    {
        var createResp = await _client.PostAsJsonAsync("/api/sessoes", new
        {
            cenarioId = "pasta-rede-inacessivel",
            versaoManifesto = "v1.1",
            causaForcada = "C1",
            semente = 42L
        });
        Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);

        var created = await createResp.Content.ReadFromJsonAsync<JsonElement>();
        var sessaoId = created.GetProperty("sessaoId").GetString()!;
        var seq = created.GetProperty("ultimoSeq").GetInt32();
        Assert.Equal(6, seq); // 1 SessaoIniciada + 5 ChamadoAberto

        // Teste de conflito 409 com seqEsperado defasado
        var conflictResp = await _client.PostAsJsonAsync($"/api/sessoes/{sessaoId}/acoes", new
        {
            tipo = "itsm.assumir_chamado",
            dados = new { chamadoId = "CH-0001" },
            seqEsperado = 1
        });
        Assert.Equal(HttpStatusCode.Conflict, conflictResp.StatusCode);

        async Task<int> Acao(string tipo, object? dados = null)
        {
            var r = await _client.PostAsJsonAsync($"/api/sessoes/{sessaoId}/acoes", new { tipo, dados, seqEsperado = seq });
            Assert.Equal(HttpStatusCode.OK, r.StatusCode);
            var body = await r.Content.ReadFromJsonAsync<JsonElement>();
            return body.GetProperty("projecao").GetProperty("ultimoSeq").GetInt32();
        }

        seq = await Acao("itsm.assumir_chamado", new { chamadoId = "CH-0001" });
        seq = await Acao("itsm.classificar_chamado", new { chamadoId = "CH-0001", categoria = "Acesso", urgencia = "Alta", impacto = "Medio" });
        seq = await Acao("estacao.executar_comando", new { comando = "whoami /groups" });
        seq = await Acao("estacao.elevar_privilegio");
        seq = await Acao("estacao.adicionar_usuario_grupo", new { usuario = "maria.souza", grupo = "GRP_FINANCEIRO_PASTA" });
        seq = await Acao("itsm.resolver_chamado", new { chamadoId = "CH-0001", notaPublica = "Acesso restabelecido." });

        var avResp = await _client.GetAsync($"/api/sessoes/{sessaoId}/avaliacao");
        Assert.Equal(HttpStatusCode.OK, avResp.StatusCode);
        var av = await avResp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(av.GetProperty("concluida").GetBoolean());
        Assert.False(av.GetProperty("incidenteSeguranca").GetBoolean());
        foreach (var c in av.GetProperty("criterios").EnumerateArray())
        {
            Assert.True(c.GetProperty("atendido").GetBoolean());
        }
    }
}
