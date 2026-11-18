using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Simulador.Cenarios;

namespace Simulador.Dominio.Tests;

/// <summary>Causa C4 de pasta-rede-inacessivel: unidade Z: nao mapeada (solicitacao de servico).</summary>
public class PastaRedeC4Tests
{
    private const string Cenario = "pasta-rede-inacessivel";
    private const string Versao = "v1.1";
    private const string NetUseZ = @"net use z: \\fileserver.aurora.local\Financeiro";

    private static SessaoDeTeste Nova(string causa) => SessaoDeTeste.Iniciar(Cenario, Versao, causa, 42);

    private static void Abrir(SessaoDeTeste s, string categoria = "Solicitacao de Servico")
    {
        s.Aplicar("itsm.assumir_chamado", new { chamadoId = "CH-0001" });
        s.Aplicar("itsm.classificar_chamado", new { chamadoId = "CH-0001", categoria, urgencia = "Media", impacto = "Baixo" });
    }

    private static string StatusUnidade(EstadoSessao e) =>
        e.Estacao.Servicos.Single(x => x.Nome == "UnidadeRedeZ").Status;

    [Fact]
    public void Criacao_C4_TemUnidadeNaoMapeadaChamadoDeSolicitacaoELogsDaCausa()
    {
        var s = Nova("C4");
        Assert.Equal("C4", s.Estado.Meta.Causa);
        Assert.Equal("NaoMapeada", StatusUnidade(s.Estado));
        Assert.Equal(5, s.Estado.Itsm.Chamados.Count);
        Assert.StartsWith("Solicitacao:", s.Estado.Itsm.Chamados[0].Titulo);
        Assert.Contains(s.Estado.Estacao.Logs, l => l.Contains("Unidade Z: (Financeiro) nao esta mapeada"));
        Assert.Contains("net use", s.Estado.Estacao.ComandosSuportados);
        Assert.Contains("GRP_FINANCEIRO_PASTA", s.Estado.Estacao.GruposPorUsuario["maria.souza"]);
    }

    [Fact]
    public void FluxoCorreto_C4_AtendeJ1aJ6()
    {
        var s = Nova("C4");
        Abrir(s);
        s.Comando("whoami /groups");
        s.Comando("net use");
        Assert.Equal("Unidade Z: NAO MAPEADA.", s.UltimaSaida());
        s.Comando(NetUseZ);
        Assert.Equal("O comando foi concluido com exito.", s.UltimaSaida());
        Assert.Equal("Mapeada", StatusUnidade(s.Estado));
        Assert.True(s.Estado.Estacao.CompartilhamentoAcessivel);
        Assert.Single(s.De("UnidadeRedeMapeada"));
        Assert.Single(s.De("AcessoPastaRestabelecido"));
        s.Aplicar("itsm.resolver_chamado", new { chamadoId = "CH-0001", notaPublica = "Unidade Z: mapeada para a pasta Financeiro." });

        var av = s.Avaliar();
        Assert.True(av.Concluida);
        Assert.False(av.IncidenteSeguranca);
        Assert.Equal(["J1", "J2", "J3", "J4", "J5", "J6"], av.Criterios.Select(c => c.Id).ToArray());
        Assert.All(av.Criterios, c => Assert.True(c.Atendido, $"Criterio {c.Id} falhou"));
        Assert.Equal(70, av.XpTotal);
        AssertReconstrucaoIgual(s);
    }

    [Fact]
    public void ClassificarComoIncidente_NaoAtendeJ6()
    {
        var s = Nova("C4");
        Abrir(s, "Incidente de Rede");
        s.Comando("whoami /groups");
        s.Comando(NetUseZ);
        s.Aplicar("itsm.resolver_chamado", new { chamadoId = "CH-0001", notaPublica = "Unidade mapeada." });
        var av = s.Avaliar();
        Assert.False(av.Criterios.Single(c => c.Id == "J6").Atendido);
        Assert.True(av.Criterios.Single(c => c.Id == "J2").Atendido);
    }

    [Fact]
    public void ComandosDeOutrasCausas_NaoRestabelecemC4()
    {
        var s = Nova("C4");
        Abrir(s);
        s.Aplicar("estacao.elevar_privilegio");
        s.Comando("net start Workstation");
        s.Comando("ipconfig /flushdns");
        Assert.False(s.Estado.Estacao.CompartilhamentoAcessivel);
        Assert.Empty(s.De("AcessoPastaRestabelecido"));
        Assert.Equal("NaoMapeada", StatusUnidade(s.Estado));
    }

