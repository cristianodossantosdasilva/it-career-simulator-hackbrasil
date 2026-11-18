namespace Simulador.Dominio;

/// <summary>
/// Efeito de cada Evento dos cenarios por escala sobre o estado da estacao e do dialogo.
/// Usado pelo Motor (ao dobrar os Eventos de um comando) e pela Projecao (ao reconstruir a sessao),
/// de modo que estado calculado e estado reconstruido coincidam por construcao.
/// </summary>
internal static class EfeitosDeEventos
{
    internal static (EstadoEstacao Estacao, EstadoDialogo Dialogo) Aplicar(
        EstadoEstacao estacao,
        EstadoDialogo dialogo,
        string tipo,
        IReadOnlyDictionary<string, object?> dados)
    {
        return (estacao, dialogo);
    }

    /// <summary>Define o status de um servico da estacao; cria o servico (nao critico) se nao existir.</summary>
    internal static EstadoEstacao DefinirStatusServico(EstadoEstacao estacao, string nome, string status)
    {
        var existe = estacao.Servicos.Any(s => string.Equals(s.Nome, nome, StringComparison.OrdinalIgnoreCase));
        var servicos = existe
            ? estacao.Servicos.Select(s => string.Equals(s.Nome, nome, StringComparison.OrdinalIgnoreCase) ? s with { Status = status } : s).ToArray()
            : [.. estacao.Servicos, new ServicoEstacao(nome, status, false)];
        return estacao with { Servicos = servicos };
    }
}
