using System.Text.Json;
using Simulador.Cenarios;
using Simulador.Dialogo;
using Simulador.Dominio;

namespace Simulador.Dominio.Tests;

/// <summary>Cenario incidente-massivo com Causa externa (EMAIL_PROVEDOR e DOMINIO_SUSPENSO) e regressao de PATCH_MASSIVO.</summary>
public class IncidenteExternoTests
{
    private const string Cenario = "incidente-massivo";
    private const string Versao = "v0.1-hackathon";
    private const string UrlStatus = "https://status.provedor-email.example";
    private static readonly string[] Chamados = ["CH-0001", "CH-0002", "CH-0003"];

    private static SessaoDeTeste Nova(string causa, long semente = 42) =>
        SessaoDeTeste.Iniciar(Cenario, Versao, causa, semente);

    private static string Status(EstadoSessao e, string nome) => e.Estacao.Servicos.Single(x => x.Nome == nome).Status;

    private static void Classificar(SessaoDeTeste s)
    {
        foreach (var id in Chamados)
            s.Aplicar("itsm.classificar_chamado", new { chamadoId = id, categoria = "Infraestrutura", urgencia = "Critica", impacto = "Alto" });
    }

    private static void CriarProblemaEVincular(SessaoDeTeste s, string titulo = "Falha externa com varios chamados")
    {
        s.Aplicar("itsm.criar_problema", new { titulo });
        foreach (var id in Chamados)
            s.Aplicar("itsm.vincular_problema", new { problemaId = "PRB-0001", chamadoId = id });
    }

    private static void NotaPublica(SessaoDeTeste s, string texto = "Incidente externo em acompanhamento com o fornecedor.") =>
        s.Aplicar("itsm.adicionar_nota", new { chamadoId = "CH-0001", tipo = "Publica", texto });

    private static void ResolverEmLote(SessaoDeTeste s, string nota = "Servico restabelecido pelo fornecedor e conferido.") =>
        s.Aplicar("itsm.resolver_problema", new { problemaId = "PRB-0001", notaPublica = nota });

    private static void AssertReconstrucaoIgual(SessaoDeTeste s) => BackupRestoreTests.AssertReconstrucaoIgual(s);

    internal static void FluxoCorretoEmail(SessaoDeTeste s)
    {
        Classificar(s);
        s.Comando($"curl -i {UrlStatus}");
        CriarProblemaEVincular(s);
        s.Comando("acionar fornecedor");
        NotaPublica(s);
        s.Comando("acompanhar fornecedor");
        s.Aplicar("itsm.registrar_causa_raiz", new { problemaId = "PRB-0001", causaRaiz = "Falha de entrega SMTP no provedor de e-mail." });
        ResolverEmLote(s);
    }

    // ---------------------------------------------------------------- EMAIL_PROVEDOR

    [Fact]
    public void Criacao_EmailProvedor_DefineServicosLogsChamadosEComandosDeclarados()
    {
        var s = Nova("EMAIL_PROVEDOR");
        Assert.Equal("EMAIL_PROVEDOR", s.Estado.Meta.Causa);
        Assert.Equal("Analista Pleno (N2)", s.Estado.Meta.Nivel);
        Assert.Equal("Running", Status(s.Estado, "AuroraGateway"));
        Assert.Equal("Indisponivel", Status(s.Estado, "ProvedorEmail"));
        Assert.Equal("Pendente", Status(s.Estado, "AreaFornecedor"));
        Assert.DoesNotContain(s.Estado.Estacao.Servicos, x => x.Nome == "AreaFinanceiro");
        Assert.Equal(["sc query", "ping", "nslookup", "curl -i", "acionar", "acompanhar"], s.Estado.Estacao.ComandosSuportados.ToArray());
        Assert.Equal("smtp.provedor-email.example", s.Cenario.HostAlvo);
        Assert.Equal("ProvedorEmail", s.Cenario.ServicoAlvo);
        Assert.Equal(3, s.Estado.Itsm.Chamados.Count);
        Assert.Equal("E-mail nao envia - Financeiro", s.Estado.Itsm.Chamados[0].Titulo);
        Assert.Equal("Maria Souza", s.Estado.Itsm.Chamados[0].Solicitante);
        Assert.Equal("E-mail nao recebe - Logistica", s.Estado.Itsm.Chamados[1].Titulo);
        Assert.Equal("Mensagens presas na caixa de saida - Compras", s.Estado.Itsm.Chamados[2].Titulo);
        Assert.Single(s.Estado.Estacao.Logs);
        Assert.False(s.Estado.Estacao.CompartilhamentoAcessivel);
    }

