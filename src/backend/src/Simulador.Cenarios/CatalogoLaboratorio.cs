namespace Simulador.Cenarios;

/// <summary>Entrada do catalogo do Lab: dominio e nivel (1 a 3) para montar simulados e provas de Lab.</summary>
public sealed record EntradaLaboratorio(
    string CenarioId,
    string VersaoManifesto,
    string Dominio,
    int Nivel,
    string Titulo,
    int DuracaoEstimadaMin,
    IReadOnlyList<string> Causas);

/// <summary>Catalogo estatico do Lab. Os dominios sao os mesmos do nivel Teorico.</summary>
public static class CatalogoLaboratorio
{
    public static IReadOnlyList<EntradaLaboratorio> Todos { get; } =
    [
        new("reset-senha-desbloqueio", "v0.1-hackathon", "Acesso e contas", 1,
            "Reset de senha e desbloqueio de conta", 10, ["SENHA_ESQUECIDA", "CONTA_BLOQUEADA", "SENHA_EXPIRADA"]),
        new("pasta-rede-inacessivel", "v1.1", "Redes", 2,
            "Pasta de rede inacessível", 15, ["C1", "C2", "C3", "C4"]),
        new("triagem-engenharia-social", "v0.1-hackathon", "Segurança", 2,
            "Triagem e defesa contra engenharia social", 12, []),
        new("falha-backup-restore", "v0.1-hackathon", "Backup e continuidade", 2,
            "Falha de backup e restauração", 15, ["REPOSITORIO_CHEIO", "CADEIA_CORROMPIDA"]),
        new("incidente-massivo", "v0.1-hackathon", "Sistemas e ERP", 3,
            "Incidente massivo e Problema ITIL", 20, ["PATCH_MASSIVO", "EMAIL_PROVEDOR", "DOMINIO_SUSPENSO"]),
        new("sre-cloud-latencia", "v2.0", "Sistemas e ERP", 3,
            "Incidente cloud e Kubernetes", 20, ["OOM_KILLED", "POOL_EXHAUSTED", "CERT_EXPIRED"]),
        new("diagnostico-sql-readonly", "v2.0", "Sistemas e ERP", 3,
            "Auditoria SQL somente leitura", 15, [])
    ];
}
