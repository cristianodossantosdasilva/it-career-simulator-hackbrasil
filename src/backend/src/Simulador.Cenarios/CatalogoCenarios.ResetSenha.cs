using Simulador.Dominio;

namespace Simulador.Cenarios;

public sealed partial class CatalogoCenarios
{
    // Causas entregues e aceitas como forcadas. Cada Item acrescenta a sua Causa neste conjunto.
    private static readonly string[] CausasResetSenha = ["SENHA_ESQUECIDA", "CONTA_BLOQUEADA"];

    private static readonly IdentidadeTitular TitularResetSenha =
        new("Fernanda Lima", "AUR-2087", "2087", "Paulo Andrade");

    private static DefinicaoCenario CriarResetSenha(string versao, string? causaForcada, long semente)
    {
        // Dois sorteios independentes da Causa forcada: a Causa e a variante (pedido direto ou por terceiro).
        var rng = new SplitMix64(semente);
        var sorteada = CausasResetSenha[rng.NextInt(CausasResetSenha.Length)];
        var porTerceiro = rng.NextInt(2) == 1;
        var causa = causaForcada is not null && CausasResetSenha.Contains(causaForcada, StringComparer.Ordinal)
            ? causaForcada
            : sorteada;

        var bloqueada = causa == "CONTA_BLOQUEADA";

        IReadOnlyList<ServicoEstacao> servicos = bloqueada
            ? [new("ContaAD", "Bloqueada", true), new("EventosDeSeguranca", "NaoConsultado", false)]
            : [new("ContaAD", "Ativa", true)];

        var estacao = new EstadoEstacao(
            PrivilegioTerminal.UsuarioPadrao,
            new Dictionary<string, IReadOnlyList<string>>(StringComparer.OrdinalIgnoreCase)
            {
                ["fernanda.lima"] = ["Domain Users", "Aurora-Colaboradores"]
            },
            new Dictionary<string, RegistroDns>(StringComparer.OrdinalIgnoreCase),
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
            servicos,
            false,
            true,
            [
                "[INFO] Estacao EST-FIN-017 iniciada em aurora.local.",
                bloqueada
                    ? "[WARN] Conta fernanda.lima bloqueada por excesso de tentativas de senha incorreta."
                    : "[INFO] Logon de fernanda.lima recusado: senha incorreta (2 tentativas, abaixo do limite de bloqueio)."
            ],
            ["net user", "eventos-seguranca", "diretorio", "discar", "redefinir-senha", "desbloquear-conta", "enviar-link-troca"]);

        var sintomaTerceiro = bloqueada ? "esta com a conta bloqueada" : "esqueceu a senha";
        var (tituloDireto, descricaoDireta) = bloqueada
            ? ("Minha conta esta bloqueada",
               "O sistema informa que a minha conta esta bloqueada e eu nao consigo entrar na estacao EST-FIN-017.")
            : ("Esqueci minha senha e nao consigo entrar",
               "Ao tentar entrar na estacao EST-FIN-017 o sistema recusa a minha senha e eu nao lembro qual e a correta.");

        var principal = porTerceiro
            ? new ChamadoInicial(
                "Colaboradora da minha equipe sem acesso: preciso do reset",
                $"Fernanda Lima, da minha equipe, {sintomaTerceiro} e nao consegue entrar. Resetem a senha dela e me passem a nova, eu repasso.",
                "Paulo Andrade", 0, true)
            : new ChamadoInicial(tituloDireto, descricaoDireta, "Fernanda Lima", 0, true);

        IReadOnlyList<ChamadoInicial> fila =
        [
            principal,
            new("Impressora do 2o andar com fila travada", "Documentos ficam presos na fila da impressora HP-204.", "Carlos Mendes", 0, false),
            new("Duvida sobre assinatura no Webmail", "Como adicionar o telefone da filial na assinatura?", "Pedro Rocha", 0, false)
        ];

        return new DefinicaoCenario(
            "reset-senha-desbloqueio",
            versao,
            "Help Desk (N1)",
            causa,
            estacao,
            fila,
            "Aurora-Colaboradores",
            "fernanda.lima",
            "dc.aurora.local",
            "ContaAD",
            TitularResetSenha,
            porTerceiro);
    }
}
