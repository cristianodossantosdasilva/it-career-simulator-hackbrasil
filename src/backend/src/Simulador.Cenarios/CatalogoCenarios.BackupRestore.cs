using Simulador.Dominio;

namespace Simulador.Cenarios;

public sealed partial class CatalogoCenarios
{
    // Causas entregues e aceitas como forcadas. Cada Item acrescenta a sua Causa neste conjunto.
    private static readonly string[] CausasBackupRestore = ["REPOSITORIO_CHEIO", "CADEIA_CORROMPIDA"];

    private static DefinicaoCenario CriarBackupRestore(string versao, string? causaForcada, long semente)
    {
        var sorteada = CausasBackupRestore[new SplitMix64(semente).NextInt(CausasBackupRestore.Length)];
        var causa = causaForcada is not null && CausasBackupRestore.Contains(causaForcada, StringComparer.Ordinal)
            ? causaForcada
            : sorteada;

        var cadeiaCorrompida = causa == "CADEIA_CORROMPIDA";
        IReadOnlyList<ServicoEstacao> servicos =
        [
            new("JobBackupFinanceiro", "Failed", true),
            new("RepositorioBackup", "Online", false),
            new("PastaFinanceiro", cadeiaCorrompida ? "Indisponivel" : "Disponivel", false)
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
            cadeiaCorrompida
                ?
                [
                    "[ALERT] Job BKP-FIN-DIARIO: status Failed (02:00).",
                    "[WARN] Leitura da pasta Financeiro retorna erros de checksum."
                ]
                : ["[ALERT] Job BKP-FIN-DIARIO: status Failed (02:00)."],
            ["backup status", "backup log", "backup repo", "backup cadeia", "backup job", "backup restore"]);

        var principal = cadeiaCorrompida
            ? new ChamadoInicial(
                "Pasta Financeiro corrompida: preciso restaurar o fechamento de ontem",
                "A pasta do fechamento abre com erro e os arquivos de ontem nao leem. Preciso da versao de ontem de volta.",
                "Marcos Teixeira (Gerente do Financeiro)", 0, true)
            : new ChamadoInicial(
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
            "N3-B Data Center e Backup",
            causa,
            estacao,
            fila,
            "Aurora-Backup",
            "backup.oncall",
            "bkp-repo.aurora.local",
            "JobBackupFinanceiro");
    }
}