    [Fact]
    public void FluxoCorreto_EmailProvedor_AtendeF1aF9ComXp100()
    {
        var s = Nova("EMAIL_PROVEDOR");
        FluxoCorretoEmail(s);

        Assert.Equal("Restabelecido", Status(s.Estado, "ProvedorEmail"));
        Assert.Equal("Acionada", Status(s.Estado, "AreaFornecedor"));
        Assert.True(s.Estado.Estacao.CompartilhamentoAcessivel);

        var av = s.Avaliar();
        Assert.True(av.Concluida);
        Assert.False(av.IncidenteSeguranca);
        Assert.Equal(["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9"], av.Criterios.Select(c => c.Id).ToArray());
        Assert.All(av.Criterios, c => Assert.True(c.Atendido, $"Criterio {c.Id} falhou"));
        Assert.All(av.Criterios, c => Assert.Contains(c.LinkKb!, Simulador.Avaliacao.KbCatalogo.UriParaId.Keys));
        Assert.Equal(100, av.XpTotal);
        Assert.Equal(3, av.CurriculoVivo.CompetenciasComprovadas.Count);
        AssertReconstrucaoIgual(s);
    }

    [Fact]
    public void CurlComUrlDeStatus_ConfirmaEvidenciaECurlOutraUrlNao()
    {
        var s = Nova("EMAIL_PROVEDOR");
        s.Comando("curl -i https://outro.exemplo.example");
        Assert.Equal("curl: (6) Could not resolve host", s.UltimaSaida());
        Assert.Empty(s.De("EvidenciaExternaConfirmada"));

        s.Comando($"curl -i {UrlStatus}");
        Assert.StartsWith("HTTP/1.1 503 Service Unavailable", s.UltimaSaida());
        var evidencia = s.De("EvidenciaExternaConfirmada").Single();
        Assert.Equal("status-provedor", evidencia.Dados["fonte"]);
    }

    [Theory]
    [InlineData("curl -ix")]
    [InlineData("curl -iX GET")]
    public void PrefixoDeCurlCasadoSoPorTexto_NaoEUmComandoDoCenario(string comando)
    {
        var s = Nova("EMAIL_PROVEDOR");
        var antes = JsonSerializer.Serialize(s.Estado.Estacao);
        s.Comando(comando);
        Assert.Contains("nao faz parte dos comandos declarados", s.UltimaSaida());
        Assert.Empty(s.De("EvidenciaExternaConfirmada"));
        Assert.Equal(antes, JsonSerializer.Serialize(s.Estado.Estacao));
    }

    [Fact]
    public void AcompanharAntesDeAcionar_NaoRestabeleceESemEvento()
    {
        var s = Nova("EMAIL_PROVEDOR");
        var antes = JsonSerializer.Serialize(s.Estado.Estacao);
        s.Comando("acompanhar fornecedor");
        Assert.Equal("O fornecedor ainda nao foi acionado.", s.UltimaSaida());
        Assert.Empty(s.De("AcompanhamentoRegistrado"));
        Assert.Empty(s.De("ServicoExternoRestabelecido"));
        Assert.Equal(antes, JsonSerializer.Serialize(s.Estado.Estacao));
        Assert.Equal("Indisponivel", Status(s.Estado, "ProvedorEmail"));
    }

