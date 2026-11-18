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

    private static readonly string[] ResetSenha =
    [
        "Pista 1: Antes de qualquer acao, confirme quem pede e quem e a dona da conta, e consulte o estado da conta no console.",
        "Pista 2: Quem pede nem sempre e a dona da conta: use o ramal do diretorio, nao o que foi informado. Compare o estado da conta com o sintoma e escolha a menor acao que resolve.",
        "Pista 3: Depois de agir, confirme com a titular que o acesso voltou e registre no chamado o que foi feito e por que."
    ];

    private static readonly string[] BackupRestore =
    [
        "Pista 1: Comece pelo estado do job e pelo log da falha; o log diz o que impediu o backup.",
        "Pista 2: Compare o estado do repositorio e da cadeia com o log antes de qualquer mudanca. Apagar pontos de restauracao nao e um atalho seguro.",
        "Pista 3: Operacoes de backup exigem privilegio elevado. Confirme com o dono da pasta antes de resolver o chamado."
    ];

    private static readonly string[] IncidenteExterno =
    [
        "Pista 1: Reuna os chamados num Problema e reuna evidencia de onde a falha esta antes de agir.",
        "Pista 2: Se a evidencia aponta para fora da empresa, o seu papel e acionar quem pode resolver e manter todos informados.",
        "Pista 3: Comunique o impacto aos solicitantes, acompanhe ate o restabelecimento e so entao resolva em lote."
    ];

    internal static string Obter(string cenarioId, string causa, int indice)
    {
        if (indice < 0 || indice >= Maximo)
            throw new ArgumentOutOfRangeException(nameof(indice));
        return cenarioId switch
        {
            "reset-senha-desbloqueio" => ResetSenha[indice],
            "falha-backup-restore" => BackupRestore[indice],
            "incidente-massivo" when causa is "EMAIL_PROVEDOR" or "DOMINIO_SUSPENSO" => IncidenteExterno[indice],
            _ => Padrao[indice]
        };
    }
}
