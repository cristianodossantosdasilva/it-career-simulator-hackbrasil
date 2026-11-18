using Simulador.Dominio;

namespace Simulador.Cenarios;

public sealed partial class CatalogoCenarios
{
    // Causas entregues e aceitas como forcadas. Cada Item acrescenta a sua Causa neste conjunto.
    private static readonly string[] CausasBackupRestore = ["REPOSITORIO_CHEIO"];

    private static DefinicaoCenario CriarBackupRestore(string versao, string? causaForcada, long semente)
    {
        var sorteada = CausasBackupRestore[new SplitMix64(semente).NextInt(CausasBackupRestore.Length)];
        var causa = causaForcada is not null && CausasBackupRestore.Contains(causaForcada, StringComparer.Ordinal)
            ? causaForcada
            : sorteada;

        IReadOnlyList<ServicoEstacao> servicos =
        [
            new("JobBackupFinanceiro", "Failed", true),
            new("RepositorioBackup", "Online", false),
            new("PastaFinanceiro", "Disponivel", false)
        ];

        var estacao = new EstadoEstacao(
            PrivilegioTerminal.UsuarioPadrao,
            new Dictionary<string, IReadOnlyList<string>>(StringComparer.OrdinalIgnoreCase)
            {
                ["backup.oncall"] = ["Aurora-Backup"]
            },
            new Dictionary<string, RegistroDns>(StringComparer.OrdinalIgnoreCase),
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
            servicos,
            false,
            true,
            ["[ALERT] Job BKP-FIN-DIARIO: status Failed (02:00)."],
            ["backup status", "backup log", "backup repo", "backup cadeia", "backup job", "backup restore"]);

        var principal = new ChamadoInicial(
            "Backup do Financeiro falhou esta madrugada",
            "O backup de ontem nao rodou e o fechamento precisa de copia hoje.",
            "Marcos Teixeira (Gerente do Financeiro)", 0, true);

        IReadOnlyList<ChamadoInicial> fila =
        [
            principal,
            new("Solicitacao de acesso ao portal de ferias", "Novo colaborador precisa de acesso ao portal RH.", "Joana Lima", 0, false)
        ];

        return new DefinicaoCenario(
            "falha-backup-restore",
            versao,
            "Especialista Data Center e Backup (N3-B)",
            causa,
            estacao,
            fila,
            "Aurora-Backup",
            "backup.oncall",
            "bkp-repo.aurora.local",
            "JobBackupFinanceiro");
    }
}