    [Fact]
    public void AcionarSemEvidencia_DeixaF3NaoAtendido()
    {
        var s = Nova("EMAIL_PROVEDOR");
        Classificar(s);
        s.Comando("acionar fornecedor");
        s.Comando($"curl -i {UrlStatus}");
        CriarProblemaEVincular(s);
        NotaPublica(s);
        s.Comando("acompanhar fornecedor");
        s.Aplicar("itsm.registrar_causa_raiz", new { problemaId = "PRB-0001", causaRaiz = "Falha no provedor de e-mail." });
        ResolverEmLote(s);

        var av = s.Avaliar();
        Assert.False(av.Criterios.Single(c => c.Id == "F3").Atendido);
        Assert.True(av.Criterios.Single(c => c.Id == "F4").Atendido);
        Assert.True(av.Criterios.Single(c => c.Id == "F9").Atendido);
        Assert.Equal(90, av.XpTotal);
    }

    [Fact]
    public void ReiniciarServicoElevado_NaoResolveEDeixaF8NaoAtendido()
    {
        var s = Nova("EMAIL_PROVEDOR");
        Classificar(s);
        s.Aplicar("estacao.elevar_privilegio");
        s.Aplicar("estacao.reiniciar_servico", new { servico = "ProvedorEmail" });
        Assert.False(s.Estado.Estacao.CompartilhamentoAcessivel);
        Assert.Empty(s.De("ServicoExternoRestabelecido"));

        s.Comando("curl -i " + UrlStatus);
        CriarProblemaEVincular(s);
        s.Comando("acionar fornecedor");
        NotaPublica(s);
        s.Comando("acompanhar fornecedor");
        s.Aplicar("itsm.registrar_causa_raiz", new { problemaId = "PRB-0001", causaRaiz = "Falha no provedor de e-mail." });
        ResolverEmLote(s);

        var av = s.Avaliar();
        Assert.False(av.Criterios.Single(c => c.Id == "F8").Atendido);
        Assert.False(av.IncidenteSeguranca);
        Assert.True(av.Criterios.Single(c => c.Id == "F9").Atendido);
        Assert.Equal(90, av.XpTotal);
    }

    [Fact]
    public void AcionarFinanceiroEmEmail_FicaRegistradoSemEfeitoEF4ExigeFornecedor()
    {
        var s = Nova("EMAIL_PROVEDOR");
        var antes = JsonSerializer.Serialize(s.Estado.Estacao);
        s.Comando("acionar financeiro");
        Assert.Equal("Financeiro acionado, mas esta area nao participa desta causa.", s.UltimaSaida());
        Assert.Equal("financeiro", s.De("AreaAcionada").Single().Dados["area"]?.ToString()?.ToLowerInvariant());
        Assert.Equal(antes, JsonSerializer.Serialize(s.Estado.Estacao));
        Assert.DoesNotContain(s.Estado.Estacao.Servicos, x => x.Nome == "AreaFinanceiro");
        Assert.False(s.Avaliar().Criterios.Single(c => c.Id == "F4").Atendido);
    }

    [Fact]
    public void AcionarFornecedorDuasVezes_NaoDuplicaEvento()
    {
        var s = Nova("EMAIL_PROVEDOR");
        s.Comando("acionar fornecedor");
        s.Comando("acionar fornecedor");
        Assert.Single(s.De("AreaAcionada"));
        Assert.Contains("ja foi acionado", s.UltimaSaida());
    }

    [Theory]
    [InlineData("acionar")]
    [InlineData("acionar diretoria")]
    [InlineData("acompanhar")]
    [InlineData("acompanhar financeiro")]
    [InlineData("acionarx")]
    public void ArgumentosInvalidos_RespondemComoUsoSemEventoDeEfeito(string comando)
    {
        var s = Nova("EMAIL_PROVEDOR");
        var antes = JsonSerializer.Serialize(s.Estado.Estacao);
        s.Comando(comando);
        Assert.Equal(antes, JsonSerializer.Serialize(s.Estado.Estacao));
        Assert.Empty(s.De("AreaAcionada"));
        Assert.Empty(s.De("AcompanhamentoRegistrado"));
    }

