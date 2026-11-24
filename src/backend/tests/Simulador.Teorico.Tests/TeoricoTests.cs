using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Simulador.Teorico;

namespace Simulador.Teorico.Tests;

public class BancoTests
{
    private static readonly BancoQuestoes Banco = BancoQuestoes.Padrao;

    [Fact]
    public void TemPeloMenos60QuestoesEDezPorDominio()
    {
        Assert.True(Banco.Todas.Count >= 60);
        foreach (var d in Banco.Dominios)
            Assert.Equal(10, Banco.Todas.Count(q => q.Dominio == d.Id));
    }

    [Fact]
    public void IdsSaoUnicosENiveisFicamEntre1e3ComTodosOsNiveisPorDominio()
    {
        Assert.Equal(Banco.Todas.Count, Banco.Todas.Select(q => q.Id).Distinct().Count());
        Assert.All(Banco.Todas, q => Assert.InRange(q.Nivel, 1, 3));
        foreach (var d in Banco.Dominios)
            Assert.Equal(3, Banco.Todas.Where(q => q.Dominio == d.Id).Select(q => q.Nivel).Distinct().Count());
    }

    [Fact]
    public void CadaQuestaoTemGabaritoValidoEExplicacaoEstruturada()
    {
        foreach (var q in Banco.Todas)
        {
            Assert.NotEmpty(q.Corretas);
            Assert.True(q.Corretas.IsSubsetOf(q.Alternativas.Select(a => a.Id).ToHashSet()), q.Id);
            Assert.False(string.IsNullOrWhiteSpace(q.Explicacao.Correta), q.Id);
            Assert.StartsWith("https://", q.Explicacao.Referencia);
            var incorretas = q.Alternativas.Select(a => a.Id).Where(i => !q.Corretas.Contains(i)).ToHashSet();
            Assert.True(incorretas.SetEquals(q.Explicacao.Incorretas.Select(i => i.AlternativaId)), q.Id);
            Assert.All(q.Explicacao.Incorretas, i => Assert.False(string.IsNullOrWhiteSpace(i.Texto)));
        }
    }

    [Fact]
    public void CatalogoSomaTodasAsQuestoes()
    {
        var c = Banco.Catalogo();
        Assert.Equal(6, c.Dominios.Count);
        Assert.Equal(c.Total, c.Dominios.Sum(d => d.Topicos.Sum(t => t.Questoes)));
    }
}

public class ServicoTests
{
    private static readonly ServicoTeorico Servico = new(BancoQuestoes.Padrao);

    [Fact]
    public void ProvaPadraoCompletaTem40QuestoesE60Minutos()
    {
        var p = Servico.GerarProva(new CriarProvaRequest("padrao", "completo", null, null, null, 7));
        Assert.Equal(40, p.Questoes.Count);
        Assert.Equal(3600, p.DuracaoSegundos);
        Assert.Equal(70, p.NotaAprovacao);
        Assert.Equal(6, p.Questoes.Select(q => q.Dominio).Distinct().Count());
    }

    [Fact]
    public void ProvaIsDeterministicaPorSemente()
    {
        var a = Servico.GerarProva(new CriarProvaRequest("pratica", "completo", null, null, 20, 123));
        var b = Servico.GerarProva(new CriarProvaRequest("pratica", "completo", null, null, 20, 123));
        var c = Servico.GerarProva(new CriarProvaRequest("pratica", "completo", null, null, 20, 124));
        Assert.Equal(a.ProvaId, b.ProvaId);
        Assert.Equal(a.Questoes.Select(q => q.Id), b.Questoes.Select(q => q.Id));
        Assert.Equal(a.Questoes.SelectMany(q => q.Alternativas.Select(x => x.Id)), b.Questoes.SelectMany(q => q.Alternativas.Select(x => x.Id)));
        Assert.NotEqual(a.Questoes.Select(q => q.Id), c.Questoes.Select(q => q.Id));
        Assert.Null(a.DuracaoSegundos);
    }

    [Fact]
    public void PersonalizadaFiltraTopicoENivel()
    {
        var p = Servico.GerarProva(new CriarProvaRequest("pratica", "personalizado", ["redes"], 2, 50, 1));
        Assert.NotEmpty(p.Questoes);
        Assert.All(p.Questoes, q => { Assert.Equal("redes", q.Dominio); Assert.Equal(2, q.Nivel); });
    }

    [Fact]
    public void QuantidadeMaiorQueODisponivelEhLimitada()
    {
        var p = Servico.GerarProva(new CriarProvaRequest("padrao", "completo", null, null, 100, 1));
        Assert.Equal(BancoQuestoes.Padrao.Todas.Count, p.Questoes.Count);
    }

