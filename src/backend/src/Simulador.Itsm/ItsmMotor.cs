namespace Simulador.Itsm;

public sealed record ResultadoItsm(bool Sucesso, EstadoItsm NovoEstado, string? MotivoRejeicao = null);

public static class ItsmRegras
{
    public static PrioridadeChamado CalcularPrioridade(NivelUrgencia urgencia, NivelImpacto impacto) =>
        (urgencia, impacto) switch
        {
            (NivelUrgencia.Critica, NivelImpacto.Generalizado) => PrioridadeChamado.P1,
            (NivelUrgencia.Critica, NivelImpacto.Alto) => PrioridadeChamado.P1,
            (NivelUrgencia.Alta, NivelImpacto.Generalizado) => PrioridadeChamado.P1,
            (NivelUrgencia.Critica, _) => PrioridadeChamado.P2,
            (NivelUrgencia.Alta, NivelImpacto.Alto) => PrioridadeChamado.P2,
            (NivelUrgencia.Alta, NivelImpacto.Medio) => PrioridadeChamado.P2,
            (NivelUrgencia.Media, NivelImpacto.Generalizado) => PrioridadeChamado.P2,
            (NivelUrgencia.Media, NivelImpacto.Alto) => PrioridadeChamado.P3,
            (NivelUrgencia.Media, NivelImpacto.Medio) => PrioridadeChamado.P3,
            (NivelUrgencia.Baixa, NivelImpacto.Generalizado) => PrioridadeChamado.P3,
            (NivelUrgencia.Baixa, NivelImpacto.Alto) => PrioridadeChamado.P3,
            _ => PrioridadeChamado.P4
        };

    public static int CalcularSlaMinutos(PrioridadeChamado prioridade) => prioridade switch
    {
        PrioridadeChamado.P1 => 60,
        PrioridadeChamado.P2 => 240,
        PrioridadeChamado.P3 => 480,
        PrioridadeChamado.P4 => 1440,
        _ => 1440
    };

    public static string FormatarChamadoId(int numero) => $"CH-{numero:D4}";
    public static string FormatarProblemaId(int numero) => $"PRB-{numero:D4}";

    public static ResultadoItsm Assumir(EstadoItsm estado, string chamadoId, string responsavel)
    {
        var ch = estado.ObterChamado(chamadoId);
        if (ch is null) return new(false, estado, $"Chamado '{chamadoId}' nao encontrado.");
        if (ch.Status != StatusChamado.Novo)
            return new(false, estado, $"Chamado '{chamadoId}' exige status Novo para ser assumido (atual: {ch.Status}).");

        var atualizado = ch with
        {
            Status = StatusChamado.EmAtendimento,
            Responsavel = responsavel,
            NivelAtendimento = ch.NivelAtendimento ?? "N1"
        };
        return new(true, SubstituirChamado(estado, atualizado));
    }

    public static ResultadoItsm Classificar(
        EstadoItsm estado,
        string chamadoId,
        string categoria,
        NivelUrgencia urgencia,
        NivelImpacto impacto)
    {
        if (string.IsNullOrWhiteSpace(categoria))
            return new(false, estado, "Categoria obrigatoria para classificar chamado.");

        var ch = estado.ObterChamado(chamadoId);
        if (ch is null) return new(false, estado, $"Chamado '{chamadoId}' nao encontrado.");
        if (ch.Status is not (StatusChamado.Novo or StatusChamado.EmAtendimento or StatusChamado.Escalonado))
            return new(false, estado, $"Chamado '{chamadoId}' nao pode ser classificado no status {ch.Status}.");

        var prioridade = CalcularPrioridade(urgencia, impacto);
        var slaAlvo = ch.SlaAlvoMinuto ?? (ch.AbertoEmMinuto + CalcularSlaMinutos(prioridade));

        var atualizado = ch with
        {
            Categoria = categoria.Trim(),
            Urgencia = urgencia,
            Impacto = impacto,
            Prioridade = prioridade,
            SlaAlvoMinuto = slaAlvo
        };
        return new(true, SubstituirChamado(estado, atualizado));
    }

