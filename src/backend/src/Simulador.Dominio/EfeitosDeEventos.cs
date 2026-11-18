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
        switch (tipo)
        {
            case "TitularContatado":
                return (estacao, dialogo with { TitularContatado = true });
            case "SenhaTemporariaDefinida":
                return (DefinirStatusServico(estacao, "ContaAD", "SenhaTemporaria"), dialogo);
            case "ContaDesbloqueada":
            case "SenhaTrocadaPelaPessoa":
                return (DefinirStatusServico(estacao, "ContaAD", "Ativa"), dialogo);
            case "ContaBloqueadaNovamente":
                return (DefinirStatusServico(estacao, "ContaAD", "Bloqueada"), dialogo);
            case "OrigemBloqueioIdentificada":
                return (DefinirStatusServico(estacao, "EventosDeSeguranca", "Consultado"), dialogo);
            case "AcessoContaRestabelecido":
            case "AcessoPastaRestabelecido":
                return (estacao with { CompartilhamentoAcessivel = true }, dialogo);
            case "UnidadeRedeMapeada":
                return (DefinirStatusServico(estacao, "UnidadeRedeZ", "Mapeada"), dialogo);
            case "RepositorioExpandido":
                return (DefinirStatusServico(estacao, "RepositorioBackup", "Expandido"), dialogo);
            case "BackupConcluido":
                return (DefinirStatusServico(estacao, "JobBackupFinanceiro", "Succeeded") with { CompartilhamentoAcessivel = true }, dialogo);
            case "PastaFinanceiroRestaurada":
                return (DefinirStatusServico(estacao, "PastaFinanceiro", "Restaurada") with { CompartilhamentoAcessivel = true }, dialogo);
            default:
                return (estacao, dialogo);
        }
    }

    /// <summary>Status atual de um servico da estacao, ou null se nao existir.</summary>
    internal static string? StatusServico(EstadoEstacao estacao, string nome) =>
        estacao.Servicos.FirstOrDefault(s => string.Equals(s.Nome, nome, StringComparison.OrdinalIgnoreCase))?.Status;

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
