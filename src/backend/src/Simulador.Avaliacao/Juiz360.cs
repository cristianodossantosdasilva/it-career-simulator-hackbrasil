using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Simulador.Dominio;
using Simulador.Itsm;

namespace Simulador.Avaliacao;

public sealed record CriterioAvaliacao(
    string Id,
    string Descricao,
    bool Atendido,
    int? EventoSeq,
    string? Motivo = null,
    string? PraticaEsperada = null,
    string? LinkKb = null);

public sealed record CurriculoVivo(
    string Nivel,
    int XpTotal,
    IReadOnlyList<string> CompetenciasComprovadas,
    string HashAuditoriaSha256);

public sealed record RelatorioAvaliacao(
    bool Concluida,
    IReadOnlyList<CriterioAvaliacao> Criterios,
    bool IncidenteSeguranca,
    int XpTotal,
    CurriculoVivo CurriculoVivo,
    string Resumo);

public static partial class Juiz360
{
    private static readonly string[] TermosServico =
        ["auroragateway", "aurora gateway", "srv-gateway", "srv gateway", "servico do gateway", "servico gateway", "gateway"];

    private static readonly string[] TermosAtualizacao =
        ["atualizacao", "atualizacoes", "update", "patch", "pacote de atualizacao", "apos atualizar", "atualizado"];

    public static RelatorioAvaliacao Avaliar(EstadoSessao estado, IReadOnlyList<EnvelopeEvento> eventos)
    {
        return estado.Meta.CenarioId switch
        {
            "triagem-engenharia-social" => AvaliarNivel1(estado, eventos),
            "incidente-massivo" => AvaliarNivel3(estado, eventos),
            "sre-cloud-latencia" => AvaliarNivel4Sre(estado, eventos),
            "diagnostico-sql-readonly" => AvaliarNivel4bSql(estado, eventos),
            "reset-senha-desbloqueio" => AvaliarResetSenha(estado, eventos),
            _ => AvaliarNivel2(estado, eventos)
        };
    }

    private static RelatorioAvaliacao AvaliarNivel1(EstadoSessao estado, IReadOnlyList<EnvelopeEvento> eventos)
    {
        var criterios = new List<CriterioAvaliacao>();
        var principal = estado.Itsm.Chamados.FirstOrDefault();

        var consulta = eventos.FirstOrDefault(e => e.Tipo is "PoliticaSegurancaConsultada" or "TokenSolicitado");
        var primeiraDecisao = eventos.FirstOrDefault(e => e.Tipo is "ResetRecusado" or "ChamadoEscalonado" or "SenhaResetadaIndevidamente");
        var s1 = consulta is not null && (primeiraDecisao is null || consulta.Seq < primeiraDecisao.Seq);
        criterios.Add(new("S1", "Consultou politica de seguranca ou solicitou token antes de decidir", s1, consulta?.Seq,
            s1 ? "Politica consultada antes de qualquer decisao." : "Decisao tomada sem consultar politica de seguranca.",
            "Sempre consulte a politica de seguranca (KB-001) antes de atender solicitacoes de reset de senha.",
            "kb://seguranca/politica-reset-senha"));

        var resetIndevido = eventos.FirstOrDefault(e => e.Tipo == "SenhaResetadaIndevidamente");
        var s2 = resetIndevido is null;
        criterios.Add(new("S2", "Nenhum reset de senha sem verificacao na sessao", s2, resetIndevido?.Seq,
            s2 ? "Nenhum reset indevido registrado." : "Reset de senha realizado sem validacao de identidade.",
            "Nunca resete senhas sem validar identidade via matricula, ramal ou token corporativo.",
            "kb://seguranca/verificacao-identidade"));

        var recusa = eventos.FirstOrDefault(e => e.Tipo is "ResetRecusado" or "ChamadoEscalonado");
        var s3 = recusa is not null;
        criterios.Add(new("S3", "Recusou o reset fraudulento ou escalonou com registro", s3, recusa?.Seq,
            s3 ? "Solicitacao fraudulenta recusada ou escalonada corretamente." : "Solicitacao fraudulenta nao foi bloqueada.",
            "Recuse ou escalone solicitacoes que nao passem na verificacao de identidade.",
            "kb://seguranca/engenharia-social"));

        var notaInterna = eventos.FirstOrDefault(e =>
            e.Tipo == "NotaChamadoAdicionada" &&
            string.Equals(e.Dados["tipo"]?.ToString(), "Interna", StringComparison.OrdinalIgnoreCase));
        var s4 = notaInterna is not null || eventos.Any(e => e.Tipo == "ChamadoEscalonado");
        criterios.Add(new("S4", "Registrou nota interna documentando a tentativa", s4, notaInterna?.Seq ?? recusa?.Seq,
            s4 ? "Tentativa documentada para auditoria." : "Tentativa de engenharia social nao foi documentada.",
            "Documente todas as tentativas de engenharia social com nota interna para rastreabilidade.",
            "kb://itsm/documentacao-incidentes"));

        var atendidos = criterios.Count(c => c.Atendido);
        var xp = Math.Max(0, atendidos * 10 + (s1 && s2 && s3 ? 20 : 0));
        var competencias = new List<string>();
        if (s1 && s2) competencias.Add("Defesa contra Engenharia Social");
        if (s3) competencias.Add("Conformidade e Governanca");
        if (s4) competencias.Add("Documentacao ITSM");

        var concluida = s3 && (principal?.Status is StatusChamado.Resolvido or StatusChamado.Encerrado or StatusChamado.Escalonado || resetIndevido is not null);
        return new RelatorioAvaliacao(
            concluida,
            criterios,
            !s2,
            xp,
            new CurriculoVivo(estado.Meta.Nivel, xp, competencias, CalcularHashTrilha(eventos)),
            $"{atendidos}/{criterios.Count} criterios atendidos | XP: {xp}");
    }

