using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Simulador.Cenarios;

namespace Simulador.Api.Tests;

public class CenariosPorEscalaApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public CenariosPorEscalaApiTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<(string Id, int Seq)> Criar(string cenarioId, string causa, long semente)
    {
        var resp = await _client.PostAsJsonAsync("/api/sessoes", new { cenarioId, causaForcada = causa, semente });
        Assert.Equal(HttpStatusCode.Created, resp.StatusCode);
        var corpo = await resp.Content.ReadFromJsonAsync<JsonElement>();
        return (corpo.GetProperty("sessaoId").GetString()!, corpo.GetProperty("ultimoSeq").GetInt32());
    }

    private async Task<int> Acao(string id, int seq, string tipo, object? dados = null)
    {
        var r = await _client.PostAsJsonAsync($"/api/sessoes/{id}/acoes", new { tipo, dados, seqEsperado = seq });
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        return (await r.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("projecao").GetProperty("ultimoSeq").GetInt32();
    }

    /// <summary>Semente cuja variante e o pedido direto da titular (sem terceiro).</summary>
    private static long SementeDireta()
    {
        var catalogo = new CatalogoCenarios();
        for (long s = 1; s < 1000; s++)
            if (!catalogo.Obter("reset-senha-desbloqueio", "v0.1-hackathon", "SENHA_ESQUECIDA", s).PedidoPorTerceiro) return s;
        throw new InvalidOperationException("Nenhuma semente encontrada.");
    }

    [Fact]
    public async Task ResetSenha_SenhaEsquecida_CriaSessaoEOcultaCausaNoReplayEmAndamento()
    {
        var (id, _) = await Criar("reset-senha-desbloqueio", "SENHA_ESQUECIDA", 42);
        var replay = await _client.GetFromJsonAsync<JsonElement>($"/api/sessoes/{id}/replay");
        Assert.Equal("v0.1-hackathon", replay.GetProperty("meta").GetProperty("versaoManifesto").GetString());
        Assert.Equal(JsonValueKind.Null, replay.GetProperty("meta").GetProperty("causa").ValueKind);
        Assert.False(replay.GetProperty("eventos")[0].GetProperty("payload").TryGetProperty("causa", out _));
    }

    [Fact]
    public async Task ResetSenha_SessaoConcluida_SomaXpNaCarreiraSemErroEMantemCargo()
    {
        var (id, seq) = await Criar("reset-senha-desbloqueio", "SENHA_ESQUECIDA", SementeDireta());
        seq = await Acao(id, seq, "itsm.assumir_chamado", new { chamadoId = "CH-0001" });
        seq = await Acao(id, seq, "itsm.classificar_chamado", new { chamadoId = "CH-0001", categoria = "Acesso", urgencia = "Alta", impacto = "Medio" });
        seq = await Acao(id, seq, "estacao.executar_comando", new { comando = "net user fernanda.lima" });
        seq = await Acao(id, seq, "dialogo.verificar_identidade", new { matricula = "AUR-2087", ramal = "2087" });
        seq = await Acao(id, seq, "estacao.executar_comando", new { comando = "redefinir-senha fernanda.lima" });
        seq = await Acao(id, seq, "itsm.resolver_chamado", new { chamadoId = "CH-0001", notaPublica = "Senha temporaria entregue a titular." });

        var av = await _client.GetFromJsonAsync<JsonElement>($"/api/sessoes/{id}/avaliacao");
        Assert.True(av.GetProperty("concluida").GetBoolean());
        Assert.False(av.GetProperty("incidenteSeguranca").GetBoolean());

        var resp = await _client.PostAsJsonAsync("/api/carreira/resumo", new { sessaoIds = new[] { id } });
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var corpo = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(90, corpo.GetProperty("xpTotal").GetInt32());
        Assert.Equal("Estagiario", corpo.GetProperty("cargoAtual").GetString());
    }

    [Fact]
    public async Task ResetSenha_ComandoForaDoEscopo_RetornaOkSemMudarContaNaProjecao()
    {
        var (id, seq) = await Criar("reset-senha-desbloqueio", "SENHA_ESQUECIDA", 42);
        var r = await _client.PostAsJsonAsync($"/api/sessoes/{id}/acoes", new
        {
            tipo = "estacao.executar_comando",
            dados = new { comando = "format c:" },
            seqEsperado = seq
        });
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        var corpo = await r.Content.ReadFromJsonAsync<JsonElement>();
        var contas = corpo.GetProperty("projecao").GetProperty("estacao").GetProperty("servicos").EnumerateArray()
            .Where(x => x.GetProperty("nome").GetString() == "ContaAD").ToArray();
        Assert.Single(contas);
        Assert.Equal("Ativa", contas[0].GetProperty("status").GetString());
    }

    [Fact]
    public async Task CenarioDesconhecidoOuVersaoErrada_Retorna400()
    {
        var resp = await _client.PostAsJsonAsync("/api/sessoes", new { cenarioId = "reset-senha-desbloqueio", versaoManifesto = "v9" });
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task PastaRede_C4Forcada_CriaSessaoComVersaoEUnidadeNaoMapeada()
    {
        var resp = await _client.PostAsJsonAsync("/api/sessoes", new { cenarioId = "pasta-rede-inacessivel", causaForcada = "C4", semente = 42 });
        Assert.Equal(HttpStatusCode.Created, resp.StatusCode);
        var corpo = await resp.Content.ReadFromJsonAsync<JsonElement>();
        var id = corpo.GetProperty("sessaoId").GetString()!;
        var replay = await _client.GetFromJsonAsync<JsonElement>($"/api/sessoes/{id}/replay");
        Assert.Equal(JsonValueKind.Null, replay.GetProperty("meta").GetProperty("causa").ValueKind);
    }}