    [Theory]
    [InlineData("C1", "Erro de sistema 5. Acesso negado.")]
    [InlineData("C2", "Erro de sistema 53. O caminho de rede nao foi encontrado.")]
    [InlineData("C3", "Erro de sistema 2250. O servico Workstation nao esta em execucao.")]
    public void NetUseZ_EmC1C2C3_DevolveOErroDaCausaESemMudarEstado(string causa, string erro)
    {
        var s = Nova(causa);
        var antes = JsonSerializer.Serialize(s.Estado.Estacao);
        s.Comando("net use");
        Assert.Equal("Nenhuma conexao de rede ativa.", s.UltimaSaida());
        s.Comando(NetUseZ);
        Assert.Equal(erro, s.UltimaSaida());
        Assert.Equal(antes, JsonSerializer.Serialize(s.Estado.Estacao));
        Assert.DoesNotContain(s.Estado.Estacao.Servicos, x => x.Nome == "UnidadeRedeZ");
        Assert.Empty(s.De("UnidadeRedeMapeada"));
        Assert.Empty(s.De("AcessoPastaRestabelecido"));
    }

    [Theory]
    [InlineData("C1")]
    [InlineData("C4")]
    public void NetUse_ComLetraOuCaminhoDiferente_NaoMudaEstado(string causa)
    {
        var s = Nova(causa);
        var antes = JsonSerializer.Serialize(s.Estado.Estacao);
        s.Comando(@"net use y: \\fileserver.aurora.local\Financeiro");
        Assert.Contains("nao corresponde ao solicitado", s.UltimaSaida());
        s.Comando(@"net use z: \\fileserver.aurora.local\Outra");
        Assert.Contains("nao corresponde ao solicitado", s.UltimaSaida());
        Assert.Equal(antes, JsonSerializer.Serialize(s.Estado.Estacao));
        Assert.Empty(s.De("UnidadeRedeMapeada"));
    }

    [Fact]
    public void NetUser_NaoEConfundidoComNetUse()
    {
        var s = Nova("C4");
        var antes = JsonSerializer.Serialize(s.Estado.Estacao);
        s.Comando("net user maria.souza");
        Assert.Contains("nao faz parte dos comandos declarados", s.UltimaSaida());
        Assert.Equal(antes, JsonSerializer.Serialize(s.Estado.Estacao));
    }

    [Fact]
    public void NetUseZ_RepetidoEmC4_NaoDuplicaEventos()
    {
        var s = Nova("C4");
        s.Comando(NetUseZ);
        s.Comando(NetUseZ);
        Assert.Single(s.De("UnidadeRedeMapeada"));
        Assert.Single(s.De("AcessoPastaRestabelecido"));
        s.Comando("net use");
        Assert.Contains("MAPEADA para", s.UltimaSaida());
    }

    [Theory]
    [InlineData("C1")]
    [InlineData("C2")]
    [InlineData("C3")]
    public void FluxosExistentes_C1C2C3_ContinuamComCincoCriterios(string causa)
    {
        var s = Nova(causa);
        Abrir(s, "Acesso");
        s.Comando("whoami /groups");
        var av = s.Avaliar();
        Assert.Equal(5, av.Criterios.Count);
        Assert.DoesNotContain(av.Criterios, c => c.Id == "J6");
    }

    private static void AssertReconstrucaoIgual(SessaoDeTeste s)
    {
        var rec = s.Reconstruir();
        Assert.Equal(JsonSerializer.Serialize(s.Estado.Estacao), JsonSerializer.Serialize(rec.Estacao));
        Assert.Equal(JsonSerializer.Serialize(s.Estado.Dialogo), JsonSerializer.Serialize(rec.Dialogo));
        Assert.Equal(JsonSerializer.Serialize(s.Estado.Meta), JsonSerializer.Serialize(rec.Meta));
        Assert.Equal(s.Avaliar().CurriculoVivo.HashAuditoriaSha256,
            Simulador.Avaliacao.Juiz360.Avaliar(rec, s.Eventos).CurriculoVivo.HashAuditoriaSha256);
    }

    // ---------------------------------------------------------------- Ativacao_no_Sorteio: sessoes gravadas ficam estaveis

