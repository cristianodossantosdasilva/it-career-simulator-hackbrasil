using System.Text.Json;
using Simulador.Dominio;
using Simulador.Itsm;

namespace Simulador.Dominio.Tests;

public class ResetSenhaTests
{
    private const string Cenario = "reset-senha-desbloqueio";
    private const string Versao = "v0.1-hackathon";

    /// <summary>Procura, de forma deterministica, uma semente cuja variante seja a pedida.</summary>
    internal static long SementeDaVariante(bool porTerceiro)
    {
        var catalogo = new Simulador.Cenarios.CatalogoCenarios();
        for (long s = 1; s < 1000; s++)
            if (catalogo.Obter(Cenario, Versao, "SENHA_ESQUECIDA", s).PedidoPorTerceiro == porTerceiro) return s;
        throw new InvalidOperationException("Nenhuma semente encontrada.");
    }

    internal static SessaoDeTeste Nova(string causa, bool porTerceiro) =>
        SessaoDeTeste.Iniciar(Cenario, Versao, causa, SementeDaVariante(porTerceiro));

    private static void Abrir(SessaoDeTeste s)
    {
        s.Aplicar("itsm.assumir_chamado", new { chamadoId = "CH-0001" });
        s.Aplicar("itsm.classificar_chamado", new { chamadoId = "CH-0001", categoria = "Acesso", urgencia = "Alta", impacto = "Medio" });
    }

    private static void Verificar(SessaoDeTeste s) =>
        s.Aplicar("dialogo.verificar_identidade", new { matricula = "AUR-2087", ramal = "2087" });

    private static string StatusConta(EstadoSessao e) => e.Estacao.Servicos.Single(x => x.Nome == "ContaAD").Status;

    private static void AssertReconstrucaoIgual(SessaoDeTeste s)
    {
        var rec = s.Reconstruir();
        Assert.Equal(JsonSerializer.Serialize(s.Estado.Estacao), JsonSerializer.Serialize(rec.Estacao));
        Assert.Equal(JsonSerializer.Serialize(s.Estado.Dialogo), JsonSerializer.Serialize(rec.Dialogo));
        Assert.Equal(JsonSerializer.Serialize(s.Estado.Meta), JsonSerializer.Serialize(rec.Meta));
        var hashCalculado = s.Avaliar().CurriculoVivo.HashAuditoriaSha256;
        var hashReconstruido = Simulador.Avaliacao.Juiz360.Avaliar(rec, s.Eventos).CurriculoVivo.HashAuditoriaSha256;
        Assert.Equal(hashCalculado, hashReconstruido);
    }

    [Fact]
    public void Criacao_SenhaEsquecida_DefineTitularLogsEComandosDeclarados()
    {
        var s = Nova("SENHA_ESQUECIDA", porTerceiro: false);
        Assert.Equal("SENHA_ESQUECIDA", s.Estado.Meta.Causa);
        Assert.Equal("Help Desk N1", s.Estado.Meta.Nivel);
        Assert.Equal("AUR-2087", s.Cenario.Titular!.Matricula);
        Assert.Equal(3, s.Estado.Itsm.Chamados.Count);
        Assert.Equal("Fernanda Lima", s.Estado.Itsm.Chamados[0].Solicitante);
        Assert.Equal("Ativa", StatusConta(s.Estado));
        Assert.Equal(7, s.Estado.Estacao.ComandosSuportados.Count);
        Assert.Contains(s.Estado.Estacao.Logs, l => l.Contains("senha incorreta"));
        Assert.False(s.Estado.Meta.PedidoPorTerceiro);
    }

    [Fact]
    public void Criacao_PorTerceiro_AbreChamadoDoGestorENaoLiberaAcessoRemoto()
    {
        var s = Nova("SENHA_ESQUECIDA", porTerceiro: true);
        Assert.True(s.Estado.Meta.PedidoPorTerceiro);
        Assert.Equal("Paulo Andrade", s.Estado.Itsm.Chamados[0].Solicitante);
        Assert.Contains("me passem a nova", s.Estado.Itsm.Chamados[0].Descricao);
    }

