using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Simulador.Cenarios;

namespace Simulador.Api.Tests;

/// <summary>
/// A aparência (tema e contraste) é decisão do navegador e nunca entra nos eventos do motor. Para cada
/// cenário do catálogo, o teste cria a sessão pela API, executa algumas ações e percorre cada evento do replay:
/// falha se algum valor de texto for exatamente um identificador do catálogo de temas ou se alguma chave
/// for um nome de aparência. A comparação é por valor exato: palavras comuns em texto livre não contam.
/// </summary>
public class SeparacaoAparenciaTests : IClassFixture<WebApplicationFactory<Program>>
{
    /// <summary>Identificadores do Catálogo_de_Temas do frontend, mais a telemetria prevista.</summary>
    private static readonly string[] ValoresProibidos = ["operacao", "corporativo", "editorial", "acolhedor", "telemetria"];

    private static readonly string[] ChavesProibidas = ["tema", "theme", "contraste", "contrast", "itfs_tema", "itfs_contraste"];

    /// <summary>Cenário e versão de manifesto que a API aceita. A lista acompanha SuportaVersao de CatalogoCenarios.</summary>
    public static TheoryData<string, string> Cenarios() => new()
    {
        { "pasta-rede-inacessivel", "v1.1" },
        { "triagem-engenharia-social", "v0.1-hackathon" },
        { "incidente-massivo", "v0.1-hackathon" },
        { "sre-cloud-latencia", "v2.0" },
        { "diagnostico-sql-readonly", "v2.0" },
        { "reset-senha-desbloqueio", "v0.1-hackathon" },
        { "falha-backup-restore", "v0.1-hackathon" },
    };

    private readonly HttpClient _client;

    public SeparacaoAparenciaTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Theory]
    [MemberData(nameof(Cenarios))]
    public async Task Replay_NaoContemNomeNemValorDeAparencia(string cenarioId, string versao)
    {
        Assert.True(new CatalogoCenarios().SuportaVersao(cenarioId, versao), $"O catálogo não suporta {cenarioId} {versao}.");

        var criada = await _client.PostAsJsonAsync("/api/sessoes", new { cenarioId, versaoManifesto = versao, semente = 42 });
        Assert.True(criada.IsSuccessStatusCode, $"Criar sessão de {cenarioId}: {(int)criada.StatusCode}");
        var corpo = await criada.Content.ReadFromJsonAsync<JsonElement>();
        var id = corpo.GetProperty("sessaoId").GetString()!;
        var seq = corpo.GetProperty("ultimoSeq").GetInt32();

        seq = await Acao(id, seq, "itsm.assumir_chamado", new { chamadoId = "CH-0001" });
        await Acao(id, seq, "estacao.executar_comando", new { comando = "whoami" });

        var replay = await _client.GetFromJsonAsync<JsonElement>($"/api/sessoes/{id}/replay");
        var eventos = replay.GetProperty("eventos");
        Assert.True(eventos.GetArrayLength() > 0, $"Replay de {cenarioId} sem eventos.");

        foreach (var evento in eventos.EnumerateArray())
        {
            var tipo = evento.TryGetProperty("tipo", out var t) ? t.GetString() : "(sem tipo)";
            var achados = new List<string>();
            Percorrer(evento, "$", achados);
            Assert.True(
                achados.Count == 0,
                $"Evento '{tipo}' do cenário '{cenarioId}' tem aparência: {string.Join("; ", achados)}");
        }
    }

    /// <summary>Executa uma ação e devolve o novo último seq. Ação recusada pelo motor também gera evento, então só 5xx falha.</summary>
    private async Task<int> Acao(string id, int seq, string tipo, object dados)
    {
        var resposta = await _client.PostAsJsonAsync($"/api/sessoes/{id}/acoes", new { tipo, dados, seqEsperado = seq });
        Assert.True((int)resposta.StatusCode < 500, $"Ação {tipo}: {(int)resposta.StatusCode}");
        if (!resposta.IsSuccessStatusCode) return seq;
        var json = await resposta.Content.ReadFromJsonAsync<JsonElement>();
        return json.GetProperty("projecao").GetProperty("ultimoSeq").GetInt32();
    }

    private static void Percorrer(JsonElement no, string caminho, List<string> achados)
    {
        switch (no.ValueKind)
        {
            case JsonValueKind.Object:
                foreach (var propriedade in no.EnumerateObject())
                {
                    if (Array.IndexOf(ChavesProibidas, propriedade.Name) >= 0)
                        achados.Add($"chave '{propriedade.Name}' em {caminho}");
                    Percorrer(propriedade.Value, $"{caminho}.{propriedade.Name}", achados);
                }
                break;
            case JsonValueKind.Array:
                var indice = 0;
                foreach (var item in no.EnumerateArray())
                    Percorrer(item, $"{caminho}[{indice++}]", achados);
                break;
            case JsonValueKind.String:
                var valor = no.GetString();
                if (valor is not null && Array.IndexOf(ValoresProibidos, valor) >= 0)
                    achados.Add($"valor '{valor}' em {caminho}");
                break;
        }
    }
}