    [Theory]
    [InlineData("rapido", "completo", null, null)]
    [InlineData("padrao", "outro", null, null)]
    [InlineData("padrao", "completo", 0, null)]
    [InlineData("padrao", "completo", null, 4)]
    public void ParametrosInvalidosViram400(string formato, string escopo, int? quantidade, int? nivel)
    {
        var e = Assert.Throws<ErroTeorico>(() => Servico.GerarProva(new CriarProvaRequest(formato, escopo, null, nivel, quantidade, 1)));
        Assert.Equal(400, e.Status);
    }

    [Fact]
    public void TopicoDesconhecidoEFiltroVazioViram400()
    {
        Assert.Equal("topico_desconhecido", Assert.Throws<ErroTeorico>(() =>
            Servico.GerarProva(new CriarProvaRequest("pratica", "personalizado", ["inexistente"], null, 5, 1))).Tipo);
    }

    [Fact]
    public void ProvaPublicaNaoExpoeGabarito()
    {
        var p = Servico.GerarProva(new CriarProvaRequest("padrao", "completo", null, null, 5, 1));
        var json = JsonSerializer.Serialize(p);
        Assert.DoesNotContain("corretas", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("gabarito", json, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void VerificarAcertaEErraConformeGabarito()
    {
        var q = BancoQuestoes.Padrao.Obter("ac-01")!;
        var certa = q.Corretas.ToArray();
        Assert.True(Servico.Verificar("ac-01", new VerificarRequest(certa)).Correta);
        var errada = q.Alternativas.First(a => !q.Corretas.Contains(a.Id)).Id;
        var r = Servico.Verificar("ac-01", new VerificarRequest([errada]));
        Assert.False(r.Correta);
        Assert.Equal(q.Corretas.OrderBy(x => x), r.Gabarito);
    }

    [Fact]
    public void MultiplaEscolhaExigeConjuntoExato()
    {
        var q = BancoQuestoes.Padrao.Obter("ac-06")!;
        Assert.Equal("multipla", q.Selecao);
        Assert.True(Servico.Verificar("ac-06", new VerificarRequest(["a", "b"])).Correta);
        Assert.False(Servico.Verificar("ac-06", new VerificarRequest(["a"])).Correta);
        Assert.False(Servico.Verificar("ac-06", new VerificarRequest(["a", "b", "c"])).Correta);
    }

    [Fact]
    public void VerificarRejeitaIdsInexistentes()
    {
        Assert.Equal(404, Assert.Throws<ErroTeorico>(() => Servico.Verificar("zz-99", new VerificarRequest(["a"]))).Status);
        Assert.Equal(400, Assert.Throws<ErroTeorico>(() => Servico.Verificar("ac-01", new VerificarRequest(["z"]))).Status);
    }

    [Fact]
    public void CorrigirCalculaPercentualPorDominioEAprovacao()
    {
        var prova = Servico.GerarProva(new CriarProvaRequest("padrao", "completo", null, null, 10, 5));
        var todasCertas = prova.Questoes
            .Select(x => new RespostaQuestao(x.Id, BancoQuestoes.Padrao.Obter(x.Id)!.Corretas.ToArray())).ToArray();
        var cheia = Servico.Corrigir(new CorrigirRequest(5, "padrao", "completo", todasCertas));
        Assert.Equal(10, cheia.Total);
        Assert.Equal(100, cheia.Percentual);
        Assert.True(cheia.Aprovado);
        Assert.Equal(10, cheia.PorDominio.Sum(d => d.Total));

        var emBranco = prova.Questoes.Select(x => new RespostaQuestao(x.Id, [])).ToArray();
        var zero = Servico.Corrigir(new CorrigirRequest(5, "padrao", "completo", emBranco));
        Assert.Equal(0, zero.Corretas);
        Assert.False(zero.Aprovado);
    }

    [Fact]
    public void ExatamenteSetentaPorCentoAprova()
    {
        var ids = BancoQuestoes.Padrao.Todas.Where(q => q.Dominio == "redes").Select(q => q.Id).ToArray();
        var respostas = ids.Select((id, i) => new RespostaQuestao(id, i < 7 ? BancoQuestoes.Padrao.Obter(id)!.Corretas.ToArray() : [])).ToArray();
        var r = Servico.Corrigir(new CorrigirRequest(1, "padrao", "personalizado", respostas));
        Assert.Equal(70, r.Percentual);
        Assert.True(r.Aprovado);
    }

    [Fact]
    public void CorrigirValidaEntrada()
    {
        Assert.Equal(400, Assert.Throws<ErroTeorico>(() => Servico.Corrigir(null)).Status);
        Assert.Equal(400, Assert.Throws<ErroTeorico>(() => Servico.Corrigir(new CorrigirRequest(1, "padrao", "completo", []))).Status);
        Assert.Equal(400, Assert.Throws<ErroTeorico>(() => Servico.Corrigir(new CorrigirRequest(1, "padrao", "completo",
            [new RespostaQuestao("ac-01", ["a"]), new RespostaQuestao("ac-01", ["b"])]))).Status);
        Assert.Equal(404, Assert.Throws<ErroTeorico>(() => Servico.Corrigir(new CorrigirRequest(1, "padrao", "completo",
            [new RespostaQuestao("nao-existe", ["a"])]))).Status);
    }

    [Theory]
    [InlineData("simples")]
    [InlineData("exemplo")]
    [InlineData("por-que-erradas")]
    public void ExplicarDevolveTextoEstaticoComOrigemFallback(string estilo)
    {
        var r = Servico.Explicar("re-02", new ExplicarRequest(estilo));
        Assert.Equal("fallback", r.Origem);
        Assert.False(string.IsNullOrWhiteSpace(r.Texto));
    }

    [Fact]
    public void ExplicarRejeitaEstiloInvalidoEQuestaoInexistente()
    {
        Assert.Equal(400, Assert.Throws<ErroTeorico>(() => Servico.Explicar("re-02", new ExplicarRequest("xpto"))).Status);
        Assert.Equal(404, Assert.Throws<ErroTeorico>(() => Servico.Explicar("nada", new ExplicarRequest("simples"))).Status);
    }
}

public class TeoricoApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public TeoricoApiTests(WebApplicationFactory<Program> factory) => _client = factory.CreateClient();

    [Fact]
    public async Task TopicosListaSeisDominios()
    {
        var json = await _client.GetFromJsonAsync<JsonElement>("/api/teorico/topicos");
        Assert.Equal(6, json.GetProperty("dominios").GetArrayLength());
        Assert.True(json.GetProperty("total").GetInt32() >= 60);
    }

    [Fact]
    public async Task FluxoCompletoDeProvaSemGabaritoNoPayload()
    {
        var resp = await _client.PostAsJsonAsync("/api/teorico/provas", new { formato = "padrao", escopo = "completo", quantidade = 5, semente = 9 });
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var texto = await resp.Content.ReadAsStringAsync();
        Assert.DoesNotContain("gabarito", texto, StringComparison.OrdinalIgnoreCase);
        var prova = JsonDocument.Parse(texto).RootElement;
        Assert.Equal(5, prova.GetProperty("questoes").GetArrayLength());
        Assert.Equal(450, prova.GetProperty("duracaoSegundos").GetInt32());

        var respostas = prova.GetProperty("questoes").EnumerateArray()
            .Select(q => new { questaoId = q.GetProperty("id").GetString(), respostas = Array.Empty<string>() }).ToArray();
        var corr = await _client.PostAsJsonAsync("/api/teorico/provas/corrigir", new { semente = 9, formato = "padrao", escopo = "completo", respostas });
        Assert.Equal(HttpStatusCode.OK, corr.StatusCode);
        var c = await corr.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(5, c.GetProperty("total").GetInt32());
        Assert.False(c.GetProperty("aprovado").GetBoolean());
    }

    [Fact]
    public async Task VerificarEExplicarFuncionam()
    {
        var v = await _client.PostAsJsonAsync("/api/teorico/questoes/ac-01/verificar", new { respostas = new[] { "b" } });
        var vj = await v.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(vj.TryGetProperty("gabarito", out _));
        Assert.True(vj.GetProperty("explicacao").TryGetProperty("referencia", out _));

        var e = await _client.PostAsJsonAsync("/api/teorico/questoes/ac-01/explicar", new { estilo = "simples" });
        var ej = await e.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("fallback", ej.GetProperty("origem").GetString());
    }

    [Fact]
    public async Task ErrosUsamFormatoProblema()
    {
        var nao = await _client.PostAsJsonAsync("/api/teorico/questoes/xx-00/verificar", new { respostas = new[] { "a" } });
        Assert.Equal(HttpStatusCode.NotFound, nao.StatusCode);
        Assert.Equal("questao_nao_encontrada", (await nao.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("type").GetString());

        var ruim = await _client.PostAsJsonAsync("/api/teorico/provas", new { formato = "x" });
        Assert.Equal(HttpStatusCode.BadRequest, ruim.StatusCode);
    }
}
