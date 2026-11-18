using System.Text.Json;
using Simulador.Cenarios;
using Simulador.Dialogo;

namespace Simulador.Dominio.Tests;

/// <summary>Propriedades "para toda entrada valida" com sementes geradas por SplitMix64 fixo, sem biblioteca nova.</summary>
public class PropriedadesCenariosPorEscalaTests
{
    private const string Cenario = "reset-senha-desbloqueio";
    private const string Versao = "v0.1-hackathon";
    private static readonly string[] CausasReset = ["SENHA_ESQUECIDA", "CONTA_BLOQUEADA", "SENHA_EXPIRADA"];

    private static IEnumerable<long> Sementes(int quantidade, ulong origem)
    {
        var rng = new SplitMix64(unchecked((long)origem));
        for (var i = 0; i < quantidade; i++) yield return (long)(rng.NextUInt64() % 1_000_000UL);
    }

    public static IEnumerable<object[]> Sementes50() => Sementes(50, 0xC0FFEEUL).Select(s => new object[] { s });
    public static IEnumerable<object[]> CausasESementes50() =>
        CausasReset.SelectMany(c => Sementes(50, 0xC0FFEEUL).Select(s => new object[] { c, s }));
    public static IEnumerable<object[]> Sementes200() => Sementes(200, 0xBEEFUL).Select(s => new object[] { s });

    public static IEnumerable<object[]> PermutacoesSensiveis()
    {
        string[] cmds = ["redefinir-senha fernanda.lima", "desbloquear-conta fernanda.lima", "enviar-link-troca fernanda.lima"];
        int[][] ordens = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
        foreach (var ordem in ordens)
            foreach (var semente in Sementes(10, 0xA11CEUL))
                yield return new object[] { string.Join("|", ordem.Select(i => cmds[i])), semente };
    }

    private static void AbrirEVerificarSeNecessario(SessaoDeTeste s)
    {
        s.Aplicar("itsm.assumir_chamado", new { chamadoId = "CH-0001" });
        s.Aplicar("itsm.classificar_chamado", new { chamadoId = "CH-0001", categoria = "Acesso", urgencia = "Alta", impacto = "Medio" });
    }

    // Feature: cenarios-por-escala, Property 1: Reconstrucao equivalente
    // Validates: Requirements 15.2, 15.3, 15.4
    [Theory]
    [MemberData(nameof(CausasESementes50))]
    public void Propriedade1_ReconstrucaoEquivalente_NasDuasVariantesDeCadaCausa(string causa, long semente)
    {
        var s = SessaoDeTeste.Iniciar(Cenario, Versao, causa, semente);
        AbrirEVerificarSeNecessario(s);
        s.Comando("net user fernanda.lima");
        if (causa == "CONTA_BLOQUEADA") s.Comando("eventos-seguranca fernanda.lima");
        if (s.Cenario.PedidoPorTerceiro)
        {
            s.Comando("diretorio fernanda.lima");
            s.Comando("discar 2087");
        }
        s.Aplicar("dialogo.verificar_identidade", new { matricula = "AUR-2087", ramal = "2087" });
        s.Comando(causa switch
        {
            "CONTA_BLOQUEADA" => "desbloquear-conta fernanda.lima",
            "SENHA_EXPIRADA" => "enviar-link-troca fernanda.lima",
            _ => "redefinir-senha fernanda.lima"
        });
        s.Aplicar("dialogo.pedir_pista");
        s.Aplicar("itsm.resolver_chamado", new { chamadoId = "CH-0001", notaPublica = "Senha temporaria entregue a titular." });

        var rec = s.Reconstruir();
        Assert.Equal(JsonSerializer.Serialize(s.Estado.Estacao), JsonSerializer.Serialize(rec.Estacao));
        Assert.Equal(JsonSerializer.Serialize(s.Estado.Dialogo), JsonSerializer.Serialize(rec.Dialogo));
        Assert.Equal(JsonSerializer.Serialize(s.Estado.Meta), JsonSerializer.Serialize(rec.Meta));
        Assert.Equal(s.Avaliar().CurriculoVivo.HashAuditoriaSha256,
            Simulador.Avaliacao.Juiz360.Avaliar(rec, s.Eventos).CurriculoVivo.HashAuditoriaSha256);
    }

