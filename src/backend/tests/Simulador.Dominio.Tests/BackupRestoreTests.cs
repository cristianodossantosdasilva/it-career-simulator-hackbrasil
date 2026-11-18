using System.Text.Json;
using Simulador.Dominio;

namespace Simulador.Dominio.Tests;

/// <summary>Cenario falha-backup-restore (Especialista Data Center e Backup, N3-B).</summary>
public class BackupRestoreTests
{
    private const string Cenario = "falha-backup-restore";
    private const string Versao = "v0.1-hackathon";
    private const string Destino = @"\\fileserver.aurora.local\Financeiro";

    private static SessaoDeTeste Nova(string causa, long semente = 42) =>
        SessaoDeTeste.Iniciar(Cenario, Versao, causa, semente);

    private static void Abrir(SessaoDeTeste s)
    {
        s.Aplicar("itsm.assumir_chamado", new { chamadoId = "CH-0001" });
        s.Aplicar("itsm.classificar_chamado", new { chamadoId = "CH-0001", categoria = "Incidente", urgencia = "Alta", impacto = "Alto" });
    }

    private static void Elevar(SessaoDeTeste s) => s.Aplicar("estacao.elevar_privilegio");

    private static string Status(EstadoSessao e, string nome) => e.Estacao.Servicos.Single(x => x.Nome == nome).Status;

    private static void Resolver(SessaoDeTeste s, string nota = "Backup restabelecido e conferido com o dono da pasta.") =>
        s.Aplicar("itsm.resolver_chamado", new { chamadoId = "CH-0001", notaPublica = nota });

    internal static void AssertReconstrucaoIgual(SessaoDeTeste s)
    {
        var rec = s.Reconstruir();
        Assert.Equal(JsonSerializer.Serialize(s.Estado.Estacao), JsonSerializer.Serialize(rec.Estacao));
        Assert.Equal(JsonSerializer.Serialize(s.Estado.Dialogo), JsonSerializer.Serialize(rec.Dialogo));
        Assert.Equal(JsonSerializer.Serialize(s.Estado.Meta), JsonSerializer.Serialize(rec.Meta));
        Assert.Equal(s.Avaliar().CurriculoVivo.HashAuditoriaSha256,
            Simulador.Avaliacao.Juiz360.Avaliar(rec, s.Eventos).CurriculoVivo.HashAuditoriaSha256);
    }

    [Fact]
    public void Criacao_RepositorioCheio_DefineServicosLogsChamadosEComandosDeclarados()
    {
        var s = Nova("REPOSITORIO_CHEIO");
        Assert.Equal("REPOSITORIO_CHEIO", s.Estado.Meta.Causa);
        Assert.Equal("Especialista Data Center e Backup (N3-B)", s.Estado.Meta.Nivel);
        Assert.Equal("Failed", Status(s.Estado, "JobBackupFinanceiro"));
        Assert.Equal("Online", Status(s.Estado, "RepositorioBackup"));
        Assert.Equal("Disponivel", Status(s.Estado, "PastaFinanceiro"));
        Assert.Equal(6, s.Estado.Estacao.ComandosSuportados.Count);
        Assert.Equal(2, s.Estado.Itsm.Chamados.Count);
        Assert.Equal("Marcos Teixeira (Gerente do Financeiro)", s.Estado.Itsm.Chamados[0].Solicitante);
        Assert.Equal("Backup do Financeiro falhou esta madrugada", s.Estado.Itsm.Chamados[0].Titulo);
        Assert.Single(s.Estado.Estacao.Logs);
        Assert.DoesNotContain(s.Estado.Estacao.Logs, l => l.Contains("espaco"));
        Assert.False(s.Estado.Estacao.CompartilhamentoAcessivel);
    }