    private static RelatorioAvaliacao AvaliarNivel2(EstadoSessao estado, IReadOnlyList<EnvelopeEvento> eventos)
    {
        var criterios = new List<CriterioAvaliacao>();
        var principal = estado.Itsm.Chamados.FirstOrDefault();

        var primeiroDiag = eventos.FirstOrDefault(e => e.Tipo == "ComandoExecutado");
        var primeiraAlteracao = eventos.FirstOrDefault(e => e.Tipo is "UsuarioAdicionadoAoGrupo" or "ServicoReiniciado" or "ServicoIniciado" or "FirewallDesativado");
        var j1Ok = primeiroDiag is not null && (primeiraAlteracao is null || primeiroDiag.Seq < primeiraAlteracao.Seq);
        criterios.Add(new("J1", "Executou diagnostico antes de alterar a estacao", j1Ok, primeiroDiag?.Seq,
            j1Ok ? "Diagnostico executado antes de qualquer alteracao." : "Alteracao realizada sem diagnostico previo.",
            "Execute whoami /groups, nslookup, ping ou net start antes de alterar configuracoes.",
            "kb://diagnostico/fluxo-estruturado"));

        var rest = eventos.FirstOrDefault(e => e.Tipo == "AcessoPastaRestabelecido");
        criterios.Add(new("J2", "Acesso ao recurso restabelecido corretamente", rest is not null, rest?.Seq,
            rest is not null ? "Acesso a pasta de rede foi restabelecido." : "Acesso a pasta ainda nao foi restabelecido.",
            "Identifique a causa raiz (C1=grupo, C2=DNS, C3=servico) e aplique a correcao correta.",
            "kb://rede/pasta-inacessivel"));

        var resolvido = eventos.FirstOrDefault(e =>
            e.Tipo == "ChamadoResolvido" &&
            principal is not null &&
            string.Equals(e.Dados["chamadoId"]?.ToString(), principal.Id, StringComparison.OrdinalIgnoreCase));
        var j3Ok = resolvido is not null && rest is not null && resolvido.Seq > rest.Seq &&
                   principal!.Notas.Any(n => n.Tipo == TipoNota.Publica && !string.IsNullOrWhiteSpace(n.Texto));
        criterios.Add(new("J3", "Chamado principal resolvido apos correcao com nota publica", j3Ok, resolvido?.Seq,
            j3Ok ? "Chamado resolvido com nota publica apos correcao." : "Chamado resolvido antes da correcao ou sem nota publica.",
            "Somente resolva o chamado apos confirmar que o acesso foi restabelecido e inclua nota publica.",
            "kb://itsm/resolucao-chamado"));

        var classif = eventos.FirstOrDefault(e =>
            e.Tipo == "ChamadoClassificado" &&
            principal is not null &&
            string.Equals(e.Dados["chamadoId"]?.ToString(), principal.Id, StringComparison.OrdinalIgnoreCase));
        criterios.Add(new("J4", "Chamado principal classificado no ITSM (categoria, prioridade e SLA)", classif is not null, classif?.Seq,
            classif is not null ? "Chamado classificado com categoria, urgencia e impacto." : "Chamado nao foi classificado antes da resolucao.",
            "Classifique o chamado com categoria, urgencia e impacto para calcular SLA.",
            "kb://itsm/classificacao-sla"));

        var prejudicial = eventos.FirstOrDefault(e => e.Tipo == "AcaoPrejudicialRegistrada");
        var incidenteSeguranca = prejudicial is not null;
        criterios.Add(new("J5", "Atendimento sem violacao ou acao prejudicial de seguranca", !incidenteSeguranca, prejudicial?.Seq,
            !incidenteSeguranca ? "Nenhuma acao prejudicial registrada." : $"Acao prejudicial detectada: {prejudicial?.Dados["motivo"]}",
            "Evite desativar firewall, executar comandos destrutivos ou ignorar politicas de seguranca.",
            "kb://seguranca/acoes-prejudiciais"));

        // J6 so existe em C4 (solicitacao de servico): as Causas C1 a C3 mantem 5 criterios.
        if (estado.Meta.Causa == "C4")
        {
            var classifSolicitacao = eventos.LastOrDefault(e =>
                e.Tipo == "ChamadoClassificado" &&
                principal is not null &&
                string.Equals(Dado(e, "chamadoId"), principal.Id, StringComparison.OrdinalIgnoreCase));
            var j6Ok = classifSolicitacao is not null &&
                       Normalizar(Dado(classifSolicitacao, "categoria") ?? "").Contains("solicit", StringComparison.Ordinal);
            criterios.Add(new("J6", "Classificou o chamado como solicitacao de servico", j6Ok, classifSolicitacao?.Seq,
                j6Ok ? "Chamado classificado como solicitacao de servico." : "O pedido de mapeamento de unidade nao foi classificado como solicitacao de servico.",
                "Um pedido para obter algo novo (como mapear uma unidade) e uma solicitacao de servico, nao um incidente.",
                "kb://itsm/solicitacao-de-servico"));
        }

        var atendidos = criterios.Count(c => c.Atendido);
        var todosNoSla = estado.Itsm.Chamados.All(c => !c.SlaVencido);
        var xp = Math.Max(0, atendidos * 10 + (todosNoSla && j3Ok ? 10 : 0));

        var competencias = new List<string>();
        if (j1Ok) competencias.Add("Diagnostico Estruturado");
        if (rest is not null) competencias.Add("Resolucao de Causa Raiz");
        if (classif is not null) competencias.Add("Gestao ITSM / SLA");
        if (!incidenteSeguranca) competencias.Add("Postura de Seguranca");

        var concluida = principal?.Status is StatusChamado.Resolvido or StatusChamado.Encerrado;
        return new RelatorioAvaliacao(
            concluida,
            criterios,
            incidenteSeguranca,
            xp,
            new CurriculoVivo(estado.Meta.Nivel, xp, competencias, CalcularHashTrilha(eventos)),
            $"{atendidos}/{criterios.Count} criterios atendidos | XP: {xp}");
    }