    // Feature: cenarios-por-escala, Property 2: Determinismo do Sorteio
    // Validates: Requirements 1.4, 1.5
    [Theory]
    [MemberData(nameof(Sementes200))]
    public void Propriedade2_Sorteio_EDeterministicoEForcarACausaNaoMudaAVariante(long semente)
    {
        var catalogo = new CatalogoCenarios();
        var a = catalogo.Obter(Cenario, Versao, null, semente);
        var b = catalogo.Obter(Cenario, Versao, null, semente);
        Assert.Equal(a.Causa, b.Causa);
        Assert.Equal(a.PedidoPorTerceiro, b.PedidoPorTerceiro);
        Assert.Contains(a.Causa, CausasReset);
        foreach (var causa in CausasReset)
        {
            var forcada = catalogo.Obter(Cenario, Versao, causa, semente);
            Assert.Equal(causa, forcada.Causa);
            Assert.Equal(a.PedidoPorTerceiro, forcada.PedidoPorTerceiro);
        }
    }

    // Feature: cenarios-por-escala, Property 3: Acao sensivel sem identidade nunca restabelece
    // Validates: Requirements 2.10, 6.4
    [Theory]
    [MemberData(nameof(PermutacoesSensiveis))]
    public void Propriedade3_AcaoSensivelSemIdentidade_NuncaRestabeleceNemAlteraConta(string comandos, long semente)
    {
        var s = SessaoDeTeste.Iniciar(Cenario, Versao, "SENHA_ESQUECIDA", semente);
        AbrirEVerificarSeNecessario(s);
        var statusAntes = s.Estado.Estacao.Servicos.Single(x => x.Nome == "ContaAD").Status;
        var lista = comandos.Split('|');
        foreach (var c in lista) s.Comando(c);

        Assert.Equal(statusAntes, s.Estado.Estacao.Servicos.Single(x => x.Nome == "ContaAD").Status);
        Assert.False(s.Estado.Estacao.CompartilhamentoAcessivel);
        Assert.Empty(s.De("AcessoContaRestabelecido"));
        Assert.Equal(lista.Length, s.De("AcaoSensivelSemVerificacao").Count());
        var av = s.Avaliar();
        Assert.False(av.Criterios.Single(c => c.Id == "H1").Atendido);
        Assert.False(av.Criterios.Single(c => c.Id == "H4").Atendido);
        Assert.True(av.IncidenteSeguranca);
    }

    public static IEnumerable<object[]> OrdensDeBloqueio()
    {
        string[] cmds = ["net user fernanda.lima", "eventos-seguranca fernanda.lima", "desbloquear-conta fernanda.lima"];
        int[][] ordens = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
        foreach (var ordem in ordens)
            foreach (var semente in Sementes(10, 0xB10C0UL))
                yield return new object[] { string.Join("|", ordem.Select(i => cmds[i])), semente };
    }

    // Feature: cenarios-por-escala, Property 4: Desbloqueio sem origem sempre bloqueia de novo
    // Validates: Requirements 4.4, 4.5
    [Theory]
    [MemberData(nameof(OrdensDeBloqueio))]
    public void Propriedade4_DesbloqueioSemOrigem_SempreBloqueiaDeNovo(string comandos, long semente)
    {
        var s = SessaoDeTeste.Iniciar(Cenario, Versao, "CONTA_BLOQUEADA", semente);
        AbrirEVerificarSeNecessario(s);
        if (s.Cenario.PedidoPorTerceiro) s.Comando("discar 2087");
        s.Aplicar("dialogo.verificar_identidade", new { matricula = "AUR-2087", ramal = "2087" });
        var lista = comandos.Split('|');
        foreach (var c in lista) s.Comando(c);

        var origemAntes = Array.IndexOf(lista, "eventos-seguranca fernanda.lima") < Array.IndexOf(lista, "desbloquear-conta fernanda.lima");
        var status = s.Estado.Estacao.Servicos.Single(x => x.Nome == "ContaAD").Status;
        if (origemAntes)
        {
            Assert.Empty(s.De("ContaBloqueadaNovamente"));
            Assert.Single(s.De("AcessoContaRestabelecido"));
            Assert.Equal("Ativa", status);
        }
        else
        {
            Assert.Single(s.De("ContaBloqueadaNovamente"));
            Assert.Empty(s.De("AcessoContaRestabelecido"));
            Assert.Equal("Bloqueada", status);
        }
    }