    [Fact]
    public void ResolverEmLoteAntesDoRestabelecimento_DeixaF9NaoAtendido()
    {
        var s = Nova("EMAIL_PROVEDOR");
        Classificar(s);
        s.Comando($"curl -i {UrlStatus}");
        CriarProblemaEVincular(s);
        s.Comando("acionar fornecedor");
        NotaPublica(s);
        s.Aplicar("itsm.registrar_causa_raiz", new { problemaId = "PRB-0001", causaRaiz = "Falha no provedor de e-mail." });
        ResolverEmLote(s, "Resolvido antes do fornecedor confirmar.");
        s.Comando("acompanhar fornecedor");

        var av = s.Avaliar();
        Assert.False(av.Criterios.Single(c => c.Id == "F9").Atendido);
        Assert.True(av.Criterios.Single(c => c.Id == "F6").Atendido);
        Assert.Equal(80, av.XpTotal);
    }

    [Fact]
    public void SemNotaPublicaOuComCausaRaizSemOrigemExterna_DeixaF5eF7NaoAtendidos()
    {
        var s = Nova("EMAIL_PROVEDOR");
        Classificar(s);
        s.Comando($"curl -i {UrlStatus}");
        CriarProblemaEVincular(s);
        s.Comando("acionar fornecedor");
        s.Comando("acompanhar fornecedor");
        s.Aplicar("itsm.registrar_causa_raiz", new { problemaId = "PRB-0001", causaRaiz = "Falha de rede interna." });
        ResolverEmLote(s);

        var av = s.Avaliar();
        Assert.False(av.Criterios.Single(c => c.Id == "F5").Atendido);
        Assert.False(av.Criterios.Single(c => c.Id == "F7").Atendido);
        Assert.True(av.Concluida);
    }

