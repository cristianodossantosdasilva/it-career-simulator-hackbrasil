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
    public static RelatorioAvaliacao Avaliar(EstadoSessao estado, IReadOnlyList<EnvelopeEvento> eventos)
    {
        var criterios = new List<CriterioAvaliacao>();
        var principal = estado.Itsm.Chamados.FirstOrDefault();

        // J1: ComandoExecutado do sinal discriminante antes da primeira alteracao da estacao
        var primeiroDiag = eventos.FirstOrDefault(e => e.Tipo == "ComandoExecutado");
        var primeiraAlteracao = eventos.FirstOrDefault(e => e.Tipo is "UsuarioAdicionadoAoGrupo" or "ServicoReiniciado" or "FirewallDesativado");
        var j1Ok = primeiroDiag is not null && (primeiraAlteracao is null || primeiroDiag.Seq < primeiraAlteracao.Seq);
        criterios.Add(new("J1", "Executou diagnostico antes de alterar a estacao", j1Ok, primeiroDiag?.Seq));

        // J2: AcessoPastaRestabelecido derivado da correcao
        var rest = eventos.FirstOrDefault(e => e.Tipo == "AcessoPastaRestabelecido");
        criterios.Add(new("J2", "Acesso ao recurso restabelecido corretamente", rest is not null, rest?.Seq));

        // J3: Chamado principal resolvido depois de J2, com nota publica
        var resolvido = eventos.FirstOrDefault(e =>
            e.Tipo == "ChamadoResolvido" &&
            principal is not null &&
            string.Equals(e.Dados["chamadoId"]?.ToString(), principal.Id, StringComparison.OrdinalIgnoreCase));
        var j3Ok = resolvido is not null && rest is not null && resolvido.Seq > rest.Seq &&
                   principal!.Notas.Any(n => n.Tipo == TipoNota.Publica && !string.IsNullOrWhiteSpace(n.Texto));
        criterios.Add(new("J3", "Chamado principal resolvido apos correcao com nota publica", j3Ok, resolvido?.Seq));

        // J4: Classificacao preenchida no chamado principal (categoria e prioridade)
        var classif = eventos.FirstOrDefault(e =>
            e.Tipo == "ChamadoClassificado" &&
            principal is not null &&
            string.Equals(e.Dados["chamadoId"]?.ToString(), principal.Id, StringComparison.OrdinalIgnoreCase));
        criterios.Add(new("J4", "Chamado principal classificado no ITSM (categoria, prioridade e SLA)", classif is not null, classif?.Seq));

        // J5: Nenhuma acao prejudicial de seguranca (negativo: null se atendido, primeira violacao se nao)
        var prejudicial = eventos.FirstOrDefault(e => e.Tipo == "AcaoPrejudicialRegistrada");
        var incidenteSeguranca = prejudicial is not null;
        criterios.Add(new("J5", "Atendimento sem violacao ou acao prejudicial de seguranca", !incidenteSeguranca, prejudicial?.Seq));

        var atendidos = criterios.Count(c => c.Atendido);
        var todosNoSla = estado.Itsm.Chamados.All(c => !c.SlaVencido);
        var xp = Math.Max(0, atendidos * 10 + (todosNoSla && j3Ok ? 10 : 0) + (estado.Meta.Nivel == "Estagiario" && !incidenteSeguranca ? 20 : 0));

        var competencias = new List<string>();
        if (j1Ok) competencias.Add("Diagnostico Estruturado");
        if (j2Ok(rest)) competencias.Add("Resolucao de Causa Raiz");
        if (j4Ok(classif)) competencias.Add("Gestao ITSM / SLA");
        if (!incidenteSeguranca) competencias.Add("Postura de Seguranca");

        var hash = CalcularHashTrilha(eventos);
        var curriculo = new CurriculoVivo(estado.Meta.Nivel, xp, competencias, hash);
        var concluida = principal?.Status is StatusChamado.Resolvido or StatusChamado.Encerrado;

        return new RelatorioAvaliacao(
            concluida,
            criterios,
            incidenteSeguranca,
            xp,
            curriculo,
            $"{atendidos}/{criterios.Count} criterios atendidos | XP: {xp}");
    }

    private static bool j2Ok(EnvelopeEvento? rest) => rest is not null;
    private static bool j4Ok(EnvelopeEvento? classif) => classif is not null;

    private static string CalcularHashTrilha(IReadOnlyList<EnvelopeEvento> eventos)
    {
        var canonico = eventos.Select(e => new
        {
            seq = e.Seq,
            tipo = e.Tipo,
            minutoSimulado = e.MinutoSimulado,
            dados = e.Dados.OrderBy(kv => kv.Key, StringComparer.Ordinal).ToDictionary(kv => kv.Key, kv => kv.Value)
        });
        var json = JsonSerializer.Serialize(canonico);
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(json));
        return Convert.ToHexStringLower(bytes);
    }
}