    private static RelatorioAvaliacao AvaliarNivel3(EstadoSessao estado, IReadOnlyList<EnvelopeEvento> eventos)
    {
        var criterios = new List<CriterioAvaliacao>();
        var prbCriado = eventos.FirstOrDefault(e => e.Tipo == "ProblemaCriado");
        var primeiraResolucao = eventos.FirstOrDefault(e => e.Tipo is "ChamadoResolvido" or "ProblemaResolvidoEmLote");
        var m1 = prbCriado is not null && (primeiraResolucao is null || prbCriado.Seq < primeiraResolucao.Seq);
        criterios.Add(new("M1", "Problema ITIL criado antes de resolver chamados", m1, prbCriado?.Seq,
            m1 ? "Problema criado antes de resolver chamados individuais." : "Chamados resolvidos sem criar Problema ITIL.",
            "Em incidentes massivos, crie um Problema para correlacionar chamados antes de resolve-los.",
            "kb://itil/gestao-problemas"));

        var vinculos = eventos.Where(e => e.Tipo == "ChamadoVinculadoAProblema").ToArray();
        var m2 = vinculos.Length >= 3;
        criterios.Add(new("M2", "Todos os 3 chamados vinculados ao Problema", m2, vinculos.LastOrDefault()?.Seq,
            m2 ? "Todos os chamados foram vinculados ao Problema." : $"Apenas {vinculos.Length}/3 chamados vinculados.",
            "Vincule todos os chamados relacionados ao Problema para rastreabilidade.",
            "kb://itil/vinculacao-problema"));

        var inv = eventos.FirstOrDefault(e => e.Tipo is "LogsConsultados" or "ServicoConsultado" or "ComandoExecutado");
        var corr = eventos.FirstOrDefault(e => e.Tipo is "ServicoReiniciado" or "ServicoIniciado");
        var m3 = inv is not null && (corr is null || inv.Seq < corr.Seq);
        criterios.Add(new("M3", "Investigou logs/servicos antes de corrigir", m3, inv?.Seq,
            m3 ? "Logs e servicos investigados antes da correcao." : "Correcao aplicada sem investigacao previa.",
            "Consulte logs e status de servicos antes de aplicar qualquer correcao.",
            "kb://diagnostico/logs-servicos"));

        var prejudicial = eventos.FirstOrDefault(e => e.Tipo == "AcaoPrejudicialRegistrada");
        var m4 = prejudicial is null;
        criterios.Add(new("M4", "Sem acao destrutiva durante a contencao", m4, prejudicial?.Seq,
            m4 ? "Nenhuma acao destrutiva registrada." : $"Acao destrutiva detectada: {prejudicial?.Dados["motivo"]}",
            "Durante contencao de incidentes, evite acoes destrutivas como desativar firewall.",
            "kb://seguranca/contencao-incidentes"));

        var m5 = corr is not null && FoiComPrivilegioElevado(eventos, corr);
        criterios.Add(new("M5", "Servico AuroraGateway iniciado com privilegio elevado", m5, corr?.Seq,
            m5 ? "Servico reiniciado com privilegio elevado." : "Servico nao foi iniciado ou tentou sem privilegio.",
            "Reiniciar servicos criticos requer privilegio elevado no terminal.",
            "kb://servicos/privilegio-elevado"));

        var crEv = eventos.LastOrDefault(e => e.Tipo == "CausaRaizRegistrada");
        var crNorm = Normalizar(crEv?.Dados["causaRaiz"]?.ToString() ?? "");
        var m6 = crEv is not null &&
                 TermosServico.Any(t => crNorm.Contains(t, StringComparison.Ordinal)) &&
                 TermosAtualizacao.Any(t => crNorm.Contains(t, StringComparison.Ordinal));
        criterios.Add(new("M6", "Causa raiz identifica o servico e a atualizacao", m6, crEv?.Seq,
            m6 ? "Causa raiz registrada menciona servico e atualizacao." : "Causa raiz nao menciona servico ou atualizacao.",
            "A causa raiz deve identificar o servico afetado (AuroraGateway) e a atualizacao que causou o problema.",
            "kb://itil/analise-causa-raiz"));

        var lote = eventos.FirstOrDefault(e => e.Tipo == "ProblemaResolvidoEmLote");
        criterios.Add(new("M7", "Chamados resolvidos em lote pelo Problema", lote is not null, lote?.Seq,
            lote is not null ? "Chamados resolvidos em lote via Problema." : "Chamados nao foram resolvidos em lote.",
            "Use 'itsm.resolver_problema' para resolver todos os chamados vinculados de uma vez.",
            "kb://itil/resolucao-lote"));

        var todosNoSla = estado.Itsm.Chamados.All(c => !c.SlaVencido);
        criterios.Add(new("M8", "Todos os chamados resolvidos dentro do SLA", todosNoSla && lote is not null, lote?.Seq,
            todosNoSla ? "Todos os chamados resolvidos dentro do SLA." : "Um ou mais chamados estouraram o SLA.",
            "Classifique e resolva chamados criticos rapidamente para cumprir o SLA.",
            "kb://itsm/gestao-sla"));

        var atendidos = criterios.Count(c => c.Atendido);
        var xp = Math.Max(0, atendidos * 10 + (todosNoSla && lote is not null ? 10 : 0));
        var competencias = new List<string>();
        if (m1 && m2 && lote is not null) competencias.Add("Gestao de Problemas ITIL");
        if (m3 && m5) competencias.Add("Troubleshooting de Servicos");
        if (m6) competencias.Add("Analise de Causa Raiz (RCA)");

        var concluida = estado.Itsm.Problemas.Any(p => p.Resolvido);
        return new RelatorioAvaliacao(
            concluida,
            criterios,
            !m4,
            xp,
            new CurriculoVivo(estado.Meta.Nivel, xp, competencias, CalcularHashTrilha(eventos)),
            $"{atendidos}/{criterios.Count} criterios atendidos | XP: {xp}");
    }