    [Fact]
    public void FluxoCorreto_PedidoDireto_AtendeH1aH8()
    {
        var s = Nova("SENHA_ESQUECIDA", porTerceiro: false);
        Abrir(s);
        s.Comando("net user fernanda.lima");
        Assert.Contains("2 tentativas incorretas", s.UltimaSaida());
        Verificar(s);
        Assert.False(s.Estado.Dialogo.AcessoRemotoLiberado);
        Assert.True(s.Estado.Dialogo.IdentidadeValidada);
        s.Comando("redefinir-senha fernanda.lima");
        Assert.Equal("SenhaTemporaria", StatusConta(s.Estado));
        Assert.True(s.Estado.Estacao.CompartilhamentoAcessivel);
        s.Aplicar("itsm.resolver_chamado", new { chamadoId = "CH-0001", notaPublica = "Senha temporaria definida e entregue a titular." });

        var av = s.Avaliar();
        Assert.True(av.Concluida);
        Assert.False(av.IncidenteSeguranca);
        Assert.Equal(8, av.Criterios.Count);
        Assert.All(av.Criterios, c => Assert.True(c.Atendido, $"Criterio {c.Id} falhou"));
        Assert.Equal(90, av.XpTotal);
        AssertReconstrucaoIgual(s);
    }

    [Fact]
    public void FluxoCorreto_PorTerceiro_ExigeDiretorioDiscarEVerificar()
    {
        var s = Nova("SENHA_ESQUECIDA", porTerceiro: true);
        Abrir(s);
        s.Comando("net user fernanda.lima");
        s.Comando("diretorio fernanda.lima");
        Assert.Contains("Ramal cadastrado: 2087", s.UltimaSaida());
        s.Comando("discar 2087");
        Assert.True(s.Estado.Dialogo.TitularContatado);
        Verificar(s);
        s.Comando("redefinir-senha fernanda.lima");
        s.Aplicar("itsm.resolver_chamado", new { chamadoId = "CH-0001", notaPublica = "Senha temporaria entregue a titular, nao ao gestor." });

        var av = s.Avaliar();
        Assert.All(av.Criterios, c => Assert.True(c.Atendido, $"Criterio {c.Id} falhou"));
        Assert.True(av.Concluida);
        AssertReconstrucaoIgual(s);
    }

    [Fact]
    public void PorTerceiro_SemDiscar_GeraIdentidadeNaoConfereMesmoComDadosCertos()
    {
        var s = Nova("SENHA_ESQUECIDA", porTerceiro: true);
        Abrir(s);
        Verificar(s);
        var nao = s.De("IdentidadeNaoConfere").Single();
        Assert.Equal("solicitante_terceiro_sem_contato_com_titular", nao.Dados["motivo"]);
        Assert.False(s.Estado.Dialogo.IdentidadeValidada);
        Assert.Empty(s.De("IdentidadeVerificada"));

        s.Comando("redefinir-senha fernanda.lima");
        Assert.Single(s.De("AcaoSensivelSemVerificacao"));
        var av = s.Avaliar();
        Assert.False(av.Criterios.Single(c => c.Id == "H1").Atendido);
        Assert.False(av.Criterios.Single(c => c.Id == "H2").Atendido);
    }

    [Fact]
    public void DiscarNumeroForaDoCadastro_NaoContataATitular()
    {
        var s = Nova("SENHA_ESQUECIDA", porTerceiro: true);
        s.Comando("discar 2099");
        Assert.Contains("fora do cadastro", s.UltimaSaida());
        Assert.False(s.Estado.Dialogo.TitularContatado);
        Assert.Empty(s.De("TitularContatado"));
    }

