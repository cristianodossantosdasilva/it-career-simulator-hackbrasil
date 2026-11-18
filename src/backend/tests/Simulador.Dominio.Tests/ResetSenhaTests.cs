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
        Assert.Equal("Help Desk (N1)", s.Estado.Meta.Nivel);
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
}