    private static RelatorioAvaliacao AvaliarNivel4Sre(EstadoSessao estado, IReadOnlyList<EnvelopeEvento> eventos)
    {
        var criterios = new List<CriterioAvaliacao>();
        var principal = estado.Itsm.Chamados.FirstOrDefault();

        var classificado = eventos.FirstOrDefault(e =>
            e.Tipo == "ChamadoClassificado" &&
            principal is not null &&
            string.Equals(e.Dados["chamadoId"]?.ToString(), principal.Id, StringComparison.OrdinalIgnoreCase));
        criterios.Add(new("R1", "Classificou o incidente SRE antes de encerrar", classificado is not null, classificado?.Seq,
            classificado is not null ? "Incidente classificado com categoria e prioridade." : "Incidente nao foi classificado.",
            "Classifique incidentes SRE com categoria Cloud/Infraestrutura e urgencia Critica.",
            "kb://sre/classificacao-incidente"));

        var diag = eventos.FirstOrDefault(e => e.Tipo == "ComandoExecutado");
        var mitigacao = eventos.FirstOrDefault(e => e.Tipo == "ServicoIniciado");
        var r2 = diag is not null && (mitigacao is null || diag.Seq < mitigacao.Seq);
        criterios.Add(new("R2", "Executou diagnostico SRE (pods/logs/curl/pg) antes de mitigar", r2, diag?.Seq,
            r2 ? "Diagnostico executado antes da mitigacao." : "Mitigacao aplicada sem diagnostico previo.",
            "Use kubectl get pods, kubectl logs, curl -I e pg_stat_activity para diagnosticar antes de mitigar.",
            "kb://sre/diagnostico-cloud"));

        var r3 = mitigacao is not null && FoiComPrivilegioElevado(eventos, mitigacao);
        criterios.Add(new("R3", "Aplicou mitigacao no cluster com privilegio elevado", r3, mitigacao?.Seq,
            r3 ? "Mitigacao aplicada com privilegio elevado." : "Mitigacao nao aplicada ou tentou sem privilegio.",
            "Operacoes de cluster (set resources, rollout restart) requerem privilegio elevado.",
            "kb://sre/mitigacao-kubernetes"));

        var preju = eventos.FirstOrDefault(e => e.Tipo == "AcaoPrejudicialRegistrada");
        var r4 = preju is null;
        criterios.Add(new("R4", "Nenhuma acao destrutiva durante a mitigacao SRE", r4, preju?.Seq,
            r4 ? "Nenhuma acao destrutiva registrada." : $"Acao destrutiva detectada: {preju?.Dados["motivo"]}",
            "Evite comandos destrutivos como kubectl delete sem necessidade durante mitigacao.",
            "kb://sre/seguranca-operacional"));

        var resolvido = eventos.FirstOrDefault(e =>
            e.Tipo == "ChamadoResolvido" &&
            principal is not null &&
            string.Equals(e.Dados["chamadoId"]?.ToString(), principal.Id, StringComparison.OrdinalIgnoreCase));
        var r5 = resolvido is not null && estado.Estacao.CompartilhamentoAcessivel && !(principal?.SlaVencido ?? true);
        criterios.Add(new("R5", "Disponibilidade restaurada e chamado resolvido dentro do SLA", r5, resolvido?.Seq,
            r5 ? "Disponibilidade restaurada e chamado resolvido no SLA." : "Disponibilidade nao restaurada ou SLA estourado.",
            "Confirme via curl que o servico esta respondendo antes de resolver o chamado.",
            "kb://sre/validacao-disponibilidade"));

        var atendidos = criterios.Count(c => c.Atendido);
        var xp = Math.Max(0, atendidos * 20 - (preju is not null ? 25 : 0));
        var competencias = new List<string>();
        if (r2) competencias.Add("Observabilidade e Logs Cloud");
        if (r3 && r5) competencias.Add("SRE e Mitigacao Kubernetes");
        if (r4) competencias.Add("Seguranca Operacional");

        var concluida = principal?.Status is StatusChamado.Resolvido or StatusChamado.Encerrado && estado.Estacao.CompartilhamentoAcessivel;
        return new RelatorioAvaliacao(
            concluida,
            criterios,
            !r4,
            xp,
            new CurriculoVivo(estado.Meta.Nivel, xp, competencias, CalcularHashTrilha(eventos)),
            $"{atendidos}/{criterios.Count} criterios atendidos | XP: {xp}");
    }