    public static ResultadoItsm AdicionarNota(
        EstadoItsm estado,
        string chamadoId,
        int seq,
        TipoNota tipo,
        string autor,
        string texto,
        int minutoSimulado)
    {
        if (string.IsNullOrWhiteSpace(texto))
            return new(false, estado, "Texto da nota nao pode ser vazio.");

        var ch = estado.ObterChamado(chamadoId);
        if (ch is null) return new(false, estado, $"Chamado '{chamadoId}' nao encontrado.");
        if (ch.Status == StatusChamado.Encerrado)
            return new(false, estado, $"Chamado '{chamadoId}' ja esta Encerrado.");

        var nota = new NotaChamado(seq, tipo, autor, texto.Trim(), minutoSimulado);
        var atualizado = ch with { Notas = [.. ch.Notas, nota] };
        return new(true, SubstituirChamado(estado, atualizado));
    }

    public static ResultadoItsm Escalonar(
        EstadoItsm estado,
        string chamadoId,
        int seq,
        string destinoNivel,
        string autor,
        string notaInterna,
        int minutoSimulado)
    {
        if (!string.Equals(destinoNivel, "N2", StringComparison.OrdinalIgnoreCase))
            return new(false, estado, "Escalonamento permitido apenas para o destino 'N2'.");
        if (string.IsNullOrWhiteSpace(notaInterna))
            return new(false, estado, "Nota interna obrigatoria para escalonar.");

        var ch = estado.ObterChamado(chamadoId);
        if (ch is null) return new(false, estado, $"Chamado '{chamadoId}' nao encontrado.");
        if (ch.Status != StatusChamado.EmAtendimento)
            return new(false, estado, $"Chamado '{chamadoId}' exige status EmAtendimento para escalonar (atual: {ch.Status}).");

        var nota = new NotaChamado(seq, TipoNota.Interna, autor, notaInterna.Trim(), minutoSimulado);
        var atualizado = ch with
        {
            Status = StatusChamado.Escalonado,
            NivelAtendimento = "N2",
            Notas = [.. ch.Notas, nota]
        };
        return new(true, SubstituirChamado(estado, atualizado));
    }

    public static ResultadoItsm Resolver(
        EstadoItsm estado,
        string chamadoId,
        int seq,
        string autor,
        string notaPublica,
        int minutoSimulado)
    {
        if (string.IsNullOrWhiteSpace(notaPublica))
            return new(false, estado, "Nota publica obrigatoria para resolver chamado.");

        var ch = estado.ObterChamado(chamadoId);
        if (ch is null) return new(false, estado, $"Chamado '{chamadoId}' nao encontrado.");
        if (ch.Status is not (StatusChamado.EmAtendimento or StatusChamado.Escalonado))
            return new(false, estado, $"Chamado '{chamadoId}' exige status EmAtendimento ou Escalonado para resolver (atual: {ch.Status}).");
        if (string.IsNullOrWhiteSpace(ch.Categoria))
            return new(false, estado, $"Chamado '{chamadoId}' exige categoria definida antes da resolucao.");

        var nota = new NotaChamado(seq, TipoNota.Publica, autor, notaPublica.Trim(), minutoSimulado);
        var slaVencido = ch.SlaVencido || (ch.SlaAlvoMinuto.HasValue && minutoSimulado > ch.SlaAlvoMinuto.Value);
        var atualizado = ch with
        {
            Status = StatusChamado.Resolvido,
            ResolvidoEmMinuto = minutoSimulado,
            SlaVencido = slaVencido,
            Notas = [.. ch.Notas, nota]
        };
        return new(true, SubstituirChamado(estado, atualizado));
    }

    public static ResultadoItsm Encerrar(EstadoItsm estado, string chamadoId)
    {
        var ch = estado.ObterChamado(chamadoId);
        if (ch is null) return new(false, estado, $"Chamado '{chamadoId}' nao encontrado.");
        if (ch.Status != StatusChamado.Resolvido)
            return new(false, estado, $"Chamado '{chamadoId}' exige status Resolvido para encerrar (atual: {ch.Status}).");

        var atualizado = ch with { Status = StatusChamado.Encerrado };
        return new(true, SubstituirChamado(estado, atualizado));
    }

    public static (ResultadoItsm Resultado, string? ProblemaId) CriarProblema(EstadoItsm estado, string titulo)
    {
        if (string.IsNullOrWhiteSpace(titulo))
            return (new(false, estado, "Titulo do problema nao pode ser vazio."), null);

        var id = FormatarProblemaId(estado.ProximoNumeroProblema);
        var prb = new Problema(id, titulo.Trim(), null, false, []);
        var novo = estado with
        {
            Problemas = [.. estado.Problemas, prb],
            ProximoNumeroProblema = estado.ProximoNumeroProblema + 1
        };
        return (new(true, novo), id);
    }

