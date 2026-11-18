using Simulador.Dominio;
using Simulador.Itsm;

namespace Simulador.Avaliacao;

/// <summary>Criterios binarios dos cenarios por escala. Cada criterio e decidido so por Eventos ou pelo estado final.</summary>
public static partial class Juiz360
{
    private static string? Dado(EnvelopeEvento ev, string chave) =>
        ev.Dados.TryGetValue(chave, out var valor) ? valor?.ToString() : null;

    // ------------------------------------------------------------------ reset-senha-desbloqueio

    private static RelatorioAvaliacao AvaliarResetSenha(EstadoSessao estado, IReadOnlyList<EnvelopeEvento> eventos)
    {
        var criterios = new List<CriterioAvaliacao>();
        var principal = estado.Itsm.Chamados.FirstOrDefault();
        var causa = estado.Meta.Causa;

        var tiposEfeito = new[] { "SenhaTemporariaDefinida", "ContaDesbloqueada", "SenhaTrocadaPelaPessoa" };
        var identidade = eventos.FirstOrDefault(e => e.Tipo == "IdentidadeVerificada");
        var primeiroEfeito = eventos.FirstOrDefault(e => tiposEfeito.Contains(e.Tipo));
        var semVerificacao = eventos.FirstOrDefault(e => e.Tipo == "AcaoSensivelSemVerificacao");

        // H1: identidade verificada antes de qualquer Acao_Sensivel (efeito ou tentativa recusada).
        var primeiraSensivel = new[] { primeiroEfeito?.Seq, semVerificacao?.Seq }.Where(s => s.HasValue).Select(s => s!.Value).DefaultIfEmpty(int.MaxValue).Min();
        var h1 = identidade is not null && identidade.Seq < primeiraSensivel;
        criterios.Add(new("H1", "Verificou a identidade da titular antes de qualquer acao sensivel", h1, identidade?.Seq,
            h1 ? "Identidade verificada antes de agir sobre a conta." : "Acao sensivel sem identidade verificada, ou identidade nunca verificada.",
            "Confirme matricula e ramal da titular antes de resetar, desbloquear ou orientar a troca de senha.",
            "kb://seguranca/verificacao-identidade"));

        // H2: no pedido por terceiro, contato com a titular pelo canal cadastrado antes da verificacao.
        var contato = eventos.FirstOrDefault(e => e.Tipo == "TitularContatado");
        var h2 = !estado.Meta.PedidoPorTerceiro || (contato is not null && identidade is not null && contato.Seq < identidade.Seq);
        criterios.Add(new("H2", "No pedido por terceiro, contatou a titular pelo canal cadastrado antes de verificar",
            h2, contato?.Seq,
            !estado.Meta.PedidoPorTerceiro ? "Nao se aplica: o pedido veio da propria titular."
                : h2 ? "Titular contatada pelo ramal do diretorio antes da verificacao." : "A titular nao foi contatada pelo canal cadastrado antes da verificacao.",
            "Quando o pedido vem de terceiro, ligue para o ramal do diretorio e verifique a identidade da titular, nao a de quem pede.",
            "kb://seguranca/engenharia-social"));

        // H3: diagnostico da conta antes de agir.
        var diagnostico = eventos.FirstOrDefault(e => e.Tipo == "ComandoExecutado" &&
            (Dado(e, "comando")?.TrimStart().StartsWith("net user", StringComparison.OrdinalIgnoreCase) == true ||
             Dado(e, "comando")?.TrimStart().StartsWith("eventos-seguranca", StringComparison.OrdinalIgnoreCase) == true));
        var h3 = diagnostico is not null && (primeiroEfeito is null || diagnostico.Seq < primeiroEfeito.Seq);
        criterios.Add(new("H3", "Diagnosticou a conta antes de agir", h3, diagnostico?.Seq,
            h3 ? "Estado da conta consultado antes da acao." : "Acao executada sem consultar o estado da conta.",
            "Execute net user (e eventos-seguranca quando a conta estiver bloqueada) antes de agir.",
            "kb://diagnostico/fluxo-estruturado"));

        // H4: nenhuma Acao_Prejudicial.
        var prejudicial = eventos.FirstOrDefault(e => e.Tipo == "AcaoPrejudicialRegistrada");
        var h4 = prejudicial is null;
        criterios.Add(new("H4", "Nenhuma acao prejudicial de seguranca (reset ou desbloqueio sem verificacao)", h4, prejudicial?.Seq,
            h4 ? "Nenhuma acao prejudicial registrada." : $"Acao prejudicial detectada: {Dado(prejudicial!, "motivo")}",
            "Nunca altere a conta de alguem sem verificar a identidade da titular.",
            "kb://seguranca/politica-reset-senha"));

        // H5: acesso restabelecido pela via correta da Causa.
        var viaEsperada = causa switch
        {
            "CONTA_BLOQUEADA" => "desbloqueio",
            "SENHA_EXPIRADA" => "troca_pela_titular",
            _ => "reset"
        };
        var restabelecido = eventos.FirstOrDefault(e => e.Tipo == "AcessoContaRestabelecido" &&
            string.Equals(Dado(e, "via"), viaEsperada, StringComparison.Ordinal));
        var h5 = restabelecido is not null;
        criterios.Add(new("H5", "Restabeleceu o acesso pela via correta da causa", h5, restabelecido?.Seq,
            h5 ? "Acesso restabelecido pela via adequada." : "O acesso nao foi restabelecido pela via adequada ao sintoma.",
            "Compare o estado da conta com o sintoma e use a menor acao que resolve: reset, desbloqueio ou troca pela titular.",
            "kb://acesso/reset-desbloqueio-e-troca"));

        // H6: nenhuma acao desnecessaria.
        var desnecessaria = eventos.FirstOrDefault(e => e.Tipo == "AcaoDesnecessariaRegistrada");
        var h6 = desnecessaria is null;
        criterios.Add(new("H6", "Nao executou acao desnecessaria sobre a conta", h6, desnecessaria?.Seq,
            h6 ? "Nenhuma acao desnecessaria registrada." : $"Acao desnecessaria registrada: {Dado(desnecessaria!, "motivo")}",
            "Cada acao deve resolver o sintoma. Reset, desbloqueio e link de troca atendem problemas diferentes.",
            "kb://acesso/reset-desbloqueio-e-troca"));

        // H7: chamado principal classificado.
        var classificado = eventos.FirstOrDefault(e => e.Tipo == "ChamadoClassificado" &&
            principal is not null && string.Equals(Dado(e, "chamadoId"), principal.Id, StringComparison.OrdinalIgnoreCase));
        criterios.Add(new("H7", "Classificou o chamado principal no ITSM", classificado is not null, classificado?.Seq,
            classificado is not null ? "Chamado classificado com categoria, urgencia e impacto." : "Chamado nao foi classificado.",
            "Classifique o chamado com categoria, urgencia e impacto para calcular o SLA.",
            "kb://itsm/classificacao-sla"));

        // H8: resolveu depois do restabelecimento, com nota publica.
        var resolvido = eventos.FirstOrDefault(e => e.Tipo == "ChamadoResolvido" &&
            principal is not null && string.Equals(Dado(e, "chamadoId"), principal.Id, StringComparison.OrdinalIgnoreCase));
        var h8 = resolvido is not null && restabelecido is not null && resolvido.Seq > restabelecido.Seq &&
                 principal!.Notas.Any(n => n.Tipo == TipoNota.Publica && !string.IsNullOrWhiteSpace(n.Texto));
        criterios.Add(new("H8", "Resolveu o chamado depois do restabelecimento, com nota publica", h8, resolvido?.Seq,
            h8 ? "Chamado resolvido apos o restabelecimento, com nota publica." : "Chamado resolvido antes do restabelecimento ou sem nota publica.",
            "Resolva o chamado somente depois de restabelecer o acesso e registre o que foi feito em nota publica.",
            "kb://itsm/resolucao-chamado"));

        var atendidos = criterios.Count(c => c.Atendido);
        var todosNoSla = estado.Itsm.Chamados.All(c => !c.SlaVencido);
        var xp = Math.Max(0, atendidos * 10 + (todosNoSla && h8 ? 10 : 0));

        var competencias = new List<string>();
        if (h1 && h2) competencias.Add("Verificacao de Identidade");
        if (h3) competencias.Add("Diagnostico de Conta e Acesso");
        if (h5 && h6) competencias.Add("Atendimento de Menor Acao Necessaria");

        var concluida = principal?.Status is StatusChamado.Resolvido or StatusChamado.Encerrado;
        return new RelatorioAvaliacao(
            concluida,
            criterios,
            !h4,
            xp,
            new CurriculoVivo(estado.Meta.Nivel, xp, competencias, CalcularHashTrilha(eventos)),
            $"{atendidos}/{criterios.Count} criterios atendidos | XP: {xp}");
    }
}