    // Feature: cenarios-por-escala, Property 9: Criterios do Juiz_360 deterministicos
    // Validates: Requirements 6.7, 15.3, 17.3
    [Theory]
    [MemberData(nameof(CausasESementes50))]
    public void Propriedade9_Juiz360_EDeterministicoETodoLinkKbExisteNoCatalogo(string causa, long semente)
    {
        var s = SessaoDeTeste.Iniciar(Cenario, Versao, causa, semente);
        AbrirEVerificarSeNecessario(s);
        s.Comando("net user fernanda.lima");
        s.Comando("redefinir-senha fernanda.lima");
        var a = s.Avaliar();
        var b = s.Avaliar();
        Assert.Equal(JsonSerializer.Serialize(a), JsonSerializer.Serialize(b));
        Assert.Equal(a.CurriculoVivo.HashAuditoriaSha256, b.CurriculoVivo.HashAuditoriaSha256);
        Assert.All(a.Criterios, c => Assert.Contains(c.LinkKb!, Simulador.Avaliacao.KbCatalogo.UriParaId.Keys));
    }

    // Feature: cenarios-por-escala, Property 6: Comando fora da lista
    // Validates: Requirements 1.7, 19.4
    [Theory]
    [MemberData(nameof(Sementes200))]
    public void Propriedade6_ComandoForaDaLista_NaoMudaEstado(long semente)
    {
        var s = SessaoDeTeste.Iniciar(Cenario, Versao, "SENHA_ESQUECIDA", semente);
        var rng = new SplitMix64(semente);
        var tamanho = 3 + rng.NextInt(12);
        var texto = "z" + new string(Enumerable.Range(0, tamanho).Select(_ => (char)('a' + rng.NextInt(26))).ToArray());
        var antes = JsonSerializer.Serialize(s.Estado.Estacao) + JsonSerializer.Serialize(s.Estado.Dialogo);
        s.Comando(texto);
        Assert.Single(s.De("ComandoNaoSuportado"));
        Assert.Empty(s.De("ComandoExecutado"));
        Assert.Equal(antes, JsonSerializer.Serialize(s.Estado.Estacao) + JsonSerializer.Serialize(s.Estado.Dialogo));
    }