    public static ResultadoItsm VincularChamadoAProblema(EstadoItsm estado, string problemaId, string chamadoId)
    {
        var prb = estado.ObterProblema(problemaId);
        if (prb is null) return new(false, estado, $"Problema '{problemaId}' nao encontrado.");
        var ch = estado.ObterChamado(chamadoId);
        if (ch is null) return new(false, estado, $"Chamado '{chamadoId}' nao encontrado.");

        var vinculados = prb.ChamadosVinculados.Contains(ch.Id, StringComparer.OrdinalIgnoreCase)
            ? prb.ChamadosVinculados
            : [.. prb.ChamadosVinculados, ch.Id];

        var prbAtualizado = prb with { ChamadosVinculados = vinculados };
        var chAtualizado = ch with { ProblemaId = prb.Id };

        return new(true, SubstituirProblema(SubstituirChamado(estado, chAtualizado), prbAtualizado));
    }

    public static ResultadoItsm RegistrarCausaRaiz(EstadoItsm estado, string problemaId, string causaRaiz)
    {
        if (string.IsNullOrWhiteSpace(causaRaiz))
            return new(false, estado, "Causa raiz nao pode ser vazia.");
        var prb = estado.ObterProblema(problemaId);
        if (prb is null) return new(false, estado, $"Problema '{problemaId}' nao encontrado.");

        var prbAtualizado = prb with { CausaRaiz = causaRaiz.Trim() };
        return new(true, SubstituirProblema(estado, prbAtualizado));
    }

    public static ResultadoItsm ResolverChamadosDoProblema(
        EstadoItsm estado,
        string problemaId,
        int seq,
        string autor,
        string notaPublica,
        int minutoSimulado)
    {
        if (string.IsNullOrWhiteSpace(notaPublica))
            return new(false, estado, "Nota publica obrigatoria para resolver chamados do problema.");
        var prb = estado.ObterProblema(problemaId);
        if (prb is null) return new(false, estado, $"Problema '{problemaId}' nao encontrado.");
        if (string.IsNullOrWhiteSpace(prb.CausaRaiz))
            return new(false, estado, $"Problema '{problemaId}' exige causa raiz registrada antes da resolucao em lote.");
        if (prb.ChamadosVinculados.Count == 0)
            return new(false, estado, $"Problema '{problemaId}' nao possui chamados vinculados.");

        var atual = estado;
        foreach (var chId in prb.ChamadosVinculados)
        {
            var ch = atual.ObterChamado(chId);
            if (ch is null || ch.Status is StatusChamado.Resolvido or StatusChamado.Encerrado)
                continue;
            if (string.IsNullOrWhiteSpace(ch.Categoria))
                return new(false, estado, $"Chamado vinculado '{chId}' exige categoria antes da resolucao em lote.");
            if (ch.Status == StatusChamado.Novo)
                ch = ch with { Status = StatusChamado.EmAtendimento, Responsavel = autor };

            var nota = new NotaChamado(seq, TipoNota.Publica, autor, notaPublica.Trim(), minutoSimulado);
            var slaVencido = ch.SlaVencido || (ch.SlaAlvoMinuto.HasValue && minutoSimulado > ch.SlaAlvoMinuto.Value);
            var chAtualizado = ch with
            {
                Status = StatusChamado.Resolvido,
                ResolvidoEmMinuto = minutoSimulado,
                SlaVencido = slaVencido,
                Notas = [.. ch.Notas, nota]
            };
            atual = SubstituirChamado(atual, chAtualizado);
        }

        var prbResolvido = prb with { Resolvido = true };
        return new(true, SubstituirProblema(atual, prbResolvido));
    }

    private static EstadoItsm SubstituirChamado(EstadoItsm estado, Chamado ch) =>
        estado with { Chamados = estado.Chamados.Select(x => x.Id == ch.Id ? ch : x).ToArray() };

    private static EstadoItsm SubstituirProblema(EstadoItsm estado, Problema prb) =>
        estado with { Problemas = estado.Problemas.Select(x => x.Id == prb.Id ? prb : x).ToArray() };
}
