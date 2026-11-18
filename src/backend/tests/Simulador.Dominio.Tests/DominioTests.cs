using System.Text.Json;
using System.Text.RegularExpressions;
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
    public void LinksJuiz360_ResolvemNoCatalogoCompartilhadoComFrontend()
    {
        var raiz = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "..", ".."));
        var idsBackend = KbCatalogo.UriParaId.Values.OrderBy(x => x).ToArray();
        Assert.Equal(idsBackend.Length, idsBackend.Distinct().Count());
        var fonteFrontend = File.ReadAllText(Path.Combine(raiz, "src", "frontend", "src", "data", "kbCatalogo.ts"));
        var idsFrontend = Regex.Matches(fonteFrontend, @"id:\s*'(KB-\d{3})'").Select(m => m.Groups[1].Value).OrderBy(x => x).ToArray();
        Assert.Equal(idsBackend, idsFrontend);
        var catalogoFrontend = Regex.Matches(fonteFrontend, @"id:\s*'(KB-\d{3})',\s*uri:\s*'([^']+)'")
            .ToDictionary(m => m.Groups[2].Value, m => m.Groups[1].Value);
        Assert.Equal(KbCatalogo.UriParaId.Count, catalogoFrontend.Count);
        foreach (var (uri, id) in KbCatalogo.UriParaId)
            Assert.Equal(id, catalogoFrontend[uri]);
        var pastaAvaliacao = Path.Combine(raiz, "src", "backend", "src", "Simulador.Avaliacao");
        var fonteJuiz = string.Concat(Directory.GetFiles(pastaAvaliacao, "*.cs").Where(f => !Path.GetFileName(f).Equals("KbCatalogo.cs", StringComparison.Ordinal)).Select(File.ReadAllText));
        var urisEmitidas = Regex.Matches(fonteJuiz, "kb://[a-z0-9/-]+").Select(m => m.Value).Distinct();
        Assert.NotEmpty(urisEmitidas);
        Assert.All(urisEmitidas, uri => Assert.Contains(uri, KbCatalogo.UriParaId.Keys));
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
        var cenario = _catalogo.Obter("incidente-massivo", "v0.1-hackathon", "PATCH_MASSIVO", 1);
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

    [Fact]
    public void Nivel4_SreCloud_OomKilled_DiagnosticoEMitigacaoElevada_AprovaJuiz360()
    {
        var cenario = _catalogo.Obter("sre-cloud-latencia", "v2.0", "OOM_KILLED", 42);
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
        Aplicar("itsm.classificar_chamado", new { chamadoId = "CH-0001", categoria = "Cloud/SRE", urgencia = "Critica", impacto = "Alto" });
        Aplicar("estacao.executar_comando", new { comando = "kubectl get pods" });
        Aplicar("estacao.executar_comando", new { comando = "kubectl logs api-pedidos-7f9b" });
        Aplicar("estacao.elevar_privilegio");
        Aplicar("estacao.executar_comando", new { comando = "kubectl set resources deployment/api-pedidos --limits=memory=512Mi" });
        Assert.True(estado.Estacao.CompartilhamentoAcessivel);

        Aplicar("itsm.resolver_chamado", new { chamadoId = "CH-0001", notaPublica = "Limite de memoria ajustado e pod estabilizado." });
        var av = Juiz360.Avaliar(estado, eventos);
        Assert.True(av.Concluida);
        Assert.False(av.IncidenteSeguranca);
        Assert.Equal(100, av.XpTotal);
        Assert.All(av.Criterios, c => Assert.True(c.Atendido, $"Criterio {c.Id} falhou"));
    }

    [Fact]
    public void Nivel4b_SqlReadOnly_BloqueiaEscritaEInjecao_EAprovaSelectLimpo()
    {
        var cenario = _catalogo.Obter("diagnostico-sql-readonly", "v2.0", null, 1);
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
        Aplicar("itsm.classificar_chamado", new { chamadoId = "CH-0001", categoria = "Banco de Dados", urgencia = "Alta", impacto = "Medio" });
        Aplicar("estacao.executar_comando", new { comando = "SELECT * FROM pagamentos" });
        Aplicar("estacao.executar_comando", new { comando = "SELECT * FROM pedidos" });
        Aplicar("estacao.executar_comando", new { comando = "SELECT status, COUNT(*) FROM pagamentos GROUP BY status" });
        Aplicar("itsm.resolver_chamado", new { chamadoId = "CH-0001", notaPublica = "Pagamento duplicado PAG-3 identificado via SELECT." });

        var avLimpa = Juiz360.Avaliar(estado, eventos);
        Assert.True(avLimpa.Concluida);
        Assert.False(avLimpa.IncidenteSeguranca);
        Assert.Equal(80, avLimpa.XpTotal);

        // Tentativa de escrita/injecao deve ser bloqueada e sinalizar incidente
        var resInjecao = Motor.Aplicar(estado, new Acao("estacao.executar_comando", Dados(new { comando = "SELECT * FROM pedidos; DROP TABLE pagamentos; --" })), cenario);
        Assert.Contains(resInjecao.Eventos, e => e.Tipo == "AcaoPrejudicialRegistrada");
        Assert.Contains(resInjecao.Eventos, e => e.Tipo == "ComandoNaoSuportado");
    }

    [Theory]
    [InlineData("INSERT INTO pagamentos VALUES (1)")]
    [InlineData("SELECT * FROM pagamentos; DROP TABLE pedidos")]
    [InlineData("SELECT * FROM pagamentos -- comentario")]
    [InlineData("SELECT * FROM pagamentos /* x */")]
    [InlineData("SELECT * FROM pagamentos UNION SELECT * FROM pedidos")]
    [InlineData("SELECT * FROM pagamentos WHERE 1=1 OR 1=1")]
    [InlineData("SELECT * FROM segredo")]
    [InlineData("SELECT * FROM pagamentos WHERE status='CONFIRMADO';")]
    [InlineData("EXPLAIN ANALYZE SELECT * FROM pagamentos")]
    [InlineData("WITH x AS (SELECT * FROM pagamentos) SELECT * FROM x")]
    [InlineData("SELECT * FROM pagamentos JOIN pedidos ON pagamentos.pedido_id=pedidos.id")]
    [InlineData("SELECT pg_sleep(99) FROM pagamentos")]
    [InlineData("SELECT * FROM pagamentos LIMIT 1000000")]
    [InlineData("SELECT * FROM pagamentos WHERE status = 'CONFIRMADO' OR status='DUPLICADO'")]
    [InlineData("SELECT * FROM pagamentos; SELECT * FROM pedidos")]
    [InlineData("SELECT * FROM pagamentos; -- DROP TABLE pedidos")]
    [InlineData("SELECT * FROM pagamentos WHERE status = @status")]
    [InlineData("SELECT * FROM pagamentos /* ; */ WHERE 1=1")]
    public void Nivel4b_ParserSql_FalhaFechadoEmEntradasAdversariais(string sql)
    {
        var cenario = _catalogo.Obter("diagnostico-sql-readonly", "v2.0", null, 1);
        var inicio = Motor.Iniciar(cenario, 1);
        var res = Motor.Aplicar(inicio.NovoEstado, new Acao("estacao.executar_comando", Dados(new { comando = sql })), cenario);
        Assert.Contains(res.Eventos, e => e.Tipo == "AcaoPrejudicialRegistrada");
        Assert.Contains(res.Eventos, e => e.Tipo == "ComandoNaoSuportado");
        Assert.DoesNotContain(res.Eventos, e => e.Tipo == "ComandoExecutado");
    }

    [Fact]
    public void Nivel4b_TresInvestigacoesProduzemEvidenciasNoReplaySemAlterarEstado()
    {
        var cenario = _catalogo.Obter("diagnostico-sql-readonly", "v2.0", null, 1);
        var estado = Motor.Iniciar(cenario, 1).NovoEstado;
        var consultas = new[]
        {
            "SELECT status, COUNT(*) FROM pagamentos GROUP BY status",
            "SELECT * FROM pagamentos",
            "SELECT * FROM pedidos"
        };
        var evidencias = new List<string>();
        foreach (var sql in consultas)
        {
            var anterior = estado.Estacao;
            var res = Motor.Aplicar(estado, new Acao("estacao.executar_comando", Dados(new { comando = sql })), cenario);
            var ev = Assert.Single(res.Eventos, e => e.Tipo == "ComandoExecutado");
            evidencias.Add(ev.Dados["saida"]!.ToString()!);
            Assert.Equal(anterior, res.NovoEstado.Estacao);
            estado = res.NovoEstado;
        }
        Assert.Contains(evidencias, x => x.Contains("Investigacao 1/3") && x.Contains("PAG-3"));
        Assert.Contains(evidencias, x => x.Contains("Investigacao 2/3") && x.Contains("CONFIRMADO"));
        Assert.Contains(evidencias, x => x.Contains("Investigacao 3/3") && x.Contains("2.450,00"));
    }

    [Fact]
    public void Nivel4b_ArquiteturaNaoExpoeEventStoreOuPersistenciaNoDominio()
    {
        var nomes = typeof(Motor).Assembly.GetTypes().Select(t => t.Name).ToArray();
        Assert.DoesNotContain(nomes, n => n.Contains("EventStore", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(nomes, n => n.Contains("Repository", StringComparison.OrdinalIgnoreCase));
        var referencias = typeof(Motor).Assembly.GetReferencedAssemblies().Select(a => a.Name ?? "").ToArray();
        Assert.DoesNotContain(referencias, n => n.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) || n.Contains("SqlClient", StringComparison.OrdinalIgnoreCase) || n.Contains("EntityFramework", StringComparison.OrdinalIgnoreCase));
        var cenario = _catalogo.Obter("diagnostico-sql-readonly", "v2.0", null, 1);
        var antes = Motor.Iniciar(cenario, 1).NovoEstado;
        var resultado = Motor.Aplicar(antes, new Acao("estacao.executar_comando", Dados(new { comando = "SELECT * FROM pedidos" })), cenario);
        Assert.Equal(antes.Estacao, resultado.NovoEstado.Estacao);
        Assert.DoesNotContain(resultado.Eventos, e => e.Tipo.Contains("Persist", StringComparison.OrdinalIgnoreCase) || e.Tipo.Contains("Write", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Nivel4_SreCloud_PoolExhausted_DiagnosticoEMitigacaoElevada_AprovaJuiz360()
    {
        var cenario = _catalogo.Obter("sre-cloud-latencia", "v2.0", "POOL_EXHAUSTED", 42);
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
        Aplicar("itsm.classificar_chamado", new { chamadoId = "CH-0001", categoria = "Cloud/SRE", urgencia = "Critica", impacto = "Alto" });
        Aplicar("estacao.executar_comando", new { comando = "kubectl get pods" });
        Aplicar("estacao.executar_comando", new { comando = "pg_stat_activity" });
        Assert.Contains(eventos, e => e.Tipo == "ComandoExecutado" && e.Dados["saida"]!.ToString()!.Contains("MAX_CONN"));
        Aplicar("estacao.elevar_privilegio");
        Aplicar("estacao.executar_comando", new { comando = "kubectl rollout restart deployment/pgbouncer" });
        Assert.True(estado.Estacao.CompartilhamentoAcessivel);

        Aplicar("itsm.resolver_chamado", new { chamadoId = "CH-0001", notaPublica = "Pool de conexoes PgBouncer reiniciado e normalizado." });
        var av = Juiz360.Avaliar(estado, eventos);
        Assert.True(av.Concluida);
        Assert.False(av.IncidenteSeguranca);
        Assert.Equal(100, av.XpTotal);
        Assert.All(av.Criterios, c => Assert.True(c.Atendido, $"Criterio {c.Id} falhou"));
    }

    [Fact]
    public void Nivel4_SreCloud_CertExpired_DiagnosticoEMitigacaoElevada_AprovaJuiz360()
    {
        var cenario = _catalogo.Obter("sre-cloud-latencia", "v2.0", "CERT_EXPIRED", 42);
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
        Aplicar("itsm.classificar_chamado", new { chamadoId = "CH-0001", categoria = "Cloud/SRE", urgencia = "Critica", impacto = "Alto" });
        Aplicar("estacao.executar_comando", new { comando = "kubectl get pods" });
        Aplicar("estacao.executar_comando", new { comando = "kubectl describe ingress aurora-ingress" });
        Assert.Contains(eventos, e => e.Tipo == "ComandoExecutado" && e.Dados["saida"]!.ToString()!.Contains("EXPIRED"));
        Aplicar("estacao.elevar_privilegio");
        Aplicar("estacao.executar_comando", new { comando = "kubectl rollout restart deployment/cert-manager" });
        Assert.True(estado.Estacao.CompartilhamentoAcessivel);

        Aplicar("itsm.resolver_chamado", new { chamadoId = "CH-0001", notaPublica = "Certificado TLS renovado via cert-manager." });
        var av = Juiz360.Avaliar(estado, eventos);
        Assert.True(av.Concluida);
        Assert.False(av.IncidenteSeguranca);
        Assert.Equal(100, av.XpTotal);
        Assert.All(av.Criterios, c => Assert.True(c.Atendido, $"Criterio {c.Id} falhou"));
    }

    [Theory]
    [InlineData("OOM_KILLED")]
    [InlineData("POOL_EXHAUSTED")]
    [InlineData("CERT_EXPIRED")]
    public void Nivel4_SreCloud_MitigacaoSemPrivilegioElevado_Bloqueia(string causa)
    {
        var cenario = _catalogo.Obter("sre-cloud-latencia", "v2.0", causa, 42);
        var inicio = Motor.Iniciar(cenario, 42);
        var estado = inicio.NovoEstado;

        var res = Motor.Aplicar(estado, new Acao("estacao.executar_comando", Dados(new { comando = "kubectl set resources deployment/api-pedidos --limits=memory=512Mi" })), cenario);
        Assert.Contains(res.Eventos, e => e.Tipo == "ComandoExecutado" && e.Dados["saida"]!.ToString()!.Contains("Forbidden"));
        Assert.False(res.NovoEstado.Estacao.CompartilhamentoAcessivel);
    }

    [Theory]
    [InlineData("OOM_KILLED")]
    [InlineData("POOL_EXHAUSTED")]
    [InlineData("CERT_EXPIRED")]
    public void Nivel4_SreCloud_ReconstrucaoX12_EquivaleEstadoEHash(string causa)
    {
        var cenario = _catalogo.Obter("sre-cloud-latencia", "v2.0", causa, 42);
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
        Aplicar("itsm.classificar_chamado", new { chamadoId = "CH-0001", categoria = "Cloud/SRE", urgencia = "Critica", impacto = "Alto" });
        Aplicar("estacao.executar_comando", new { comando = "kubectl get pods" });
        Aplicar("estacao.elevar_privilegio");
        Aplicar("estacao.executar_comando", new { comando = causa switch
        {
            "OOM_KILLED" => "kubectl set resources deployment/api-pedidos --limits=memory=512Mi",
            "POOL_EXHAUSTED" => "kubectl rollout restart deployment/pgbouncer",
            _ => "kubectl rollout restart deployment/cert-manager"
        }});
        Aplicar("itsm.resolver_chamado", new { chamadoId = "CH-0001", notaPublica = $"Causa raiz {causa} mitigada." });

        var reconstruido = Projecao.Reconstruir(eventos, _catalogo);
        Assert.Equal(estado.Meta.UltimoSeq, reconstruido.Meta.UltimoSeq);
        Assert.Equal(estado.Meta.MinutoSimulado, reconstruido.Meta.MinutoSimulado);
        Assert.Equal(estado.Estacao.CompartilhamentoAcessivel, reconstruido.Estacao.CompartilhamentoAcessivel);

        var avOriginal = Juiz360.Avaliar(estado, eventos);
        var avReconstruido = Juiz360.Avaliar(reconstruido, eventos);
        Assert.Equal(avOriginal.CurriculoVivo.HashAuditoriaSha256, avReconstruido.CurriculoVivo.HashAuditoriaSha256);
    }

}
