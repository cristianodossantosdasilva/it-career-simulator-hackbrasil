using Simulador.Dominio;

namespace Simulador.Cenarios;

public sealed class CatalogoCenarios : ICatalogoCenarios
{
    private static readonly string[] CausasPastaRede = ["C1", "C2", "C3"];

    public bool SuportaVersao(string cenarioId, string versaoManifesto) =>
        (cenarioId, versaoManifesto) switch
        {
            ("pasta-rede-inacessivel", "v1.1") => true,
            ("triagem-engenharia-social", "v0.1-hackathon") => true,
            ("incidente-massivo", "v0.1-hackathon") => true,
            _ => false
        };

    public DefinicaoCenario Obter(string cenarioId, string versaoManifesto, string? causaForcada, long semente)
    {
        if (!SuportaVersao(cenarioId, versaoManifesto))
            throw new ArgumentException($"Cenario '{cenarioId}' versao '{versaoManifesto}' nao suportado.");

        return cenarioId switch
        {
            "pasta-rede-inacessivel" => CriarPastaRede(versaoManifesto, causaForcada, semente),
            "triagem-engenharia-social" => CriarTriagemSeguranca(versaoManifesto),
            "incidente-massivo" => CriarIncidenteMassivo(versaoManifesto),
            _ => throw new ArgumentException($"Cenario desconhecido: {cenarioId}")
        };
    }

    private static DefinicaoCenario CriarPastaRede(string versao, string? causaForcada, long semente)
    {
        var causa = causaForcada is "C1" or "C2" or "C3"
            ? causaForcada
            : CausasPastaRede[new SplitMix64(semente).NextInt(CausasPastaRede.Length)];

        var gruposMaria = causa == "C1"
            ? new[] { "Domain Users", "Aurora-Colaboradores" }
            : new[] { "Domain Users", "Aurora-Colaboradores", "GRP_FINANCEIRO_PASTA" };

        var ipDns = causa == "C2" ? "10.10.99.250" : "10.10.20.15";
        var statusWorkstation = causa == "C3" ? "Stopped" : "Running";

        var estacao = new EstadoEstacao(
            PrivilegioTerminal.UsuarioPadrao,
            new Dictionary<string, IReadOnlyList<string>>(StringComparer.OrdinalIgnoreCase)
            {
                ["maria.souza"] = gruposMaria,
                ["joao.oliveira"] = ["Domain Users", "GRP_FINANCEIRO_PASTA"]
            },
            new Dictionary<string, RegistroDns>(StringComparer.OrdinalIgnoreCase)
            {
                ["fileserver.aurora.local"] = new("fileserver.aurora.local", ipDns, "10.10.20.15")
            },
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["fileserver.aurora.local"] = ipDns
            },
            [
                new("Workstation", statusWorkstation, true),
                new("DnsClient", "Running", true),
                new("Spooler", "Running", false)
            ],
            false,
            true,
            [
                "[INFO] Estacao EST-FIN-042 iniciada em aurora.local.",
                causa switch
                {
                    "C1" => "[WARN] Acesso negado ao compartilhamento \\\\fileserver.aurora.local\\Financeiro para maria.souza.",
                    "C2" => "[WARN] Resolucao de fileserver.aurora.local retornando 10.10.99.250 (destino inalcancavel).",
                    _ => "[ERROR] Servico Workstation (LanmanWorkstation) encontra-se parado na estacao EST-FIN-042."
                }
            ],
            ["whoami /groups", "nslookup", "ping", "ipconfig /flushdns", "net start", "sc query"]);

        IReadOnlyList<ChamadoInicial> fila =
        [
            new("Nao consigo acessar a pasta da rede Financeiro", "Ao tentar abrir \\\\fileserver.aurora.local\\Financeiro recebo erro de acesso/caminho nao encontrado.", "Maria Souza", 0, true),
            new("Impressora do 2o andar com fila travada", "Documentos ficam presos na fila da impressora HP-204.", "Carlos Mendes", 0, false),
            new("Solicitacao de acesso ao portal de ferias", "Novo colaborador precisa de acesso ao portal RH.", "Joana Lima", 0, false),
            new("Duvida sobre configuracao de assinatura no Webmail", "Como adicionar o telefone da filial na assinatura?", "Pedro Rocha", 0, false),
            new("Lentidao ao abrir planilhas grandes", "Planilha de fechamento demora 20 segundos para carregar.", "Ana Paula", 0, false)
        ];

        return new DefinicaoCenario(
            "pasta-rede-inacessivel",
            versao,
            "Analista Jr (N1)",
            causa,
            estacao,
            fila,
            "GRP_FINANCEIRO_PASTA",
            "maria.souza",
            "fileserver.aurora.local",
            "Workstation");
    }

    private static DefinicaoCenario CriarTriagemSeguranca(string versao)
    {
        var estacao = new EstadoEstacao(
            PrivilegioTerminal.UsuarioPadrao,
            new Dictionary<string, IReadOnlyList<string>>(StringComparer.OrdinalIgnoreCase)
            {
                ["roberto.silva"] = ["Domain Users", "Diretoria"]
            },
            new Dictionary<string, RegistroDns>(StringComparer.OrdinalIgnoreCase),
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
            [new("Workstation", "Running", true)],
            true,
            true,
            ["[SECURITY] Tentativa de contato solicitando reset de senha sem protocolo de verificacao."],
            ["whoami /groups"]);

        return new DefinicaoCenario(
            "triagem-engenharia-social",
            versao,
            "Estagiario",
            "ENG_SOCIAL",
            estacao,
            [
                new("URGENTE: Reset de senha da Diretoria sem token", "Solicitante afirma ser o Diretor Roberto e exige reset imediato sem validacao.", "Roberto (nao verificado)", 0, true)
            ],
            "Diretoria",
            "roberto.silva",
            "fileserver.aurora.local",
            "Workstation");
    }

    private static DefinicaoCenario CriarIncidenteMassivo(string versao)
    {
        var estacao = new EstadoEstacao(
            PrivilegioTerminal.UsuarioPadrao,
            new Dictionary<string, IReadOnlyList<string>>(StringComparer.OrdinalIgnoreCase),
            new Dictionary<string, RegistroDns>(StringComparer.OrdinalIgnoreCase)
            {
                ["api-interna.aurora.local"] = new("api-interna.aurora.local", "10.10.30.10", "10.10.30.10")
            },
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["api-interna.aurora.local"] = "10.10.30.10"
            },
            [new("AuroraGateway", "Stopped", true)],
            false,
            true,
            [
                "[ERROR] AuroraGateway falhou apos patch KB-202611: porta 8443 nao responde.",
                "[WARN] 3 chamados simultaneos reportando indisponibilidade do ERP interno."
            ],
            ["net start", "sc query", "ping", "nslookup"]);

        return new DefinicaoCenario(
            "incidente-massivo",
            versao,
            "Analista Pleno (N2)",
            "PATCH_MASSIVO",
            estacao,
            [
                new("ERP interno fora do ar - Financeiro", "Erro 503 ao acessar o ERP desde 08:55.", "Maria Souza", 0, true),
                new("ERP interno nao carrega - Logistica", "Sistema interno caiu apos reinicio.", "Carlos Mendes", 0, false),
                new("Erro de conexao no ERP - Compras", "Tela branca / timeout no ERP.", "Ana Paula", 0, false)
            ],
            "GRP_N2",
            "maria.souza",
            "api-interna.aurora.local",
            "AuroraGateway");
    }
}