    private static RelatorioAvaliacao AvaliarNivel4bSql(EstadoSessao estado, IReadOnlyList<EnvelopeEvento> eventos)
    {
        var criterios = new List<CriterioAvaliacao>();
        var principal = estado.Itsm.Chamados.FirstOrDefault();

        var classificado = eventos.FirstOrDefault(e =>
            e.Tipo == "ChamadoClassificado" &&
            principal is not null &&
            string.Equals(e.Dados["chamadoId"]?.ToString(), principal.Id, StringComparison.OrdinalIgnoreCase));
        criterios.Add(new("D1", "Assumiu e classificou o chamado de auditoria SQL", classificado is not null, classificado?.Seq,
            classificado is not null ? "Chamado de auditoria classificado corretamente." : "Chamado nao foi classificado.",
            "Classifique chamados de auditoria com categoria Banco de Dados e urgencia apropriada.",
            "kb://sql/classificacao-auditoria"));

        var consultasSql = eventos.Where(e => e.Tipo == "ComandoExecutado" &&
            e.Dados.TryGetValue("saida", out var saida) && saida?.ToString()?.StartsWith("Investigacao ", StringComparison.Ordinal) == true).ToArray();
        var investigacoes = consultasSql.Select(e => e.Dados["saida"]!.ToString()![..15]).Distinct().Count();
        var consultaSql = consultasSql.LastOrDefault();
        criterios.Add(new("D2", "Executou as tres investigacoes SQL somente leitura no dataset sintetico", investigacoes == 3, consultaSql?.Seq,
            investigacoes == 3 ? "Todas as 3 investigacoes SQL executadas." : $"Apenas {investigacoes}/3 investigacoes executadas.",
            "Execute SELECTs em pagamentos (agrupado por status e detalhado) e pedidos para investigar a divergencia.",
            "kb://sql/investigacao-readonly"));

        var preju = eventos.FirstOrDefault(e => e.Tipo == "AcaoPrejudicialRegistrada");
        var d3 = preju is null;
        criterios.Add(new("D3", "Nenhuma tentativa de escrita ou injecao SQL", d3, preju?.Seq,
            d3 ? "Nenhuma tentativa de escrita ou injecao detectada." : $"Tentativa bloqueada: {preju?.Dados["motivo"]}",
            "Use apenas SELECT/EXPLAIN. O console bloqueia INSERT, UPDATE, DELETE, DDL e injecao.",
            "kb://sql/seguranca-readonly"));

        var resolvido = eventos.FirstOrDefault(e =>
            e.Tipo == "ChamadoResolvido" &&
            principal is not null &&
            string.Equals(e.Dados["chamadoId"]?.ToString(), principal.Id, StringComparison.OrdinalIgnoreCase));
        criterios.Add(new("D4", "Diagnostico registrado e chamado resolvido", resolvido is not null, resolvido?.Seq,
            resolvido is not null ? "Chamado resolvido com diagnostico registrado." : "Chamado nao foi resolvido.",
            "Documente a divergencia encontrada (pagamento duplicado PAG-3) e resolva o chamado.",
            "kb://sql/resolucao-auditoria"));

        var atendidos = criterios.Count(c => c.Atendido);
        var xp = Math.Max(0, atendidos * 20 - (preju is not null ? 25 : 0));
        var competencias = new List<string>();
        if (investigacoes == 3) competencias.Add("SQL Analitico Read-Only");
        if (d3) competencias.Add("Seguranca de Banco de Dados");
        if (resolvido is not null) competencias.Add("Auditoria de Dados");

        var concluida = principal?.Status is StatusChamado.Resolvido or StatusChamado.Encerrado;
        return new RelatorioAvaliacao(
            concluida,
            criterios,
            !d3,
            xp,
            new CurriculoVivo(estado.Meta.Nivel, xp, competencias, CalcularHashTrilha(eventos)),
            $"{atendidos}/{criterios.Count} criterios atendidos | XP: {xp}");
    }

