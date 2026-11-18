using Simulador.Dominio;

namespace Simulador.Cenarios;

public sealed partial class CatalogoCenarios
{
    // Causas sorteadas sem Causa forcada (Ativacao_no_Sorteio autorizada pelo usuario). Sessoes ja gravadas guardam a Causa em SessaoIniciada.
    private static readonly string[] CausasIncidenteSorteio = ["PATCH_MASSIVO", "EMAIL_PROVEDOR", "DOMINIO_SUSPENSO"];

    // Causas aceitas como forcadas. GATEWAY e apelido de entrada de PATCH_MASSIVO (a Causa gravada e PATCH_MASSIVO).
    private static readonly string[] CausasIncidenteForcadas = ["PATCH_MASSIVO", "EMAIL_PROVEDOR", "DOMINIO_SUSPENSO", "GATEWAY"];

    private static DefinicaoCenario CriarIncidenteMassivo(string versao, string? causaForcada, long semente)
    {
        var sorteada = CausasIncidenteSorteio[new SplitMix64(semente).NextInt(CausasIncidenteSorteio.Length)];
        var causa = causaForcada is not null && CausasIncidenteForcadas.Contains(causaForcada, StringComparer.Ordinal)
            ? causaForcada
            : sorteada;
        if (causa == "GATEWAY") causa = "PATCH_MASSIVO";

        return causa switch
        {
            "EMAIL_PROVEDOR" => CriarIncidenteExterno(versao, causa),
            "DOMINIO_SUSPENSO" => CriarIncidenteExterno(versao, causa),
            _ => CriarIncidentePatchMassivo(versao)
        };
    }

    // Causas externas: a falha esta fora da empresa. O nome dos servicos e o dos hosts nao citam a Causa
    // alem do proprio sintoma exposto no console (ProvedorEmail, DominioPublico).
    private static DefinicaoCenario CriarIncidenteExterno(string versao, string causa)
    {
        var email = causa == "EMAIL_PROVEDOR";
        const string hostEmail = "smtp.provedor-email.example";
        const string hostSite = "www.aurora-logistica.example";
        const string ipEmail = "198.51.100.25";

        var dnsServidor = new Dictionary<string, RegistroDns>(StringComparer.OrdinalIgnoreCase);
        var dnsCache = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (email)
        {
            dnsServidor[hostEmail] = new RegistroDns(hostEmail, ipEmail, ipEmail);
            dnsCache[hostEmail] = ipEmail;
        }

        IReadOnlyList<ServicoEstacao> servicos = email
            ?
            [
                new("AuroraGateway", "Running", true),
                new("ProvedorEmail", "Indisponivel", true),
                new("AreaFornecedor", "Pendente", false)
            ]
            :
            [
                new("AuroraGateway", "Running", true),
                new("DominioPublico", "Suspenso", true),
                new("AreaFornecedor", "Pendente", false),
                new("AreaFinanceiro", "Pendente", false)
            ];

        var estacao = new EstadoEstacao(
            PrivilegioTerminal.UsuarioPadrao,
            new Dictionary<string, IReadOnlyList<string>>(StringComparer.OrdinalIgnoreCase),
            dnsServidor,
            dnsCache,
            servicos,
            false,
            true,
            [
                email
                    ? "[ALERT] 3 chamados simultaneos: e-mail corporativo nao envia nem recebe desde 08:40."
                    : "[ALERT] 3 chamados simultaneos: site e e-mail corporativo fora do ar desde 08:30."
            ],
            email
                ? ["sc query", "ping", "nslookup", "curl -i", "acionar", "acompanhar"]
                : ["sc query", "ping", "nslookup", "whois", "acionar", "acompanhar"]);

        IReadOnlyList<ChamadoInicial> fila = email
            ?
            [
                new("E-mail nao envia - Financeiro", "As mensagens ficam na caixa de saida desde 08:40.", "Maria Souza", 0, true),
                new("E-mail nao recebe - Logistica", "Nenhuma mensagem nova chega desde 08:40.", "Carlos Mendes", 0, false),
                new("Mensagens presas na caixa de saida - Compras", "As cotacoes para fornecedores nao saem.", "Ana Paula", 0, false)
            ]
            :
            [
                new("Site institucional fora do ar", "O endereco do site nao abre desde 08:30.", "Maria Souza", 0, true),
                new("E-mail corporativo sem entrega - Logistica", "As mensagens para fora da empresa voltam com erro desde 08:30.", "Carlos Mendes", 0, false),
                new("Clientes relatam dominio inacessivel - Comercial", "Clientes ligam dizendo que o nosso endereco nao responde.", "Ana Paula", 0, false)
            ];

        return new DefinicaoCenario(
            "incidente-massivo",
            versao,
            "N2 Pleno",
            causa,
            estacao,
            fila,
            "GRP_N2",
            "maria.souza",
            email ? hostEmail : hostSite,
            email ? "ProvedorEmail" : "DominioPublico");
    }
}
