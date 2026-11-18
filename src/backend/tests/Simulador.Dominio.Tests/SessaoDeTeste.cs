using System.Text.Json;
using Simulador.Avaliacao;
using Simulador.Cenarios;

namespace Simulador.Dominio.Tests;

/// <summary>Auxiliar de testes: acumula estado e Eventos como a funcao local Aplicar de DominioTests.</summary>
public sealed class SessaoDeTeste
{
    private static readonly CatalogoCenarios Catalogo = new();
    private readonly List<EnvelopeEvento> _eventos;

    private SessaoDeTeste(DefinicaoCenario cenario, ResultadoAplicacao inicio)
    {
        Cenario = cenario;
        Estado = inicio.NovoEstado;
        _eventos = [.. inicio.Eventos];
    }

    public DefinicaoCenario Cenario { get; }
    public EstadoSessao Estado { get; private set; }
    public IReadOnlyList<EnvelopeEvento> Eventos => _eventos;

    public static SessaoDeTeste Iniciar(string cenarioId, string versao, string? causa, long semente)
    {
        var cenario = Catalogo.Obter(cenarioId, versao, causa, semente);
        return new SessaoDeTeste(cenario, Motor.Iniciar(cenario, semente));
    }

    public static ICatalogoCenarios CatalogoCompartilhado => Catalogo;

    public ResultadoAplicacao Aplicar(string tipo, object? payload = null)
    {
        IReadOnlyDictionary<string, JsonElement>? dados = payload is null
            ? null
            : JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(JsonSerializer.Serialize(payload));
        var res = Motor.Aplicar(Estado, new Acao(tipo, dados), Cenario);
        Estado = res.NovoEstado;
        _eventos.AddRange(res.Eventos);
        return res;
    }

    public ResultadoAplicacao Comando(string texto) => Aplicar("estacao.executar_comando", new { comando = texto });

    public RelatorioAvaliacao Avaliar() => Juiz360.Avaliar(Estado, _eventos);

    public EstadoSessao Reconstruir() => Projecao.Reconstruir(_eventos, Catalogo);

    public string UltimaSaida() =>
        _eventos.Last(e => e.Tipo is "ComandoExecutado" or "ComandoNaoSuportado").Dados["saida"]?.ToString() ?? "";

    public IEnumerable<EnvelopeEvento> De(string tipo) => _eventos.Where(e => e.Tipo == tipo);
}