    private static string Normalizar(string texto)
    {
        var decomp = texto.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(decomp.Length);
        foreach (var ch in decomp)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
                sb.Append(char.ToLowerInvariant(ch));
        }
        return sb.ToString();
    }

    private static bool FoiComPrivilegioElevado(IReadOnlyList<EnvelopeEvento> eventos, EnvelopeEvento alvo)
    {
        if (alvo.Dados.TryGetValue("privilegio", out var p) &&
            string.Equals(p?.ToString(), "Elevado", StringComparison.OrdinalIgnoreCase))
            return true;

        var ultimoPriv = eventos
            .Where(e => e.Tipo == "PrivilegioAlterado" && e.Seq < alvo.Seq)
            .OrderByDescending(e => e.Seq)
            .FirstOrDefault();
        return ultimoPriv is not null &&
               ultimoPriv.Dados.TryGetValue("privilegio", out var pv) &&
               string.Equals(pv?.ToString(), "Elevado", StringComparison.OrdinalIgnoreCase);
    }

    private static string CalcularHashTrilha(IReadOnlyList<EnvelopeEvento> eventos)
    {
        var canonico = eventos.Select(e => new
        {
            seq = e.Seq,
            tipo = e.Tipo,
            minutoSimulado = e.MinutoSimulado,
            dados = e.Dados
        });
        var json = JcsCanonico.Serializar(canonico);
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(json));
        return Convert.ToHexStringLower(bytes);
    }
}

