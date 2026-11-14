using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Simulador.Dominio;
using Simulador.Itsm;

namespace Simulador.Avaliacao;

public sealed record CriterioAvaliacao(string Id, string Descricao, bool Atendido, int? EventoSeq);

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

public static class Juiz360
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
        criterios.Add(new("S1", "Consultou politica de seguranca ou solicitou token antes de decidir", s1, consulta?.Seq));

        var resetIndevido = eventos.FirstOrDefault(e => e.Tipo == "SenhaResetadaIndevidamente");
        var s2 = resetIndevido is null;
        criterios.Add(new("S2", "Nenhum reset de senha sem verificacao na sessao", s2, resetIndevido?.Seq));

        var recusa = eventos.FirstOrDefault(e => e.Tipo is "ResetRecusado" or "ChamadoEscalonado");
        var s3 = recusa is not null;
        criterios.Add(new("S3", "Recusou o reset fraudulento ou escalonou com registro", s3, recusa?.Seq));

        var notaInterna = eventos.FirstOrDefault(e =>
            e.Tipo == "NotaChamadoAdicionada" &&
            string.Equals(e.Dados["tipo"]?.ToString(), "Interna", StringComparison.OrdinalIgnoreCase));
        var s4 = notaInterna is not null || eventos.Any(e => e.Tipo == "ChamadoEscalonado");
        criterios.Add(new("S4", "Registrou nota interna documentando a tentativa", s4, notaInterna?.Seq ?? recusa?.Seq));

        var atendidos = criterios.Count(c => c.Atendido);
        var xp = Math.Max(0, atendidos * 10 + (s1 && s2 && s3 ? 20 : 0));
        var competencias = new List<string>();
        if (s1 && s2) competencias.Add("Defesa contra Engenharia Social");
        if (s3) competencias.Add("Conformidade & Governanca");
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
        criterios.Add(new("J1", "Executou diagnostico antes de alterar a estacao", j1Ok, primeiroDiag?.Seq));

        var rest = eventos.FirstOrDefault(e => e.Tipo == "AcessoPastaRestabelecido");
        criterios.Add(new("J2", "Acesso ao recurso restabelecido corretamente", rest is not null, rest?.Seq));

        var resolvido = eventos.FirstOrDefault(e =>
            e.Tipo == "ChamadoResolvido" &&
            principal is not null &&
            string.Equals(e.Dados["chamadoId"]?.ToString(), principal.Id, StringComparison.OrdinalIgnoreCase));
        var j3Ok = resolvido is not null && rest is not null && resolvido.Seq > rest.Seq &&
                   principal!.Notas.Any(n => n.Tipo == TipoNota.Publica && !string.IsNullOrWhiteSpace(n.Texto));
        criterios.Add(new("J3", "Chamado principal resolvido apos correcao com nota publica", j3Ok, resolvido?.Seq));

        var classif = eventos.FirstOrDefault(e =>
            e.Tipo == "ChamadoClassificado" &&
            principal is not null &&
            string.Equals(e.Dados["chamadoId"]?.ToString(), principal.Id, StringComparison.OrdinalIgnoreCase));
        criterios.Add(new("J4", "Chamado principal classificado no ITSM (categoria, prioridade e SLA)", classif is not null, classif?.Seq));

        var prejudicial = eventos.FirstOrDefault(e => e.Tipo == "AcaoPrejudicialRegistrada");
        var incidenteSeguranca = prejudicial is not null;
        criterios.Add(new("J5", "Atendimento sem violacao ou acao prejudicial de seguranca", !incidenteSeguranca, prejudicial?.Seq));

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
        criterios.Add(new("M1", "Problema ITIL criado antes de resolver chamados", m1, prbCriado?.Seq));

        var vinculos = eventos.Where(e => e.Tipo == "ChamadoVinculadoAProblema").ToArray();
        var m2 = vinculos.Length >= 3;
        criterios.Add(new("M2", "Todos os 3 chamados vinculados ao Problema", m2, vinculos.LastOrDefault()?.Seq));

        var inv = eventos.FirstOrDefault(e => e.Tipo is "LogsConsultados" or "ServicoConsultado" or "ComandoExecutado");
        var corr = eventos.FirstOrDefault(e => e.Tipo is "ServicoReiniciado" or "ServicoIniciado");
        var m3 = inv is not null && (corr is null || inv.Seq < corr.Seq);
        criterios.Add(new("M3", "Investigou logs/servicos antes de corrigir", m3, inv?.Seq));

        var prejudicial = eventos.FirstOrDefault(e => e.Tipo == "AcaoPrejudicialRegistrada");
        var m4 = prejudicial is null;
        criterios.Add(new("M4", "Sem acao destrutiva durante a contencao", m4, prejudicial?.Seq));

        var m5 = corr is not null && FoiComPrivilegioElevado(eventos, corr);
        criterios.Add(new("M5", "Servico AuroraGateway iniciado com privilegio elevado", m5, corr?.Seq));

        var crEv = eventos.LastOrDefault(e => e.Tipo == "CausaRaizRegistrada");
        var crNorm = Normalizar(crEv?.Dados["causaRaiz"]?.ToString() ?? "");
        var m6 = crEv is not null &&
                 TermosServico.Any(t => crNorm.Contains(t, StringComparison.Ordinal)) &&
                 TermosAtualizacao.Any(t => crNorm.Contains(t, StringComparison.Ordinal));
        criterios.Add(new("M6", "Causa raiz identifica o servico e a atualizacao", m6, crEv?.Seq));

        var lote = eventos.FirstOrDefault(e => e.Tipo == "ProblemaResolvidoEmLote");
        criterios.Add(new("M7", "Chamados resolvidos em lote pelo Problema", lote is not null, lote?.Seq));

        var todosNoSla = estado.Itsm.Chamados.All(c => !c.SlaVencido);
        criterios.Add(new("M8", "Todos os chamados resolvidos dentro do SLA", todosNoSla && lote is not null, lote?.Seq));

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
        using var ms = new MemoryStream();
        using (var writer = new Utf8JsonWriter(ms, new JsonWriterOptions { Indented = false }))
        {
            EscreverElemento(writer, elemento);
        }
        return Encoding.UTF8.GetString(ms.ToArray());
    }

    private static void EscreverElemento(Utf8JsonWriter writer, JsonElement el)
    {
        switch (el.ValueKind)
        {
            case JsonValueKind.Object:
                writer.WriteStartObject();
                foreach (var prop in el.EnumerateObject().OrderBy(p => p.Name, StringComparer.Ordinal))
                {
                    writer.WritePropertyName(prop.Name);
                    EscreverElemento(writer, prop.Value);
                }
                writer.WriteEndObject();
                break;
            case JsonValueKind.Array:
                writer.WriteStartArray();
                foreach (var item in el.EnumerateArray())
                    EscreverElemento(writer, item);
                writer.WriteEndArray();
                break;
            default:
                el.WriteTo(writer);
                break;
        }
    }
}