    // Feature: cenarios-por-escala, Property 7: Pistas e respostas nao vazam a Causa
    // Validates: Requirements 14.3, 15.6
    [Theory]
    [MemberData(nameof(Sementes50))]
    public async Task Propriedade7_PistasERespostas_NaoVazamACausa(long semente)
    {
        var s = SessaoDeTeste.Iniciar(Cenario, Versao, "SENHA_ESQUECIDA", semente);
        for (var i = 0; i < 3; i++) s.Aplicar("dialogo.pedir_pista");
        var textos = s.De("PistaSolicitada").Select(e => e.Dados["texto"]!.ToString()!).ToList();

        var dialogo = new FallbackRoteirizadoDialogo();
        string[] perguntas = ["Qual o problema?", "Qual a matricula?", "O que devo fazer?", "Como diagnosticar a conta?", "Qual o ramal?"];
        foreach (var persona in new[] { "cliente", "techlead" })
            foreach (var pergunta in perguntas)
                textos.Add((await dialogo.ResponderAsync(s.Estado, persona, pergunta)).Mensagem);

        Assert.Equal(3 + 2 * perguntas.Length, textos.Count);
        Assert.All(textos, t =>
        {
            Assert.DoesNotContain("SENHA_ESQUECIDA", t, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("CONTA_BLOQUEADA", t, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("SENHA_EXPIRADA", t, StringComparison.OrdinalIgnoreCase);
        });
    }

    // Feature: cenarios-por-escala, Property 8: Sorteio legado inalterado (pasta-rede-inacessivel antes da ativacao)
    // Validates: Requirements 16.2
    [Theory]
    [MemberData(nameof(Sementes200Sequenciais))]
    public void Propriedade8_SorteioLegadoDePastaRede_ContinuaComC1C2C3(long semente)
    {
        string[] legado = ["C1", "C2", "C3"];
        var esperado = legado[new SplitMix64(semente).NextInt(3)];
        var obtido = new CatalogoCenarios().Obter("pasta-rede-inacessivel", "v1.1", null, semente);
        Assert.Equal(esperado, obtido.Causa);
    }

    public static IEnumerable<object[]> Sementes200Sequenciais() => Enumerable.Range(0, 200).Select(s => new object[] { (long)s });

    // Feature: cenarios-por-escala, Property 1: Reconstrucao equivalente (C4)
    // Validates: Requirements 15.2, 15.3
    [Theory]
    [MemberData(nameof(Sementes50))]
    public void Propriedade1_ReconstrucaoEquivalente_C4(long semente)
    {
        var s = SessaoDeTeste.Iniciar("pasta-rede-inacessivel", "v1.1", "C4", semente);
        s.Aplicar("itsm.assumir_chamado", new { chamadoId = "CH-0001" });
        s.Aplicar("itsm.classificar_chamado", new { chamadoId = "CH-0001", categoria = "Solicitacao de Servico", urgencia = "Media", impacto = "Baixo" });
        s.Comando("whoami /groups");
        s.Comando(@"net use z: \\fileserver.aurora.local\Financeiro");
        s.Aplicar("itsm.resolver_chamado", new { chamadoId = "CH-0001", notaPublica = "Unidade Z: mapeada." });

        var rec = s.Reconstruir();
        Assert.Equal(JsonSerializer.Serialize(s.Estado.Estacao), JsonSerializer.Serialize(rec.Estacao));
        Assert.Equal(JsonSerializer.Serialize(s.Estado.Dialogo), JsonSerializer.Serialize(rec.Dialogo));
        Assert.Equal(JsonSerializer.Serialize(s.Estado.Meta), JsonSerializer.Serialize(rec.Meta));
        Assert.Equal(s.Avaliar().CurriculoVivo.HashAuditoriaSha256,
            Simulador.Avaliacao.Juiz360.Avaliar(rec, s.Eventos).CurriculoVivo.HashAuditoriaSha256);
    }

    private const string CenarioBackup = "falha-backup-restore";

    private static void FluxoCompletoBackup(SessaoDeTeste s, string causa)
    {
        s.Aplicar("itsm.assumir_chamado", new { chamadoId = "CH-0001" });
        s.Aplicar("itsm.classificar_chamado", new { chamadoId = "CH-0001", categoria = "Incidente", urgencia = "Alta", impacto = "Alto" });
        s.Comando("backup log");
        s.Aplicar("dialogo.pedir_pista");
        s.Aplicar("estacao.elevar_privilegio");
        if (causa == "REPOSITORIO_CHEIO")
        {
            s.Comando("backup repo expandir");
            s.Comando("backup job executar");
        }
        else
        {
            s.Comando("backup cadeia verificar");
            s.Comando(@"backup restore --origem imutavel --destino \\fileserver.aurora.local\Financeiro");
        }
        s.Aplicar("itsm.resolver_chamado", new { chamadoId = "CH-0001", notaPublica = "Backup restabelecido." });
    }

    public static IEnumerable<object[]> CausasDoBackupESementes50() =>
        CausasBackupEntregues.SelectMany(c => Sementes(50, 0xC0FFEEUL).Select(s => new object[] { c, s }));

    // Feature: cenarios-por-escala, Property 1: Reconstrucao equivalente (falha-backup-restore, as 2 Causas)
    // Validates: Requirements 15.2, 15.3
    [Theory]
    [MemberData(nameof(CausasDoBackupESementes50))]
    public void Propriedade1_ReconstrucaoEquivalente_BackupNasDuasCausas(string causa, long semente)
    {
        var s = SessaoDeTeste.Iniciar(CenarioBackup, Versao, causa, semente);
        FluxoCompletoBackup(s, causa);

        var rec = s.Reconstruir();
        Assert.Equal(JsonSerializer.Serialize(s.Estado.Estacao), JsonSerializer.Serialize(rec.Estacao));
        Assert.Equal(JsonSerializer.Serialize(s.Estado.Dialogo), JsonSerializer.Serialize(rec.Dialogo));
        Assert.Equal(JsonSerializer.Serialize(s.Estado.Meta), JsonSerializer.Serialize(rec.Meta));
        Assert.Equal(s.Avaliar().CurriculoVivo.HashAuditoriaSha256,
            Simulador.Avaliacao.Juiz360.Avaliar(rec, s.Eventos).CurriculoVivo.HashAuditoriaSha256);
    }

    // Feature: cenarios-por-escala, Property 2: Determinismo do Sorteio (falha-backup-restore)
    // Validates: Requirements 11.2, 15.3
    [Theory]
    [MemberData(nameof(Sementes200))]
    public void Propriedade2_SorteioDoBackup_EDeterministicoEForcarACausaSubstituiSoACausa(long semente)
    {
        var catalogo = new CatalogoCenarios();
        var a = catalogo.Obter(CenarioBackup, Versao, null, semente);
        var b = catalogo.Obter(CenarioBackup, Versao, null, semente);
        Assert.Equal(a.Causa, b.Causa);
        Assert.Contains(a.Causa, CausasBackupEntregues);
        foreach (var causa in CausasBackupEntregues)
            Assert.Equal(causa, catalogo.Obter(CenarioBackup, Versao, causa, semente).Causa);
        Assert.Equal(a.Causa, catalogo.Obter(CenarioBackup, Versao, "CAUSA_INEXISTENTE", semente).Causa);
    }

    private static readonly string[] CausasBackupEntregues = ["REPOSITORIO_CHEIO", "CADEIA_CORROMPIDA"];

    public static IEnumerable<object[]> AcoesInvalidasDoBackup()
    {
        foreach (var semente in Sementes(15, 0x5EEDUL))
        {
            yield return new object[] { "estacao.executar_comando", "{\"comando\":\"\"}", semente };
            yield return new object[] { "estacao.executar_comando", "{}", semente };
            yield return new object[] { "itsm.resolver_chamado", "{\"chamadoId\":\"CH-0001\"}", semente };
            yield return new object[] { "estacao.reiniciar_servico", "{\"servico\":\"JobBackupFinanceiro\"}", semente };
            yield return new object[] { "estacao.adicionar_usuario_grupo", "{}", semente };
        }
    }

    // Feature: cenarios-por-escala, Property 5: Rejeicao nao muda estado
    // Validates: Requirement 15.5
    [Theory]
    [MemberData(nameof(AcoesInvalidasDoBackup))]
    public void Propriedade5_AcaoComArgumentosInvalidos_RejeitaSemMudarEstado(string tipo, string json, long semente)
    {
        var s = SessaoDeTeste.Iniciar(CenarioBackup, Versao, "REPOSITORIO_CHEIO", semente);
        var antes = JsonSerializer.Serialize(s.Estado.Estacao) + JsonSerializer.Serialize(s.Estado.Dialogo) + JsonSerializer.Serialize(s.Estado.Itsm);
        var dados = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json);
        var res = Motor.Aplicar(s.Estado, new Acao(tipo, dados), s.Cenario);
        Assert.Single(res.Eventos);
        Assert.Equal("AcaoRejeitada", res.Eventos[0].Tipo);
        var depois = JsonSerializer.Serialize(res.NovoEstado.Estacao) + JsonSerializer.Serialize(res.NovoEstado.Dialogo) + JsonSerializer.Serialize(res.NovoEstado.Itsm);
        Assert.Equal(antes, depois);
    }

    // Feature: cenarios-por-escala, Property 9: Criterios do Juiz_360 deterministicos (falha-backup-restore)
    // Validates: Requirements 13.5, 15.3, 17.3
    [Theory]
    [MemberData(nameof(CausasDoBackupESementes50))]
    public void Propriedade9_Juiz360DoBackup_EDeterministicoETodoLinkKbExisteNoCatalogo(string causa, long semente)
    {
        var s = SessaoDeTeste.Iniciar(CenarioBackup, Versao, causa, semente);
        FluxoCompletoBackup(s, causa);
        var a = s.Avaliar();
        var b = s.Avaliar();
        Assert.Equal(JsonSerializer.Serialize(a), JsonSerializer.Serialize(b));
        Assert.Equal(a.CurriculoVivo.HashAuditoriaSha256, b.CurriculoVivo.HashAuditoriaSha256);
        Assert.Equal(causa == "CADEIA_CORROMPIDA" ? 7 : 6, a.Criterios.Count);
        Assert.All(a.Criterios, c => Assert.Contains(c.LinkKb!, Simulador.Avaliacao.KbCatalogo.UriParaId.Keys));
    }}