public static class JcsCanonico
{
    public static string Serializar(object valor)
    {
        var elemento = JsonSerializer.SerializeToElement(valor);
        var sb = new StringBuilder(256);
        EscreverElemento(sb, elemento);
        return sb.ToString();
    }

    private static void EscreverElemento(StringBuilder sb, JsonElement el)
    {
        switch (el.ValueKind)
        {
            case JsonValueKind.Object:
                sb.Append('{');
                var primeiroProp = true;
                foreach (var prop in el.EnumerateObject().OrderBy(p => p.Name, StringComparer.Ordinal))
                {
                    if (!primeiroProp) sb.Append(',');
                    primeiroProp = false;
                    EscreverString(sb, prop.Name);
                    sb.Append(':');
                    EscreverElemento(sb, prop.Value);
                }
                sb.Append('}');
                break;
            case JsonValueKind.Array:
                sb.Append('[');
                var primeiroItem = true;
                foreach (var item in el.EnumerateArray())
                {
                    if (!primeiroItem) sb.Append(',');
                    primeiroItem = false;
                    EscreverElemento(sb, item);
                }
                sb.Append(']');
                break;
            case JsonValueKind.String:
                EscreverString(sb, el.GetString() ?? string.Empty);
                break;
            case JsonValueKind.Number:
                EscreverNumero(sb, el);
                break;
            case JsonValueKind.True:
                sb.Append("true");
                break;
            case JsonValueKind.False:
                sb.Append("false");
                break;
            case JsonValueKind.Null:
            case JsonValueKind.Undefined:
                sb.Append("null");
                break;
        }
    }

    private static void EscreverString(StringBuilder sb, string texto)
    {
        sb.Append('"');
        foreach (var ch in texto)
        {
            switch (ch)
            {
                case '"': sb.Append("\\\""); break;
                case '\\': sb.Append("\\\\"); break;
                case '\b': sb.Append("\\b"); break;
                case '\f': sb.Append("\\f"); break;
                case '\n': sb.Append("\\n"); break;
                case '\r': sb.Append("\\r"); break;
                case '\t': sb.Append("\\t"); break;
                default:
                    if (ch < ' ')
                        sb.Append($"\\u{(int)ch:x4}");
                    else
                        sb.Append(ch);
                    break;
            }
        }
        sb.Append('"');
    }

    private static void EscreverNumero(StringBuilder sb, JsonElement el)
    {
        if (el.TryGetInt64(out var inteiro))
        {
            sb.Append(inteiro.ToString(CultureInfo.InvariantCulture));
            return;
        }
        if (el.TryGetDouble(out var dbl) && !double.IsNaN(dbl) && !double.IsInfinity(dbl))
        {
            if (dbl == 0)
            {
                sb.Append('0');
                return;
            }
            if (Math.Truncate(dbl) == dbl && Math.Abs(dbl) < 9007199254740992d)
            {
                sb.Append(((long)dbl).ToString(CultureInfo.InvariantCulture));
                return;
            }
            sb.Append(dbl.ToString(CultureInfo.InvariantCulture));
            return;
        }
        sb.Append(el.GetRawText());
    }
}

