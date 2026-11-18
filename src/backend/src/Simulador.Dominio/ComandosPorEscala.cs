namespace Simulador.Dominio;

internal sealed record EventoEscala(string Tipo, IReadOnlyDictionary<string, object?> Dados);

internal sealed record ResultadoComandoEscala(EstadoSessao NovoEstado, string Saida, IReadOnlyList<EventoEscala> Eventos);

/// <summary>
/// Comandos declarados dos cenarios por escala. O estado novo e sempre o resultado de dobrar,
/// em ordem, os Eventos emitidos com <see cref="EfeitosDeEventos.Aplicar"/>.
/// </summary>
internal static class ComandosPorEscala
{
    /// <summary>Devolve null quando o comando nao pertence a nenhum cenario por escala (segue para o fluxo generico).</summary>
    internal static ResultadoComandoEscala? TentarExecutar(EstadoSessao estado, string comando, DefinicaoCenario cenario)
    {
        return null;
    }

    /// <summary>Atalho de seguranca.resetar_senha em cenarios com Titular.</summary>
    internal static ResultadoComandoEscala RedefinirSenha(EstadoSessao estado, DefinicaoCenario cenario)
    {
        throw new NotSupportedException("Nenhum cenario por escala habilitou o atalho de redefinicao de senha.");
    }
}
