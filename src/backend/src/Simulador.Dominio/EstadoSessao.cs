using Simulador.Itsm;

namespace Simulador.Dominio;

public enum PrivilegioTerminal
{
    UsuarioPadrao,
    Elevado
}

public sealed record EstadoMeta(
    string CenarioId,
    string Causa,
    long Semente,
    string Nivel,
    string VersaoManifesto,
    int MinutoSimulado,
    int UltimoSeq);

public sealed record EstadoCarreira(
    string CargoAtual,
    int XpTotal,
    IReadOnlyList<string> MissoesConcluidas)
{
    public static EstadoCarreira Inicial(string nivel) => new(nivel, 0, []);
}

public sealed record MensagemDialogo(int Seq, string Remetente, string Conteudo, int MinutoSimulado);

public sealed record EstadoDialogo(
    bool AcessoRemotoLiberado,
    string? IdAcessoRemoto,
    string? PinAcessoRemoto,
    bool IdentidadeValidada,
    int PistasSolicitadas,
    bool UsuarioConfirmouFuncionamento,
    IReadOnlyList<MensagemDialogo> Mensagens)
{
    public static EstadoDialogo Vazio => new(false, null, null, false, 0, false, []);
}

public sealed record RegistroDns(string Host, string Ip, string IpEsperado);

public sealed record ServicoEstacao(string Nome, string Status, bool Critico);

public sealed record EstadoEstacao(
    PrivilegioTerminal Privilegio,
    IReadOnlyDictionary<string, IReadOnlyList<string>> GruposPorUsuario,
    IReadOnlyDictionary<string, RegistroDns> DnsServidor,
    IReadOnlyDictionary<string, string> DnsCacheEstacao,
    IReadOnlyList<ServicoEstacao> Servicos,
    bool CompartilhamentoAcessivel,
    bool FirewallAtivo,
    IReadOnlyList<string> Logs,
    IReadOnlyList<string> ComandosSuportados)
{
    public static EstadoEstacao Vazio => new(
        PrivilegioTerminal.UsuarioPadrao,
        new Dictionary<string, IReadOnlyList<string>>(StringComparer.OrdinalIgnoreCase),
        new Dictionary<string, RegistroDns>(StringComparer.OrdinalIgnoreCase),
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
        [],
        false,
        true,
        [],
        []);
}

public sealed record EstadoSessao(
    EstadoMeta Meta,
    EstadoCarreira Carreira,
    EstadoItsm Itsm,
    EstadoDialogo Dialogo,
    EstadoEstacao Estacao)
{
    public static EstadoSessao Vazio => new(
        new EstadoMeta("", "", 0, "", "", 0, 0),
        EstadoCarreira.Inicial(""),
        EstadoItsm.Vazio,
        EstadoDialogo.Vazio,
        EstadoEstacao.Vazio);
}

public sealed record ChamadoInicial(
    string Titulo,
    string Descricao,
    string Solicitante,
    int AbertoEmMinuto,
    bool EhPrincipal);

public sealed record DefinicaoCenario(
    string CenarioId,
    string VersaoManifesto,
    string Nivel,
    string Causa,
    EstadoEstacao EstacaoInicial,
    IReadOnlyList<ChamadoInicial> ChamadosIniciais,
    string GrupoAlvoCompartilhamento,
    string UsuarioAlvo,
    string HostAlvo,
    string ServicoAlvo);

public interface ICatalogoCenarios
{
    DefinicaoCenario Obter(string cenarioId, string versaoManifesto, string? causaForcada, long semente);
    bool SuportaVersao(string cenarioId, string versaoManifesto);
}