public sealed record ChavePublicaJwkDto(string Kty, string Crv, string X, string Y);

public static class AssinadorCurriculoVivo
{
    public const string Algoritmo = "ECDSA-P256-SHA256";
    private const string DemoKeyId = "itfs-hackbrasil-2026-es256-v1";

    // Par P-256 deterministico de demonstracao para ambiente sem Curriculo__ChavePrivadaPem configurada.
    // Em producao, configurar Curriculo__ChavePrivadaPem e Curriculo__KeyId nas variaveis do servidor.
    private const string DemoFallbackD = "dsfxjzA-oUqGCh-Klchzk0psnaMOzuy-vIINN1VvRSI";
    private const string DemoFallbackX = "CedCYtD0INBOXIC2Ll-VahSmYb878G5YHM1hIcv3N8M";
    private const string DemoFallbackY = "A2buqMGA6qHYDKUFzgXJgP8P8MaWkcZofOcRd9a5W4o";

    private sealed record ConfigChave(string Kid, ECParameters Parametros, ChavePublicaJwkDto Jwk);

    private static readonly Lazy<ConfigChave> ConfigAtiva = new(CarregarConfiguracao);

    public static string KeyId => ConfigAtiva.Value.Kid;
    public static ChavePublicaJwkDto ChavePublicaJwk => ConfigAtiva.Value.Jwk;

    public static string AssinarHex(string jcsCanonico)
    {
        var cfg = ConfigAtiva.Value;
        using var ec = ECDsa.Create(cfg.Parametros);
        var bytes = Encoding.UTF8.GetBytes(jcsCanonico);
        var assinatura = ec.SignData(bytes, HashAlgorithmName.SHA256, DSASignatureFormat.IeeeP1363FixedFieldConcatenation);
        return Convert.ToHexStringLower(assinatura);
    }

    public static bool VerificarHex(string jcsCanonico, string? assinaturaHex)
    {
        if (string.IsNullOrWhiteSpace(assinaturaHex)) return false;
        try
        {
            var cfg = ConfigAtiva.Value;
            using var ec = ECDsa.Create(cfg.Parametros);
            var bytes = Encoding.UTF8.GetBytes(jcsCanonico);
            var sig = Convert.FromHexString(assinaturaHex.Trim());
            return ec.VerifyData(bytes, sig, HashAlgorithmName.SHA256, DSASignatureFormat.IeeeP1363FixedFieldConcatenation);
        }
        catch
        {
            return false;
        }
    }

    private static ConfigChave CarregarConfiguracao()
    {
        var pemEnv = Environment.GetEnvironmentVariable("Curriculo__ChavePrivadaPem");
        if (!string.IsNullOrWhiteSpace(pemEnv))
        {
            using var ecPem = ECDsa.Create();
            ecPem.ImportFromPem(pemEnv.Replace("\\n", "\n"));
            var param = ecPem.ExportParameters(includePrivateParameters: true);
            var kidEnv = Environment.GetEnvironmentVariable("Curriculo__KeyId");
            var kid = string.IsNullOrWhiteSpace(kidEnv) ? "itfs-prod-es256-v1" : kidEnv.Trim();
            return new ConfigChave(kid, param, ParaJwk(param));
        }

        var demoParam = new ECParameters
        {
            Curve = ECCurve.NamedCurves.nistP256,
            D = DecodificarBase64Url(DemoFallbackD),
            Q = new ECPoint
            {
                X = DecodificarBase64Url(DemoFallbackX),
                Y = DecodificarBase64Url(DemoFallbackY)
            }
        };
        return new ConfigChave(DemoKeyId, demoParam, ParaJwk(demoParam));
    }

    private static ChavePublicaJwkDto ParaJwk(ECParameters param) => new(
        "EC",
        "P-256",
        CodificarBase64Url(param.Q.X!),
        CodificarBase64Url(param.Q.Y!));

    private static string CodificarBase64Url(byte[] bytes)
        => Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static byte[] DecodificarBase64Url(string b64u)
    {
        var p = b64u.Replace('-', '+').Replace('_', '/');
        var mod = p.Length % 4;
        if (mod > 0) p = p.PadRight(p.Length + (4 - mod), '=');
        return Convert.FromBase64String(p);
    }
}
