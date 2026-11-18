namespace Simulador.Avaliacao;

public static class KbCatalogo
{
    public static readonly IReadOnlyDictionary<string, string> UriParaId = new Dictionary<string, string>
    {
        // N3-C Seguranca e Dados: Seguranca e Engenharia Social
        ["kb://seguranca/politica-reset-senha"] = "KB-001",
        ["kb://seguranca/verificacao-identidade"] = "KB-002",
        ["kb://seguranca/engenharia-social"] = "KB-003",
        ["kb://itsm/documentacao-incidentes"] = "KB-004",

        // Service Desk N1 Jr: Diagnostico e Rede
        ["kb://diagnostico/fluxo-estruturado"] = "KB-005",
        ["kb://rede/pasta-inacessivel"] = "KB-006",
        ["kb://itsm/resolucao-chamado"] = "KB-007",
        ["kb://itsm/classificacao-sla"] = "KB-008",
        ["kb://seguranca/acoes-prejudiciais"] = "KB-009",

        // N2 Pleno: ITIL e Incidentes Massivos
        ["kb://itil/gestao-problemas"] = "KB-010",
        ["kb://itil/vinculacao-problema"] = "KB-011",
        ["kb://diagnostico/logs-servicos"] = "KB-012",
        ["kb://seguranca/contencao-incidentes"] = "KB-013",
        ["kb://servicos/privilegio-elevado"] = "KB-014",
        ["kb://itil/analise-causa-raiz"] = "KB-015",
        ["kb://itil/resolucao-lote"] = "KB-016",
        ["kb://itsm/gestao-sla"] = "KB-017",

        // N3-A Redes e Nuvem: Cloud e Kubernetes
        ["kb://sre/classificacao-incidente"] = "KB-018",
        ["kb://sre/diagnostico-cloud"] = "KB-019",
        ["kb://sre/mitigacao-kubernetes"] = "KB-020",
        ["kb://sre/seguranca-operacional"] = "KB-021",
        ["kb://sre/validacao-disponibilidade"] = "KB-022",

        // N3-C Seguranca e Dados: SQL Auditoria Read-Only
        ["kb://sql/classificacao-auditoria"] = "KB-023",
        ["kb://sql/investigacao-readonly"] = "KB-024",
        ["kb://sql/seguranca-readonly"] = "KB-025",
        ["kb://sql/resolucao-auditoria"] = "KB-026",
        // Cenarios por escala: Help Desk N1 (acesso e identidade)
        ["kb://acesso/reset-desbloqueio-e-troca"] = "KB-027",
        // Cenarios por escala: falha de fornecedor externo (incidente-massivo)
        ["kb://itil/falha-de-fornecedor"] = "KB-028",
        ["kb://itil/comunicacao-de-incidente"] = "KB-029",
        // Cenarios por escala: N3-B Data Center e Backup
        ["kb://backup/diagnostico-de-job"] = "KB-030",
        ["kb://backup/copia-imutavel-e-retencao"] = "KB-031",
        // Cenarios por escala: solicitacao de servico (C4 de pasta-rede-inacessivel)
        ["kb://itsm/solicitacao-de-servico"] = "KB-032",
    };

    public static string? ResolverUri(string? uri)
        => uri is not null && UriParaId.TryGetValue(uri, out var id) ? id : null;
}