    [Fact]
    public void RedefinirSenha_SemVerificacao_ERecusadoERegistradoComoPrejudicial()
    {
        var s = Nova("SENHA_ESQUECIDA", porTerceiro: false);
        Abrir(s);
        s.Comando("net user fernanda.lima");
        s.Comando("redefinir-senha fernanda.lima");
        Assert.Contains("RECUSADO", s.UltimaSaida());
        Assert.Single(s.De("AcaoSensivelSemVerificacao"));
        Assert.Single(s.De("AcaoPrejudicialRegistrada"));
        Assert.Equal("Ativa", StatusConta(s.Estado));
        Assert.False(s.Estado.Estacao.CompartilhamentoAcessivel);
        var av = s.Avaliar();
        Assert.False(av.Criterios.Single(c => c.Id == "H1").Atendido);
        Assert.False(av.Criterios.Single(c => c.Id == "H4").Atendido);
        Assert.True(av.IncidenteSeguranca);
        AssertReconstrucaoIgual(s);
    }

    [Theory]
    [InlineData("desbloquear-conta fernanda.lima")]
    [InlineData("enviar-link-troca fernanda.lima")]
    public void AcoesQueNaoResolvemSenhaEsquecida_GeramAcaoDesnecessaria(string comando)
    {
        var s = Nova("SENHA_ESQUECIDA", porTerceiro: false);
        Abrir(s);
        s.Comando("net user fernanda.lima");
        Verificar(s);
        s.Comando(comando);
        Assert.Single(s.De("AcaoDesnecessariaRegistrada"));
        Assert.Equal("Ativa", StatusConta(s.Estado));
        Assert.False(s.Avaliar().Criterios.Single(c => c.Id == "H6").Atendido);
        AssertReconstrucaoIgual(s);
    }

    [Fact]
    public void SegurancaResetarSenha_EquivaleARedefinirSenha_ESemVerificacaoERecusado()
    {
        var recusado = Nova("SENHA_ESQUECIDA", porTerceiro: false);
        recusado.Aplicar("seguranca.resetar_senha");
        Assert.Single(recusado.De("AcaoSensivelSemVerificacao"));
        Assert.Empty(recusado.De("SenhaResetadaIndevidamente"));
        Assert.Equal("Ativa", StatusConta(recusado.Estado));

        var s = Nova("SENHA_ESQUECIDA", porTerceiro: false);
        Abrir(s);
        Verificar(s);
        s.Aplicar("seguranca.resetar_senha");
        Assert.Single(s.De("SenhaTemporariaDefinida"));
        Assert.Single(s.De("AcessoContaRestabelecido"));
        Assert.Equal("SenhaTemporaria", StatusConta(s.Estado));
        AssertReconstrucaoIgual(s);
    }

    [Theory]
    [InlineData("format c:")]
    [InlineData("whoami /groups")]
    [InlineData("backup status")]
    public void ComandoForaDaLista_GeraComandoNaoSuportadoESemMudarEstado(string comando)
    {
        var s = Nova("SENHA_ESQUECIDA", porTerceiro: false);
        var antes = JsonSerializer.Serialize(s.Estado.Estacao);
        s.Comando(comando);
        Assert.Single(s.De("ComandoNaoSuportado"));
        Assert.Equal(antes, JsonSerializer.Serialize(s.Estado.Estacao));
    }

    [Fact]
    public void LoginDiferente_RespondeErroSemEventoDeEfeito()
    {
        var s = Nova("SENHA_ESQUECIDA", porTerceiro: false);
        Verificar(s);
        s.Comando("redefinir-senha outra.pessoa");
        Assert.Contains("nao foi encontrado", s.UltimaSaida());
        Assert.Empty(s.De("SenhaTemporariaDefinida"));
        Assert.Empty(s.De("AcaoSensivelSemVerificacao"));
    }