    // SHA-256 do JSON da Definicao obtida com causa forcada, medido no commit anterior a ativacao (f587cc5),
    // antes de CausasPastaRede e CausasIncidenteSorteio receberem as Causas novas.
    private static readonly Dictionary<(string Cenario, string Versao, string Causa), string> DefinicaoAntesDaAtivacao = new()
    {
        [("pasta-rede-inacessivel", "v1.1", "C1")] = "c026608e84bed2b9b2512d4d5424bcdb4f5c18913a9599ef23aedd5d7fce48b2",
        [("pasta-rede-inacessivel", "v1.1", "C2")] = "1fec6ffb40d479e1aa5a10609d5c9e7339d6e91e5733c654c54650dfb1a9f02f",
        [("pasta-rede-inacessivel", "v1.1", "C3")] = "4012a97daf6eddec57eca639c367330892e17085eb78273cbb59af4962d8d477",
        [("pasta-rede-inacessivel", "v1.1", "C4")] = "638e6789341b590a6d5bf5b52d4913340e47f7bcb9571ad6498c5978f040217a",
        [("incidente-massivo", "v0.1-hackathon", "PATCH_MASSIVO")] = "f4ecf610a77c9146d4b6292e357fa4dea582cded3c7185edc08aabfde60e6192",
        [("incidente-massivo", "v0.1-hackathon", "EMAIL_PROVEDOR")] = "99f07b7e0cbd42820b42b1ef37ff692caa0d447a18683f76e94b67f340473b19",
        [("incidente-massivo", "v0.1-hackathon", "DOMINIO_SUSPENSO")] = "e5a89381d82e116347eece8a4b2b35539b3e80a0e4bc577c00185e1b9a02206e"
    };

    // Os hashes acima foram medidos com o rotulo de nivel da escada anterior. O rotulo passou a ser o nome da escala
    // do Catalogo de Rotas; o hash e conferido com o rotulo antigo para continuar provando que o restante da Definicao
    // (estacao, fila, causa, sorteio) nao mudou.
    private static readonly Dictionary<string, string> RotuloAnteriorDoNivel = new()
    {
        ["Service Desk N1 Jr"] = "Analista Jr (N1)",
        ["N2 Pleno"] = "Analista Pleno (N2)"
    };

    private static string HashDaDefinicao(DefinicaoCenario d)
    {
        var comRotuloAntigo = d with { Nivel = RotuloAnteriorDoNivel.GetValueOrDefault(d.Nivel, d.Nivel) };
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(comRotuloAntigo)))).ToLowerInvariant();
    }

    [Fact]
    public void CausaForcada_AposAAtivacao_DevolveADefinicaoDeAntesParaAsSementes0a199()
    {
        var catalogo = new CatalogoCenarios();
        foreach (var ((cenario, versao, causa), esperado) in DefinicaoAntesDaAtivacao)
            for (long semente = 0; semente < 200; semente++)
            {
                var definicao = catalogo.Obter(cenario, versao, causa, semente);
                Assert.Equal(causa, definicao.Causa);
                Assert.True(esperado == HashDaDefinicao(definicao), $"Definicao mudou: {cenario} {causa} semente {semente}");
            }
    }

    [Fact]
    public void SessaoGravadaComCausaC1aC3_ReconstroiIgualAposAAtivacao()
    {
        foreach (var causa in new[] { "C1", "C2", "C3" })
            foreach (var semente in new long[] { 0, 1, 2, 3, 48, 99, 199 })
            {
                var s = SessaoDeTeste.Iniciar(Cenario, Versao, causa, semente);
                s.Aplicar("itsm.assumir_chamado", new { chamadoId = "CH-0001" });
                s.Comando("whoami /groups");
                s.Comando("nslookup fileserver.aurora.local");
                s.Aplicar("dialogo.pedir_pista");
                Assert.Equal(causa, s.Estado.Meta.Causa);
                BackupRestoreTests.AssertReconstrucaoIgual(s);
            }
    }

    [Fact]
    public void SorteioSemCausaForcada_AposAAtivacao_UsaC1aC4ESoC4EhNova()
    {
        string[] sorteio = ["C1", "C2", "C3", "C4"];
        var catalogo = new CatalogoCenarios();
        var vistas = new HashSet<string>();
        for (long semente = 0; semente < 200; semente++)
        {
            var causa = catalogo.Obter(Cenario, Versao, null, semente).Causa;
            Assert.Equal(sorteio[new SplitMix64(semente).NextInt(4)], causa);
            vistas.Add(causa);
        }
        Assert.Equal(4, vistas.Count);
        Assert.Equal("C4", catalogo.Obter(Cenario, Versao, null, 48).Causa);
        Assert.Equal("C3", catalogo.Obter(Cenario, Versao, null, 2).Causa);
    }
}