    [Fact]
    public void NslookupEPing_RespondemComOHostDoProvedorSemTextoInventado()
    {
        var s = Nova("EMAIL_PROVEDOR");
        s.Comando("nslookup smtp.provedor-email.example");
        Assert.Contains("198.51.100.25", s.UltimaSaida());
        s.Comando("ping smtp.provedor-email.example");
        Assert.Contains("Resposta de 198.51.100.25", s.UltimaSaida());
        s.Comando("sc query");
        Assert.Contains("ProvedorEmail: Indisponivel", s.UltimaSaida());
        Assert.DoesNotContain("provedor", s.Estado.Estacao.Logs[0], StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void ComandoForaDaLista_GeraComandoNaoSuportadoSemMudarEstado()
    {
        var s = Nova("EMAIL_PROVEDOR");
        var antes = JsonSerializer.Serialize(s.Estado.Estacao);
        s.Comando("whois aurora-logistica.example");
        s.Comando("net start AuroraGateway");
        Assert.Equal(2, s.De("ComandoNaoSuportado").Count());
        Assert.Empty(s.De("ComandoExecutado"));
        Assert.Equal(antes, JsonSerializer.Serialize(s.Estado.Estacao));
    }

    [Fact]
    public void Pistas_DasCausasExternasSaoDoCenarioENaoCitamACausa()
    {
        var s = Nova("EMAIL_PROVEDOR");
        for (var i = 0; i < 3; i++) s.Aplicar("dialogo.pedir_pista");
        var textos = s.De("PistaSolicitada").Select(e => e.Dados["texto"]!.ToString()!).ToList();
        Assert.Equal(3, textos.Count);
        Assert.Contains("evidencia", textos[0]);
        Assert.Contains("acionar quem pode resolver", textos[1]);
        Assert.Contains("resolva em lote", textos[2]);
        Assert.All(textos, t =>
        {
            Assert.DoesNotContain("EMAIL_PROVEDOR", t, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("DOMINIO_SUSPENSO", t, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("provedor", t, StringComparison.OrdinalIgnoreCase);
        });
    }

    [Fact]
    public async Task Dialogo_ClienteETechleadDasCausasExternas_NaoRevelamACausa()
    {
        var dialogo = new FallbackRoteirizadoDialogo();
        foreach (var (causa, trecho) in new[] { ("EMAIL_PROVEDOR", "O e-mail parou para toda a área."), ("DOMINIO_SUSPENSO", "Nosso site e os e-mails externos não funcionam") })
        {
            var s = Nova(causa);
            var cliente = await dialogo.ResponderAsync(s.Estado, "cliente", "Qual o problema?");
            Assert.Contains(trecho, cliente.Mensagem);
            var lead = await dialogo.ResponderAsync(s.Estado, "techlead", "O que devo fazer?");
            Assert.Contains("Problema", lead.Mensagem);
            foreach (var texto in new[] { cliente.Mensagem, lead.Mensagem })
            {
                Assert.DoesNotContain("EMAIL_PROVEDOR", texto, StringComparison.OrdinalIgnoreCase);
                Assert.DoesNotContain("DOMINIO_SUSPENSO", texto, StringComparison.OrdinalIgnoreCase);
            }
        }
    }

    // ---------------------------------------------------------------- PATCH_MASSIVO e apelido GATEWAY

    [Fact]
    public void CausaForcadaGateway_GravaPatchMassivoComADefinicaoAtual()
    {
        var s = Nova("GATEWAY");
        Assert.Equal("PATCH_MASSIVO", s.Estado.Meta.Causa);
        Assert.Equal("PATCH_MASSIVO", s.Cenario.Causa);
        var servico = Assert.Single(s.Estado.Estacao.Servicos);
        Assert.Equal(("AuroraGateway", "Stopped"), (servico.Nome, servico.Status));
        Assert.Equal(["net start", "sc query", "ping", "nslookup"], s.Estado.Estacao.ComandosSuportados.ToArray());
        Assert.Equal("api-interna.aurora.local", s.Cenario.HostAlvo);
        Assert.Equal(3, s.Estado.Itsm.Chamados.Count);
        Assert.Equal("ERP interno fora do ar - Financeiro", s.Estado.Itsm.Chamados[0].Titulo);
    }

    [Fact]
    public void PatchMassivo_ContinuaComM1aM8EComAsPistasPadrao()
    {
        var s = Nova("PATCH_MASSIVO", 1);
        Classificar(s);
        CriarProblemaEVincular(s, "Queda ERP apos patch");
        s.Aplicar("estacao.ler_logs");
        s.Aplicar("estacao.elevar_privilegio");
        s.Aplicar("estacao.reiniciar_servico", new { servico = "AuroraGateway" });
        s.Aplicar("itsm.registrar_causa_raiz", new { problemaId = "PRB-0001", causaRaiz = "Servico AuroraGateway parou apos atualizacao recente." });
        ResolverEmLote(s, "Gateway reiniciado e ERP normalizado.");
        s.Aplicar("dialogo.pedir_pista");

        var av = s.Avaliar();
        Assert.Equal(["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8"], av.Criterios.Select(c => c.Id).ToArray());
        Assert.All(av.Criterios, c => Assert.True(c.Atendido, $"Criterio {c.Id} falhou"));
        Assert.StartsWith("Pista 1: Antes de alterar qualquer configuracao", s.De("PistaSolicitada").Single().Dados["texto"]!.ToString());
        AssertReconstrucaoIgual(s);
    }

    [Fact]
    public void SorteioSemCausaForcada_AteAAtivacao_DevolveSempreOMesmoPatchMassivo()
    {
        var catalogo = new CatalogoCenarios();
        for (long semente = 0; semente < 20; semente++)
            Assert.Equal("PATCH_MASSIVO", catalogo.Obter(Cenario, Versao, null, semente).Causa);
        Assert.Equal("PATCH_MASSIVO", catalogo.Obter(Cenario, Versao, "CAUSA_INEXISTENTE", 5).Causa);
    }
}