    [Fact]
    public void SaidasEEventos_NaoContemSenhaNemAIdentidadeDaCausa()
    {
        var s = Nova("SENHA_ESQUECIDA", porTerceiro: false);
        Abrir(s);
        Verificar(s);
        s.Comando("redefinir-senha fernanda.lima");
        var tudo = JsonSerializer.Serialize(s.Eventos);
        Assert.DoesNotContain("senha123", tudo, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("password", tudo, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void CausaForcadaInvalida_UsaSorteioPelaSemente_ESementeNaoMudaAVariante()
    {
        var catalogo = new Simulador.Cenarios.CatalogoCenarios();
        var a = catalogo.Obter(Cenario, Versao, "NAO_EXISTE", 7);
        var b = catalogo.Obter(Cenario, Versao, null, 7);
        var c = catalogo.Obter(Cenario, Versao, "SENHA_ESQUECIDA", 7);
        Assert.Equal(b.Causa, a.Causa);
        Assert.Equal(c.PedidoPorTerceiro, b.PedidoPorTerceiro);
        Assert.Equal(a.PedidoPorTerceiro, b.PedidoPorTerceiro);
    }

    // ------------------------------------------------------------ CONTA_BLOQUEADA

    private const string NotaCelular = "A origem era o celular corporativo com a senha antiga em cache: atualize a senha no dispositivo.";

    private static void FluxoCorretoBloqueada(SessaoDeTeste s)
    {
        Abrir(s);
        s.Comando("net user fernanda.lima");
        s.Comando("eventos-seguranca fernanda.lima");
        if (s.Cenario.PedidoPorTerceiro)
        {
            s.Comando("diretorio fernanda.lima");
            s.Comando("discar 2087");
        }
        Verificar(s);
        s.Comando("desbloquear-conta fernanda.lima");
        s.Aplicar("itsm.adicionar_nota", new { chamadoId = "CH-0001", tipo = "Publica", texto = NotaCelular });
        s.Aplicar("itsm.resolver_chamado", new { chamadoId = "CH-0001", notaPublica = "Conta desbloqueada." });
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void ContaBloqueada_FluxoCorreto_AtendeH1aH10(bool porTerceiro)
    {
        var s = Nova("CONTA_BLOQUEADA", porTerceiro);
        Assert.Equal("Bloqueada", StatusConta(s.Estado));
        Assert.Equal("NaoConsultado", s.Estado.Estacao.Servicos.Single(x => x.Nome == "EventosDeSeguranca").Status);
        FluxoCorretoBloqueada(s);

        Assert.Equal("Ativa", StatusConta(s.Estado));
        Assert.Equal("Consultado", s.Estado.Estacao.Servicos.Single(x => x.Nome == "EventosDeSeguranca").Status);
        var av = s.Avaliar();
        Assert.Equal(10, av.Criterios.Count);
        Assert.All(av.Criterios, c => Assert.True(c.Atendido, $"Criterio {c.Id} falhou"));
        Assert.True(av.Concluida);
        Assert.False(av.IncidenteSeguranca);
        Assert.Equal(110, av.XpTotal);
        Assert.Contains("Analise de Origem de Bloqueio", av.CurriculoVivo.CompetenciasComprovadas);
        AssertReconstrucaoIgual(s);
    }

    [Fact]
    public void ContaBloqueada_OrigemSoApareceNaSaidaDeEventosDeSeguranca()
    {
        var s = Nova("CONTA_BLOQUEADA", porTerceiro: false);
        s.Comando("net user fernanda.lima");
        Assert.DoesNotContain("MOB-FIN-017", s.UltimaSaida());
        Assert.Contains("BLOQUEADA", s.UltimaSaida());
        Assert.DoesNotContain(s.Estado.Estacao.Logs, l => l.Contains("MOB-FIN-017"));
        Assert.DoesNotContain("MOB-FIN-017", JsonSerializer.Serialize(s.Estado.Estacao));
        Assert.Empty(s.De("OrigemBloqueioIdentificada"));

        s.Comando("eventos-seguranca fernanda.lima");
        Assert.Contains("MOB-FIN-017", s.UltimaSaida());
        Assert.Single(s.De("OrigemBloqueioIdentificada"));
    }

    [Fact]
    public void ContaBloqueada_DesbloquearSemConsultarAOrigem_BloqueiaDeNovoEDepoisRestabelece()
    {
        var s = Nova("CONTA_BLOQUEADA", porTerceiro: false);
        Abrir(s);
        s.Comando("net user fernanda.lima");
        Verificar(s);
        s.Comando("desbloquear-conta fernanda.lima");
        Assert.Contains("bloqueada novamente", s.UltimaSaida());
        Assert.Single(s.De("ContaDesbloqueada"));
        Assert.Single(s.De("ContaBloqueadaNovamente"));
        Assert.Equal("Bloqueada", StatusConta(s.Estado));
        Assert.Empty(s.De("AcessoContaRestabelecido"));
        Assert.False(s.Estado.Estacao.CompartilhamentoAcessivel);
        var av = s.Avaliar();
        Assert.False(av.Criterios.Single(c => c.Id == "H5").Atendido);
        Assert.False(av.Criterios.Single(c => c.Id == "H9").Atendido);

        s.Comando("eventos-seguranca fernanda.lima");
        s.Comando("desbloquear-conta fernanda.lima");
        Assert.Equal("Ativa", StatusConta(s.Estado));
        Assert.Single(s.De("AcessoContaRestabelecido"));
        var depois = s.Avaliar();
        Assert.True(depois.Criterios.Single(c => c.Id == "H5").Atendido);
        Assert.False(depois.Criterios.Single(c => c.Id == "H9").Atendido);
        AssertReconstrucaoIgual(s);
    }

    [Fact]
    public void ContaBloqueada_RedefinirSenhaELinkDeTroca_GeramAcaoDesnecessariaESemRestabelecer()
    {
        var s = Nova("CONTA_BLOQUEADA", porTerceiro: false);
        Abrir(s);
        s.Comando("net user fernanda.lima");
        s.Comando("eventos-seguranca fernanda.lima");
        Verificar(s);
        s.Comando("redefinir-senha fernanda.lima");
        Assert.Contains("continua bloqueada", s.UltimaSaida());
        s.Comando("enviar-link-troca fernanda.lima");
        Assert.Equal(2, s.De("AcaoDesnecessariaRegistrada").Count());
        Assert.Equal("Bloqueada", StatusConta(s.Estado));
        Assert.Empty(s.De("AcessoContaRestabelecido"));
        Assert.False(s.Avaliar().Criterios.Single(c => c.Id == "H6").Atendido);
        AssertReconstrucaoIgual(s);
    }

    [Fact]
    public void ContaBloqueada_SemNotaSobreCelular_H10NaoAtendido()
    {
        var s = Nova("CONTA_BLOQUEADA", porTerceiro: false);
        Abrir(s);
        s.Comando("eventos-seguranca fernanda.lima");
        Verificar(s);
        s.Comando("desbloquear-conta fernanda.lima");
        s.Aplicar("itsm.resolver_chamado", new { chamadoId = "CH-0001", notaPublica = "Conta desbloqueada." });
        var av = s.Avaliar();
        Assert.True(av.Criterios.Single(c => c.Id == "H9").Atendido);
        Assert.False(av.Criterios.Single(c => c.Id == "H10").Atendido);
    }

    [Fact]
    public void EventosSeguranca_EmOutraCausa_NaoEmiteOrigemDoBloqueio()
    {
        var s = Nova("SENHA_ESQUECIDA", porTerceiro: false);
        s.Comando("eventos-seguranca fernanda.lima");
        Assert.Contains("Nenhum bloqueio recente", s.UltimaSaida());
        Assert.Empty(s.De("OrigemBloqueioIdentificada"));
        Assert.Null(s.Estado.Estacao.Servicos.FirstOrDefault(x => x.Nome == "EventosDeSeguranca"));
    }

    [Fact]
    public void ContaBloqueada_DesbloquearSemVerificar_ERecusado()
    {
        var s = Nova("CONTA_BLOQUEADA", porTerceiro: false);
        s.Comando("eventos-seguranca fernanda.lima");
        s.Comando("desbloquear-conta fernanda.lima");
        Assert.Contains("RECUSADO", s.UltimaSaida());
        Assert.Equal("Bloqueada", StatusConta(s.Estado));
        Assert.Empty(s.De("ContaDesbloqueada"));
        Assert.True(s.Avaliar().IncidenteSeguranca);
    }

    // ------------------------------------------------------------ SENHA_EXPIRADA

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void SenhaExpirada_FluxoCorretoComLinkDeTroca_AtendeH1aH8(bool porTerceiro)
    {
        var s = Nova("SENHA_EXPIRADA", porTerceiro);
        Assert.Equal("SenhaExpirada", StatusConta(s.Estado));
        Abrir(s);
        s.Comando("net user fernanda.lima");
        Assert.Contains("EXPIRADA", s.UltimaSaida());
        if (porTerceiro)
        {
            s.Comando("diretorio fernanda.lima");
            s.Comando("discar 2087");
        }
        Verificar(s);
        s.Comando("enviar-link-troca fernanda.lima");
        Assert.Equal("Ativa", StatusConta(s.Estado));
        Assert.True(s.Estado.Estacao.CompartilhamentoAcessivel);
        Assert.Single(s.De("OrientacaoRegistrada"));
        Assert.Equal("troca_pela_titular", s.De("AcessoContaRestabelecido").Single().Dados["via"]);
        s.Aplicar("itsm.resolver_chamado", new { chamadoId = "CH-0001", notaPublica = "A titular trocou a propria senha pelo autoatendimento." });

        var av = s.Avaliar();
        Assert.Equal(8, av.Criterios.Count);
        Assert.All(av.Criterios, c => Assert.True(c.Atendido, $"Criterio {c.Id} falhou"));
        Assert.False(av.IncidenteSeguranca);
        Assert.Equal(90, av.XpTotal);
        AssertReconstrucaoIgual(s);
    }

    [Fact]
    public void SenhaExpirada_RedefinirSenha_RestabeleceMasH5EH6NaoAtendidos()
    {
        var s = Nova("SENHA_EXPIRADA", porTerceiro: false);
        Abrir(s);
        s.Comando("net user fernanda.lima");
        Verificar(s);
        s.Comando("redefinir-senha fernanda.lima");
        Assert.Equal("SenhaTemporaria", StatusConta(s.Estado));
        Assert.True(s.Estado.Estacao.CompartilhamentoAcessivel);
        Assert.Equal("reset", s.De("AcessoContaRestabelecido").Single().Dados["via"]);
        Assert.Single(s.De("AcaoDesnecessariaRegistrada"));
        s.Aplicar("itsm.resolver_chamado", new { chamadoId = "CH-0001", notaPublica = "Senha temporaria definida." });

        var av = s.Avaliar();
        Assert.False(av.Criterios.Single(c => c.Id == "H5").Atendido);
        Assert.False(av.Criterios.Single(c => c.Id == "H6").Atendido);
        Assert.False(av.Criterios.Single(c => c.Id == "H8").Atendido);
        Assert.False(av.IncidenteSeguranca);
        Assert.True(av.Concluida);
        AssertReconstrucaoIgual(s);
    }

    [Fact]
    public void SenhaExpirada_DesbloquearEReenvioDoLink_GeramAcaoDesnecessaria()
    {
        var s = Nova("SENHA_EXPIRADA", porTerceiro: false);
        Abrir(s);
        s.Comando("net user fernanda.lima");
        Verificar(s);
        s.Comando("desbloquear-conta fernanda.lima");
        Assert.Contains("nao esta bloqueada", s.UltimaSaida());
        Assert.Single(s.De("AcaoDesnecessariaRegistrada"));
        Assert.Equal("SenhaExpirada", StatusConta(s.Estado));

        s.Comando("enviar-link-troca fernanda.lima");
        s.Comando("enviar-link-troca fernanda.lima");
        Assert.Contains("ja foi renovada", s.UltimaSaida());
        Assert.Equal(2, s.De("AcaoDesnecessariaRegistrada").Count());
        Assert.Single(s.De("AcessoContaRestabelecido"));
        AssertReconstrucaoIgual(s);
    }

    [Fact]
    public void SenhaExpirada_Criacao_TemLogEChamadoProprios()
    {
        var direto = Nova("SENHA_EXPIRADA", porTerceiro: false);
        Assert.Contains(direto.Estado.Estacao.Logs, l => l.Contains("senha expirada"));
        Assert.Equal("O sistema pede nova senha e nao deixa entrar", direto.Estado.Itsm.Chamados[0].Titulo);
        var terceiro = Nova("SENHA_EXPIRADA", porTerceiro: true);
        Assert.Contains("senha vencida", terceiro.Estado.Itsm.Chamados[0].Descricao);
    }
}