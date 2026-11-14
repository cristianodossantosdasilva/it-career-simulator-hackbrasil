using System.Text.Json;
using Simulador.Avaliacao;
using Simulador.Cenarios;
using Simulador.Dominio;
using Simulador.Itsm;

namespace Simulador.Dominio.Tests;

public class DominioTests
{
    private readonly CatalogoCenarios _catalogo = new();

    private static IReadOnlyDictionary<string, JsonElement> Dados(object obj)
    {
        var json = JsonSerializer.Serialize(obj);
        return JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json)!;
    }

    [Fact]
    public void SplitMix64_MesmaSemente_ProduzMesmaSequencia()
    {
        var a = new SplitMix64(12345);
        var b = new SplitMix64(12345);

        Assert.Equal(a.NextUInt64(), b.NextUInt64());
        Assert.Equal(a.NextInt(3), b.NextInt(3));
    }

    [Fact]
    public void FluxoCompleto_C1_AtendeTodosCriteriosJ1aJ5_EReconstrucaoEquivalente()
    {
        var cenario = _catalogo.Obter("pasta-rede-inacessivel", "v1.1", "C1", 42);
        var inicio = Motor.Iniciar(cenario, 42);
        var eventos = inicio.Eventos.ToList();
        var estado = inicio.NovoEstado;

        void Aplicar(string tipo, object? payload = null)
        {
            var res = Motor.Aplicar(estado, new Acao(tipo, payload is null ? null : Dados(payload)), cenario);
            estado = res.NovoEstado;
            eventos.AddRange(res.Eventos);
        }

        Aplicar("itsm.assumir_chamado", new { chamadoId = "CH-0001" });
        Aplicar("itsm.classificar_chamado", new { chamadoId = "CH-0001", categoria = "Acesso a Rede", urgencia = "Alta", impacto = "Medio" });
        Aplicar("estacao.executar_comando", new { comando = "whoami /groups" });
        Aplicar("estacao.elevar_privilegio");
        Aplicar("estacao.adicionar_usuario_grupo", new { usuario = "maria.souza", grupo = "GRP_FINANCEIRO_PASTA" });
        Aplicar("itsm.resolver_chamado", new { chamadoId = "CH-0001", notaPublica = "Usuario incluido no grupo GRP_FINANCEIRO_PASTA." });

        var avaliacao = Juiz360.Avaliar(estado, eventos);
        Assert.True(avaliacao.Concluida);
        Assert.False(avaliacao.IncidenteSeguranca);
        Assert.All(avaliacao.Criterios, c => Assert.True(c.Atendido, $"Criterio {c.Id} falhou"));

        var reconstruido = Projecao.Reconstruir(eventos, _catalogo);
        Assert.Equal(estado.Meta.UltimoSeq, reconstruido.Meta.UltimoSeq);
        Assert.Equal(estado.Meta.MinutoSimulado, reconstruido.Meta.MinutoSimulado);
        Assert.True(reconstruido.Estacao.CompartilhamentoAcessivel);
        Assert.Equal(StatusChamado.Resolvido, reconstruido.Itsm.ObterChamado("CH-0001")!.Status);
    }

    [Fact]
    public void ComandoNaoSuportado_NaoAlteraEstadoEEmiteEventoNeutro()
    {
        var cenario = _catalogo.Obter("pasta-rede-inacessivel", "v1.1", "C1", 42);
        var inicio = Motor.Iniciar(cenario, 42);

        var res = Motor.Aplicar(inicio.NovoEstado, new Acao("estacao.executar_comando", Dados(new { comando = "format c:" })), cenario);

        Assert.Single(res.Eventos);
        Assert.Equal("ComandoNaoSuportado", res.Eventos[0].Tipo);
        Assert.False(res.NovoEstado.Estacao.CompartilhamentoAcessivel);
    }

    [Fact]
    public void DesativarFirewall_RegistraAcaoPrejudicialESinalizaIncidenteSeguranca()
    {
        var cenario = _catalogo.Obter("pasta-rede-inacessivel", "v1.1", "C1", 42);
        var inicio = Motor.Iniciar(cenario, 42);
        var eventos = inicio.Eventos.ToList();

        var r1 = Motor.Aplicar(inicio.NovoEstado, new Acao("estacao.elevar_privilegio"), cenario);
        eventos.AddRange(r1.Eventos);

        var r2 = Motor.Aplicar(r1.NovoEstado, new Acao("estacao.desativar_firewall"), cenario);
        eventos.AddRange(r2.Eventos);

        Assert.Contains(r2.Eventos, e => e.Tipo == "AcaoPrejudicialRegistrada");
        var av = Juiz360.Avaliar(r2.NovoEstado, eventos);
        Assert.True(av.IncidenteSeguranca);
        Assert.False(av.Criterios.First(c => c.Id == "J5").Atendido);
    }

    [Fact]
    public void FluxoCompleto_C2_DnsErrado_EscalonarCorrigeDnsEFlushdnsElevadoRestabelece()
    {
        var cenario = _catalogo.Obter("pasta-rede-inacessivel", "v1.1", "C2", 42);
        var inicio = Motor.Iniciar(cenario, 42);
        var eventos = inicio.Eventos.ToList();
        var estado = inicio.NovoEstado;

        void Aplicar(string tipo, object? payload = null)
        {
            var res = Motor.Aplicar(estado, new Acao(tipo, payload is null ? null : Dados(payload)), cenario);
            estado = res.NovoEstado;
            eventos.AddRange(res.Eventos);
        }

        Aplicar("itsm.assumir_chamado", new { chamadoId = "CH-0001" });
        Aplicar("itsm.classificar_chamado", new { chamadoId = "CH-0001", categoria = "Rede", urgencia = "Alta", impacto = "Medio" });
        Aplicar("estacao.executar_comando", new { comando = "nslookup fileserver.aurora.local" });

        // flushdns sem elevacao retorna erro 740
        Aplicar("estacao.executar_comando", new { comando = "ipconfig /flushdns" });
        Assert.False(estado.Estacao.CompartilhamentoAcessivel);

        // Escalonar para N2 em C2 emite DnsRegistroCorrigido
        Aplicar("itsm.escalonar_chamado", new { chamadoId = "CH-0001", destino = "N2", notaInterna = "DNS retornando IP incorreto." });
        Assert.Contains(eventos, e => e.Tipo == "DnsRegistroCorrigido");

        // Elevar e flushdns restabelece
        Aplicar("estacao.elevar_privilegio");
        Aplicar("estacao.executar_comando", new { comando = "ipconfig /flushdns" });
        Assert.True(estado.Estacao.CompartilhamentoAcessivel);

        Aplicar("itsm.resolver_chamado", new { chamadoId = "CH-0001", notaPublica = "DNS corrigido e cache atualizado." });
        var av = Juiz360.Avaliar(estado, eventos);
        Assert.True(av.Concluida);
        Assert.All(av.Criterios, c => Assert.True(c.Atendido, $"Criterio {c.Id} falhou"));
    }

    [Fact]
    public void FluxoCompleto_C3_ServicoParado_IniciarElevadoRestabelece()
    {
        var cenario = _catalogo.Obter("pasta-rede-inacessivel", "v1.1", "C3", 42);
        var inicio = Motor.Iniciar(cenario, 42);
        var eventos = inicio.Eventos.ToList();
        var estado = inicio.NovoEstado;

        void Aplicar(string tipo, object? payload = null)
        {
            var res = Motor.Aplicar(estado, new Acao(tipo, payload is null ? null : Dados(payload)), cenario);
            estado = res.NovoEstado;
            eventos.AddRange(res.Eventos);
        }

        Aplicar("itsm.assumir_chamado", new { chamadoId = "CH-0001" });
        Aplicar("itsm.classificar_chamado", new { chamadoId = "CH-0001", categoria = "Estacao", urgencia = "Media", impacto = "Medio" });
        Aplicar("estacao.executar_comando", new { comando = "net start" });
        Aplicar("estacao.executar_comando", new { comando = "net start Workstation" }); // sem elevacao: erro 5
        Assert.False(estado.Estacao.CompartilhamentoAcessivel);

        Aplicar("estacao.elevar_privilegio");
        Aplicar("estacao.executar_comando", new { comando = "net start Workstation" });
        Assert.True(estado.Estacao.CompartilhamentoAcessivel);

        Aplicar("itsm.resolver_chamado", new { chamadoId = "CH-0001", notaPublica = "Servico Workstation iniciado." });
        var av = Juiz360.Avaliar(estado, eventos);
        Assert.True(av.Concluida);
        Assert.All(av.Criterios, c => Assert.True(c.Atendido));
    }

    [Fact]
    public void Nivel1_EngenhariaSocial_RecusaCorretaGanhaBonus20Xp_ResetIndevidoGeraIncidente()
    {
        var cenario = _catalogo.Obter("triagem-engenharia-social", "v0.1-hackathon", null, 1);
        var inicio = Motor.Iniciar(cenario, 1);
        var eventos = inicio.Eventos.ToList();
        var estado = inicio.NovoEstado;

        void Aplicar(string tipo, object? payload = null)
        {
            var res = Motor.Aplicar(estado, new Acao(tipo, payload is null ? null : Dados(payload)), cenario);
            estado = res.NovoEstado;
            eventos.AddRange(res.Eventos);
        }

        Aplicar("itsm.assumir_chamado", new { chamadoId = "CH-0001" });
        Aplicar("itsm.classificar_chamado", new { chamadoId = "CH-0001", categoria = "Seguranca", urgencia = "Alta", impacto = "Medio" });
        Aplicar("seguranca.consultar_politica");
        Aplicar("itsm.adicionar_nota", new { chamadoId = "CH-0001", tipo = "Interna", texto = "Tentativa de engenharia social sem token." });
        Aplicar("seguranca.recusar_reset");
        Aplicar("itsm.resolver_chamado", new { chamadoId = "CH-0001", notaPublica = "Solicitacao recusada conforme politica de seguranca KB-001." });

        var av = Juiz360.Avaliar(estado, eventos);
        Assert.True(av.Concluida);
        Assert.False(av.IncidenteSeguranca);
        Assert.Equal(60, av.XpTotal); // 4*10 + 20 bonus seguranca
    }

    [Fact]
    public void Nivel3_IncidenteMassivo_ProblemaEmLoteERcaNormalizada()
    {
        var cenario = _catalogo.Obter("incidente-massivo", "v0.1-hackathon", null, 1);
        var inicio = Motor.Iniciar(cenario, 1);
        var eventos = inicio.Eventos.ToList();
        var estado = inicio.NovoEstado;

        void Aplicar(string tipo, object? payload = null)
        {
            var res = Motor.Aplicar(estado, new Acao(tipo, payload is null ? null : Dados(payload)), cenario);
            estado = res.NovoEstado;
            eventos.AddRange(res.Eventos);
        }

        foreach (var id in new[] { "CH-0001", "CH-0002", "CH-0003" })
            Aplicar("itsm.classificar_chamado", new { chamadoId = id, categoria = "ERP", urgencia = "Critica", impacto = "Alto" });

        Aplicar("itsm.criar_problema", new { titulo = "Queda ERP apos patch" });
        foreach (var id in new[] { "CH-0001", "CH-0002", "CH-0003" })
            Aplicar("itsm.vincular_problema", new { problemaId = "PRB-0001", chamadoId = id });

        Aplicar("estacao.ler_logs");
        Aplicar("estacao.elevar_privilegio");
        Aplicar("estacao.reiniciar_servico", new { servico = "AuroraGateway" });
        Aplicar("itsm.registrar_causa_raiz", new { problemaId = "PRB-0001", causaRaiz = "Servico AuroraGateway parou apos atualizacao recente." });
        Aplicar("itsm.resolver_problema", new { problemaId = "PRB-0001", notaPublica = "Gateway reiniciado e ERP normalizado." });

        var av = Juiz360.Avaliar(estado, eventos);
        Assert.True(av.Concluida);
        Assert.All(av.Criterios, c => Assert.True(c.Atendido, $"Criterio {c.Id} falhou"));
    }
}
