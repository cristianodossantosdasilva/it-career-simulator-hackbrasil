using Simulador.Dominio;
using Simulador.Itsm;

namespace Simulador.Avaliacao;

/// <summary>Criterios binarios dos cenarios por etapa. Cada criterio e decidido so por Eventos ou pelo estado final.</summary>
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

        var h9 = false;
        var h10 = false;
        if (causa == "CONTA_BLOQUEADA")
        {
            // H9: achou a origem antes de desbloquear e a conta nao bloqueou de novo.
            var origem = eventos.FirstOrDefault(e => e.Tipo == "OrigemBloqueioIdentificada");
            var desbloqueio = eventos.FirstOrDefault(e => e.Tipo == "ContaDesbloqueada");
            var bloqueouDeNovo = eventos.FirstOrDefault(e => e.Tipo == "ContaBloqueadaNovamente");
            h9 = origem is not null && desbloqueio is not null && origem.Seq < desbloqueio.Seq && bloqueouDeNovo is null;
            criterios.Add(new("H9", "Achou a origem do bloqueio antes de desbloquear e a conta nao bloqueou de novo", h9, origem?.Seq ?? bloqueouDeNovo?.Seq,
                h9 ? "Origem das tentativas identificada antes do desbloqueio." : "Desbloqueio sem identificar a origem das tentativas, ou a conta bloqueou de novo.",
                "Leia os eventos de seguranca (eventos-seguranca) para achar a origem das tentativas antes de desbloquear.",
                "kb://acesso/reset-desbloqueio-e-troca"));

            // H10: orientou a titular, em nota publica, sobre o dispositivo com a senha antiga.
            var termosDispositivo = new[] { "celular", "telefone", "dispositivo", "movel", "smartphone" };
            var notaOrientacao = principal?.Notas.FirstOrDefault(n =>
            {
                if (n.Tipo != TipoNota.Publica) return false;
                var texto = Normalizar(n.Texto);
                return texto.Contains("senha", StringComparison.Ordinal) && termosDispositivo.Any(t => texto.Contains(t, StringComparison.Ordinal));
            });
            h10 = notaOrientacao is not null;
            criterios.Add(new("H10", "Orientou a titular sobre o celular com a senha antiga", h10, notaOrientacao?.Seq,
                h10 ? "Nota publica orienta atualizar a senha no celular." : "Nenhuma nota publica orientou a titular sobre o dispositivo com a senha antiga.",
                "Registre em nota publica que o celular com a senha antiga em cache precisa ser atualizado.",
                "kb://acesso/reset-desbloqueio-e-troca"));
        }

        var atendidos = criterios.Count(c => c.Atendido);
        var todosNoSla = estado.Itsm.Chamados.All(c => !c.SlaVencido);
        var xp = Math.Max(0, atendidos * 10 + (todosNoSla && h8 ? 10 : 0));

        var competencias = new List<string>();
        if (h1 && h2) competencias.Add("Verificacao de Identidade");
        if (h3) competencias.Add("Diagnostico de Conta e Acesso");
        if (h5 && h6) competencias.Add("Atendimento de Menor Acao Necessaria");
        if (h9 && h10) competencias.Add("Analise de Origem de Bloqueio");
        var concluida = principal?.Status is StatusChamado.Resolvido or StatusChamado.Encerrado;
        return new RelatorioAvaliacao(
            concluida,
            criterios,
            !h4,
            xp,
            new CurriculoVivo(estado.Meta.Nivel, xp, competencias, CalcularHashTrilha(eventos)),
            $"{atendidos}/{criterios.Count} criterios atendidos | XP: {xp}");
    }

    // ------------------------------------------------------------------ falha-backup-restore

    private static RelatorioAvaliacao AvaliarBackup(EstadoSessao estado, IReadOnlyList<EnvelopeEvento> eventos)
    {
        var criterios = new List<CriterioAvaliacao>();
        var principal = estado.Itsm.Chamados.FirstOrDefault();
        var causa = estado.Meta.Causa;

        // Evento corretivo da Causa (B4) e primeiro Evento corretivo de qualquer tipo (limite do diagnostico, B2).
        var primeiroCorretivo = eventos.FirstOrDefault(e => e.Tipo is "RepositorioExpandido" or "BackupConcluido" or "PastaFinanceiroRestaurada");
        var corretivo = causa == "CADEIA_CORROMPIDA"
            ? eventos.FirstOrDefault(e => e.Tipo == "PastaFinanceiroRestaurada" && Dado(e, "origem") == "imutavel")
            : eventos.FirstOrDefault(e => e.Tipo == "BackupConcluido");

        var classificado = eventos.FirstOrDefault(e => e.Tipo == "ChamadoClassificado" &&
            principal is not null && string.Equals(Dado(e, "chamadoId"), principal.Id, StringComparison.OrdinalIgnoreCase));
        criterios.Add(new("B1", "Classificou o chamado principal no ITSM", classificado is not null, classificado?.Seq,
            classificado is not null ? "Chamado classificado com categoria, urgencia e impacto." : "Chamado nao foi classificado.",
            "Classifique o chamado com categoria, urgencia e impacto para calcular o SLA.",
            "kb://itsm/classificacao-sla"));

        var diagnostico = eventos.FirstOrDefault(e =>
            e.Tipo == "LogsConsultados" ||
            (e.Tipo == "ComandoExecutado" && Dado(e, "comando")?.TrimStart().StartsWith("backup log", StringComparison.OrdinalIgnoreCase) == true));
        var b2 = diagnostico is not null && (primeiroCorretivo is null || diagnostico.Seq < primeiroCorretivo.Seq);
        criterios.Add(new("B2", "Diagnosticou o job pelo log antes de agir", b2, diagnostico?.Seq,
            b2 ? "Log do job consultado antes de qualquer correcao." : "Correcao aplicada sem consultar o log do job.",
            "Execute backup log: o log diz o que impediu o backup.",
            "kb://backup/diagnostico-de-job"));

        var b3 = corretivo is not null && FoiComPrivilegioElevado(eventos, corretivo);
        criterios.Add(new("B3", "Aplicou a correcao com privilegio Elevado", b3, corretivo?.Seq,
            b3 ? "Correcao aplicada com privilegio Elevado." : "A correcao nao foi aplicada com privilegio Elevado.",
            "Operacoes de backup e restore exigem privilegio elevado: eleve o privilegio antes de agir.",
            "kb://servicos/privilegio-elevado"));

        var b4 = corretivo is not null;
        criterios.Add(new("B4", "Aplicou a correcao da causa", b4, corretivo?.Seq,
            b4 ? "A correcao adequada a causa foi aplicada." : "Nenhuma correcao adequada a causa foi aplicada.",
            causa == "CADEIA_CORROMPIDA"
                ? "Quando a cadeia incremental esta corrompida, restaure a partir da copia imutavel integra."
                : "Quando o repositorio esta sem espaco, expanda o repositorio e execute o job de novo.",
            causa == "CADEIA_CORROMPIDA" ? "kb://backup/copia-imutavel-e-retencao" : "kb://backup/diagnostico-de-job"));

        var prejudicial = eventos.FirstOrDefault(e => e.Tipo == "AcaoPrejudicialRegistrada");
        var b5 = prejudicial is null;
        criterios.Add(new("B5", "Nenhuma acao destrutiva sobre retencao ou dados integros", b5, prejudicial?.Seq,
            b5 ? "Nenhuma acao prejudicial registrada." : $"Acao prejudicial detectada: {Dado(prejudicial!, "motivo")}",
            "Apagar pontos de restauracao ou restaurar sobre dados integros nao e um atalho seguro.",
            "kb://backup/copia-imutavel-e-retencao"));

        var resolvido = eventos.FirstOrDefault(e => e.Tipo == "ChamadoResolvido" &&
            principal is not null && string.Equals(Dado(e, "chamadoId"), principal.Id, StringComparison.OrdinalIgnoreCase));
        var b6 = resolvido is not null && corretivo is not null && resolvido.Seq > corretivo.Seq &&
                 principal!.Notas.Any(n => n.Tipo == TipoNota.Publica && !string.IsNullOrWhiteSpace(n.Texto)) &&
                 !principal.SlaVencido;
        criterios.Add(new("B6", "Resolveu depois do restabelecimento, com nota publica e dentro do SLA", b6, resolvido?.Seq,
            b6 ? "Chamado resolvido apos o restabelecimento, com nota publica e dentro do SLA." : "Chamado resolvido antes do restabelecimento, sem nota publica ou fora do SLA.",
            "Resolva o chamado so depois de restabelecer o servico e registre o que foi feito em nota publica.",
            "kb://itsm/resolucao-chamado"));

        var b7 = false;
        if (causa == "CADEIA_CORROMPIDA")
        {
            var restauracao = eventos.FirstOrDefault(e => e.Tipo == "PastaFinanceiroRestaurada");
            var verificacao = eventos.FirstOrDefault(e => e.Tipo == "ComandoExecutado" &&
                Dado(e, "comando")?.TrimStart().StartsWith("backup cadeia", StringComparison.OrdinalIgnoreCase) == true);
            b7 = verificacao is not null && restauracao is not null && verificacao.Seq < restauracao.Seq;
            criterios.Add(new("B7", "Verificou a cadeia antes de restaurar", b7, verificacao?.Seq,
                b7 ? "Cadeia verificada antes da restauracao." : "Restauracao sem verificar a cadeia antes, ou cadeia nunca verificada.",
                "Execute backup cadeia verificar para saber qual copia esta integra antes de restaurar.",
                "kb://backup/copia-imutavel-e-retencao"));
        }

        var atendidos = criterios.Count(c => c.Atendido);
        var xp = Math.Max(0, atendidos * 20 - (b5 ? 0 : 25));

        var competencias = new List<string>();
        if (b2) competencias.Add("Diagnostico de Backup por Log");
        if (b3 && b4) competencias.Add("Recuperacao de Dados e Restore");
        if (b5) competencias.Add("Seguranca Operacional");
        var concluida = principal?.Status is StatusChamado.Resolvido or StatusChamado.Encerrado && estado.Estacao.CompartilhamentoAcessivel;
        return new RelatorioAvaliacao(
            concluida,
            criterios,
            !b5,
            xp,
            new CurriculoVivo(estado.Meta.Nivel, xp, competencias, CalcularHashTrilha(eventos)),
            $"{atendidos}/{criterios.Count} criterios atendidos | XP: {xp}");
    }

    // ------------------------------------------------------------------ incidente-massivo: Causas externas

    private static RelatorioAvaliacao AvaliarIncidenteExterno(EstadoSessao estado, IReadOnlyList<EnvelopeEvento> eventos)
    {
        var criterios = new List<CriterioAvaliacao>();
        var dominio = estado.Meta.Causa == "DOMINIO_SUSPENSO";

        var prbCriado = eventos.FirstOrDefault(e => e.Tipo == "ProblemaCriado");
        var primeiraResolucao = eventos.FirstOrDefault(e => e.Tipo is "ChamadoResolvido" or "ProblemaResolvidoEmLote");
        var f1 = prbCriado is not null && (primeiraResolucao is null || prbCriado.Seq < primeiraResolucao.Seq);
        criterios.Add(new("F1", "Problema ITIL criado antes de resolver chamados", f1, prbCriado?.Seq,
            f1 ? "Problema criado antes de resolver chamados individuais." : "Chamados resolvidos sem criar Problema ITIL.",
            "Em incidentes massivos, crie um Problema para correlacionar chamados antes de resolve-los.",
            "kb://itil/gestao-problemas"));

        var vinculos = eventos.Where(e => e.Tipo == "ChamadoVinculadoAProblema").ToArray();
        var f2 = vinculos.Length >= 3;
        criterios.Add(new("F2", "Todos os 3 chamados vinculados ao Problema", f2, vinculos.LastOrDefault()?.Seq,
            f2 ? "Todos os chamados foram vinculados ao Problema." : $"Apenas {vinculos.Length}/3 chamados vinculados.",
            "Vincule todos os chamados relacionados ao Problema para rastreabilidade.",
            "kb://itil/vinculacao-problema"));

        var evidencia = eventos.FirstOrDefault(e => e.Tipo == "EvidenciaExternaConfirmada");
        var primeiroAcionamento = eventos.FirstOrDefault(e => e.Tipo == "AreaAcionada");
        var f3 = evidencia is not null && (primeiroAcionamento is null || evidencia.Seq < primeiroAcionamento.Seq);
        criterios.Add(new("F3", "Confirmou a falha externa por evidencia antes de acionar", f3, evidencia?.Seq,
            f3 ? "Evidencia da falha externa obtida antes de acionar qualquer area." : "Area acionada sem evidencia previa de que a falha esta fora da empresa, ou evidencia nunca obtida.",
            dominio
                ? "Consulte o registro do dominio (whois) para confirmar o status antes de acionar o fornecedor e o financeiro."
                : "Consulte a pagina de status do provedor (curl -i) para confirmar a falha antes de acionar o fornecedor.",
            "kb://itil/falha-de-fornecedor"));

        bool Acionada(string area) => eventos.Any(e => e.Tipo == "AreaAcionada" && Dado(e, "area") == area);
        var f4 = Acionada("Fornecedor") && (!dominio || Acionada("Financeiro"));
        criterios.Add(new("F4", "Acionou as areas da causa", f4, eventos.LastOrDefault(e => e.Tipo == "AreaAcionada")?.Seq,
            f4 ? "As areas responsaveis foram acionadas." : "Nem todas as areas responsaveis pela causa foram acionadas.",
            dominio
                ? "Uma falha de dominio por inadimplencia pede acionar o fornecedor (registrador) e o financeiro (pagamento)."
                : "Uma falha do provedor de e-mail pede acionar o fornecedor.",
            "kb://itil/falha-de-fornecedor"));

        var lote = eventos.FirstOrDefault(e => e.Tipo == "ProblemaResolvidoEmLote");
        var notaPublica = eventos.FirstOrDefault(e => e.Tipo == "NotaChamadoAdicionada" && Dado(e, "tipo") == nameof(TipoNota.Publica) &&
                                                         (lote is null || e.Seq < lote.Seq));
        var f5 = notaPublica is not null && lote is not null;
        criterios.Add(new("F5", "Comunicou o incidente aos solicitantes com nota publica antes de resolver em lote", f5, notaPublica?.Seq,
            f5 ? "Nota publica registrada antes da resolucao em lote." : "Nenhuma nota publica foi registrada antes de resolver em lote.",
            "Informe os solicitantes em nota publica sobre o impacto e o que esta sendo feito antes de encerrar.",
            "kb://itil/comunicacao-de-incidente"));

        var acompanhamento = eventos.FirstOrDefault(e => e.Tipo == "AcompanhamentoRegistrado");
        var restabelecido = eventos.FirstOrDefault(e => e.Tipo == "ServicoExternoRestabelecido");
        var f6 = acompanhamento is not null && restabelecido is not null;
        criterios.Add(new("F6", "Acompanhou o fornecedor ate o restabelecimento", f6, restabelecido?.Seq ?? acompanhamento?.Seq,
            f6 ? "Fornecedor acompanhado ate o restabelecimento do servico." : "O fornecedor nao foi acompanhado ate o restabelecimento.",
            "Depois de acionar, acompanhe o fornecedor ate ele confirmar a normalizacao (acompanhar fornecedor).",
            "kb://itil/falha-de-fornecedor"));

        var crEv = eventos.LastOrDefault(e => e.Tipo == "CausaRaizRegistrada");
        var crNorm = Normalizar(crEv is null ? "" : Dado(crEv, "causaRaiz") ?? "");
        var f7 = crEv is not null && (dominio
            ? crNorm.Contains("dominio", StringComparison.Ordinal) && crNorm.Contains("registrador", StringComparison.Ordinal) &&
              new[] { "fatura", "inadimpl", "pagamento" }.Any(t => crNorm.Contains(t, StringComparison.Ordinal))
            : crNorm.Contains("provedor", StringComparison.Ordinal) || crNorm.Contains("fornecedor", StringComparison.Ordinal));
        criterios.Add(new("F7", "Causa raiz registra a origem externa", f7, crEv?.Seq,
            f7 ? "Causa raiz registrada aponta a origem externa." : "A causa raiz nao aponta a origem externa.",
            dominio
                ? "Registre a causa raiz com o dominio, o registrador e o motivo (fatura, inadimplencia ou pagamento)."
                : "Registre a causa raiz apontando o provedor ou o fornecedor externo.",
            "kb://itil/analise-causa-raiz"));

        // F8: o reinicio local e a ativacao de servicos nao resolvem uma falha externa; a Acao_Prejudicial tambem conta.
        var internoOuPrejudicial = eventos.FirstOrDefault(e => e.Tipo is "ServicoReiniciado" or "ServicoIniciado" or "AcaoPrejudicialRegistrada");
        var f8 = internoOuPrejudicial is null;
        criterios.Add(new("F8", "Nao tentou consertar internamente nem agiu de forma prejudicial", f8, internoOuPrejudicial?.Seq,
            f8 ? "Nenhuma tentativa de correcao interna nem acao prejudicial." : "Houve tentativa de corrigir internamente uma falha que esta fora da empresa, ou acao prejudicial.",
            "Reiniciar servicos locais nao resolve uma falha do fornecedor. Acione quem pode resolver.",
            "kb://seguranca/contencao-incidentes"));

        var todosNoSla = estado.Itsm.Chamados.All(c => !c.SlaVencido);
        var f9 = lote is not null && restabelecido is not null && lote.Seq > restabelecido.Seq && todosNoSla;
        criterios.Add(new("F9", "Resolveu em lote depois do restabelecimento, dentro do SLA", f9, lote?.Seq,
            f9 ? "Chamados resolvidos em lote apos o restabelecimento e dentro do SLA."
                : "Resolucao em lote antes do restabelecimento, ausente ou fora do SLA.",
            "Resolva em lote somente depois que o fornecedor confirmar o restabelecimento e dentro do SLA.",
            "kb://itil/resolucao-lote"));

        var atendidos = criterios.Count(c => c.Atendido);
        var xp = Math.Max(0, atendidos * 10 + (f9 ? 10 : 0));

        var competencias = new List<string>();
        if (f3 && f4 && f5 && f6) competencias.Add("Gestao de Fornecedores e Comunicacao de Incidentes");
        if (f1 && f2 && f9) competencias.Add("Gestao de Problemas ITIL");
        if (f7) competencias.Add("Analise de Causa Raiz (RCA)");

        var concluida = estado.Itsm.Problemas.Any(p => p.Resolvido);
        // IncidenteSeguranca so por Acao_Prejudicial: tentar reiniciar um servico local reprova F8, mas nao e incidente de seguranca.
        var incidenteSeguranca = eventos.Any(e => e.Tipo == "AcaoPrejudicialRegistrada");
        return new RelatorioAvaliacao(
            concluida,
            criterios,
            incidenteSeguranca,
            xp,
            new CurriculoVivo(estado.Meta.Nivel, xp, competencias, CalcularHashTrilha(eventos)),
            $"{atendidos}/{criterios.Count} criterios atendidos | XP: {xp}");
    }
}