    [Fact]
    public void FluxoCorreto_RepositorioCheio_AtendeB1aB6ComXp120()
    {
        var s = Nova("REPOSITORIO_CHEIO");
        Abrir(s);
        s.Comando("backup status");
        Assert.Contains("Failed", s.UltimaSaida());
        s.Comando("backup log");
        Assert.Contains("sem espaco no repositorio", s.UltimaSaida());
        s.Comando("backup repo");
        Assert.Contains("100% usado", s.UltimaSaida());
        Elevar(s);
        s.Comando("backup repo expandir");
        Assert.Equal("Expandido", Status(s.Estado, "RepositorioBackup"));
        s.Comando("backup job executar");
        Assert.Equal("Succeeded", Status(s.Estado, "JobBackupFinanceiro"));
        Assert.True(s.Estado.Estacao.CompartilhamentoAcessivel);
        Resolver(s);

        var av = s.Avaliar();
        Assert.True(av.Concluida);
        Assert.False(av.IncidenteSeguranca);
        Assert.Equal(["B1", "B2", "B3", "B4", "B5", "B6"], av.Criterios.Select(c => c.Id).ToArray());
        Assert.All(av.Criterios, c => Assert.True(c.Atendido, $"Criterio {c.Id} falhou"));
        Assert.Equal(120, av.XpTotal);
        AssertReconstrucaoIgual(s);
    }

    [Fact]
    public void JobExecutarComRepositorioCheio_FalhaSemMudarEstado()
    {
        var s = Nova("REPOSITORIO_CHEIO");
        Abrir(s);
        Elevar(s);
        var antes = JsonSerializer.Serialize(s.Estado.Estacao);
        s.Comando("backup job executar");
        Assert.Contains("sem espaco no repositorio", s.UltimaSaida());
        Assert.Equal(antes, JsonSerializer.Serialize(s.Estado.Estacao));
        Assert.Empty(s.De("BackupConcluido"));
    }

    [Theory]
    [InlineData("backup repo expandir")]
    [InlineData("backup repo limpar")]
    [InlineData(@"backup restore --origem imutavel --destino \\fileserver.aurora.local\Financeiro")]
    public void OperacaoSemPrivilegioElevado_RespondeErroSemEventoDeEfeito(string comando)
    {
        var s = Nova("REPOSITORIO_CHEIO");
        Abrir(s);
        var antes = JsonSerializer.Serialize(s.Estado.Estacao);
        s.Comando(comando);
        Assert.Equal("Erro: a operacao exige privilegio Elevado.", s.UltimaSaida());
        Assert.Equal(antes, JsonSerializer.Serialize(s.Estado.Estacao));
        Assert.Empty(s.De("RepositorioExpandido"));
        Assert.Empty(s.De("AcaoPrejudicialRegistrada"));
    }

    [Fact]
    public void Expandir_SemElevar_DeixaB3NaoAtendido()
    {
        var s = Nova("REPOSITORIO_CHEIO");
        Abrir(s);
        s.Comando("backup log");
        s.Comando("backup repo expandir");
        s.Comando("backup job executar");
        Assert.False(s.Estado.Estacao.CompartilhamentoAcessivel);
        var av = s.Avaliar();
        Assert.False(av.Criterios.Single(c => c.Id == "B3").Atendido);
        Assert.False(av.Criterios.Single(c => c.Id == "B4").Atendido);
        Assert.False(av.Concluida);
    }

    [Fact]
    public void ExpandirAntesDeDiagnosticar_NaoAtendeB2()
    {
        var s = Nova("REPOSITORIO_CHEIO");
        Abrir(s);
        Elevar(s);
        s.Comando("backup repo expandir");
        s.Comando("backup log");
        s.Comando("backup job executar");
        var av = s.Avaliar();
        Assert.False(av.Criterios.Single(c => c.Id == "B2").Atendido);
        Assert.True(av.Criterios.Single(c => c.Id == "B3").Atendido);
        Assert.True(av.Criterios.Single(c => c.Id == "B4").Atendido);
    }

    [Fact]
    public void RepoLimpar_RegistraAcaoPrejudicial_NaoLiberaEspacoEReduzXp()
    {
        var s = Nova("REPOSITORIO_CHEIO");
        Abrir(s);
        s.Comando("backup log");
        Elevar(s);
        s.Comando("backup repo limpar");
        Assert.Contains("retencao de 30 dias comprometida", s.UltimaSaida());
        var prejudicial = s.De("AcaoPrejudicialRegistrada").Single();
        Assert.Equal("backup", prejudicial.Dados["categoria"]);
        s.Comando("backup repo");
        Assert.Contains("100% usado", s.UltimaSaida());
        s.Comando("backup job executar");
        Assert.Contains("sem espaco no repositorio", s.UltimaSaida());
        s.Comando("backup repo expandir");
        s.Comando("backup job executar");
        Resolver(s);

        var av = s.Avaliar();
        Assert.False(av.Criterios.Single(c => c.Id == "B5").Atendido);
        Assert.True(av.IncidenteSeguranca);
        Assert.Equal(5 * 20 - 25, av.XpTotal);
        AssertReconstrucaoIgual(s);
    }

