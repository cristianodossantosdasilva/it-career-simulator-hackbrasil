namespace Simulador.Dominio;

/// <summary>Textos das Pistas por cenario e familia de Causa. Maximo de 3 Pistas por sessao.</summary>
internal static class PistasPorCenario
{
    internal const int Maximo = 3;

    private static readonly string[] Padrao =
    [
        "Pista 1: Antes de alterar qualquer configuracao, verifique no terminal os sinais da estacao (whoami /groups, nslookup, ping, net start).",
        "Pista 2: Compare o resultado do diagnostico com a Base de Conhecimento: grupo ausente (C1), DNS errado (C2) ou servico parado (C3).",
        "Pista 3: Para corrigir com seguranca, eleve o privilegio no terminal/painel e depois confirme o acesso antes de resolver o chamado."
    ];

    internal static string Obter(string cenarioId, string causa, int indice)
    {
        if (indice < 0 || indice >= Maximo)
            throw new ArgumentOutOfRangeException(nameof(indice));
        return Padrao[indice];
    }
}
