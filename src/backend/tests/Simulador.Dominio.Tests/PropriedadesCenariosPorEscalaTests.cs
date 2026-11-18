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
}