    [Fact]
    public void RestoreImutavel_EmRepositorioCheio_RegistraAcaoPrejudicialSemMudarEstado()
    {
        var s = Nova("REPOSITORIO_CHEIO");
        Abrir(s);
        Elevar(s);
        var antes = JsonSerializer.Serialize(s.Estado.Estacao);
        s.Comando($@"backup restore --origem imutavel --destino {Destino}");
        Assert.Single(s.De("AcaoPrejudicialRegistrada"));
        Assert.Empty(s.De("PastaFinanceiroRestaurada"));
        Assert.Equal(antes, JsonSerializer.Serialize(s.Estado.Estacao));
        Assert.False(s.Avaliar().Criterios.Single(c => c.Id == "B5").Atendido);
    }

    [Fact]
    public void RestoreIncremental_EmRepositorioCheio_EDesnecessarioSemEvento()
    {
        var s = Nova("REPOSITORIO_CHEIO");
        Abrir(s);
        Elevar(s);
        s.Comando($@"backup restore --origem incremental --destino {Destino}");
        Assert.Contains("desnecessaria", s.UltimaSaida());
        Assert.Empty(s.De("AcaoPrejudicialRegistrada"));
        Assert.Empty(s.De("PastaFinanceiroRestaurada"));
    }

    [Theory]
    [InlineData("backup restore")]
    [InlineData("backup restore --origem imutavel")]
    [InlineData(@"backup restore --origem outra --destino \\fileserver.aurora.local\Financeiro")]
    [InlineData(@"backup restore --origem imutavel --destino \\fileserver.aurora.local\Outra")]
    [InlineData("backup repo apagar-tudo")]
    [InlineData("backup job")]
    [InlineData("backup cadeia")]
    [InlineData("backup statusx")]
    public void ArgumentosInvalidos_RespondemComoUsoSemEventoDeEfeito(string comando)
    {
        var s = Nova("REPOSITORIO_CHEIO");
        Abrir(s);
        Elevar(s);
        var antes = JsonSerializer.Serialize(s.Estado.Estacao);
        s.Comando(comando);
        Assert.Equal(antes, JsonSerializer.Serialize(s.Estado.Estacao));
        Assert.Empty(s.De("AcaoPrejudicialRegistrada"));
        Assert.Empty(s.De("RepositorioExpandido"));
        Assert.Empty(s.De("BackupConcluido"));
        Assert.Empty(s.De("PastaFinanceiroRestaurada"));
    }

    [Fact]
    public void ExpandirDuasVezes_NaoDuplicaEvento()
    {
        var s = Nova("REPOSITORIO_CHEIO");
        Abrir(s);
        Elevar(s);
        s.Comando("backup repo expandir");
        s.Comando("backup repo expandir");
        Assert.Single(s.De("RepositorioExpandido"));
        s.Comando("backup repo");
        Assert.Contains("63% usado", s.UltimaSaida());
    }

    [Fact]
    public void ComandoForaDaLista_GeraComandoNaoSuportadoSemMudarEstado()
    {
        var s = Nova("REPOSITORIO_CHEIO");
        var antes = JsonSerializer.Serialize(s.Estado.Estacao);
        s.Comando("whoami /groups");
        s.Comando("rm -rf /backup");
        Assert.Equal(2, s.De("ComandoNaoSuportado").Count());
        Assert.Empty(s.De("ComandoExecutado"));
        Assert.Equal(antes, JsonSerializer.Serialize(s.Estado.Estacao));
    }

    [Fact]
    public void Pistas_SaoDoCenarioENaoCitamACausa()
    {
        var s = Nova("REPOSITORIO_CHEIO");
        for (var i = 0; i < 3; i++) s.Aplicar("dialogo.pedir_pista");
        var textos = s.De("PistaSolicitada").Select(e => e.Dados["texto"]!.ToString()!).ToList();
        Assert.Equal(3, textos.Count);
        Assert.Contains("log da falha", textos[0]);
        Assert.Contains("privilegio elevado", textos[2]);
        Assert.All(textos, t =>
        {
            Assert.DoesNotContain("REPOSITORIO_CHEIO", t, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("CADEIA_CORROMPIDA", t, StringComparison.OrdinalIgnoreCase);
        });
    }
}
