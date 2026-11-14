namespace Simulador.Itsm;

public enum StatusChamado
{
    Novo,
    EmAtendimento,
    Escalonado,
    Resolvido,
    Encerrado
}

public enum NivelUrgencia
{
    Baixa,
    Media,
    Alta,
    Critica
}

public enum NivelImpacto
{
    Baixo,
    Medio,
    Alto,
    Generalizado
}

public enum PrioridadeChamado
{
    P4 = 4,
    P3 = 3,
    P2 = 2,
    P1 = 1
}

public enum TipoNota
{
    Publica,
    Interna
}

public sealed record NotaChamado(int Seq, TipoNota Tipo, string Autor, string Texto, int MinutoSimulado);

public sealed record Chamado(
    string Id,
    string Titulo,
    string Descricao,
    string Solicitante,
    StatusChamado Status,
    string? Categoria,
    NivelUrgencia? Urgencia,
    NivelImpacto? Impacto,
    PrioridadeChamado? Prioridade,
    int AbertoEmMinuto,
    int? SlaAlvoMinuto,
    int? ResolvidoEmMinuto,
    bool SlaVencido,
    string? Responsavel,
    string? NivelAtendimento,
    string? ProblemaId,
    IReadOnlyList<NotaChamado> Notas);

public sealed record Problema(
    string Id,
    string Titulo,
    string? CausaRaiz,
    bool Resolvido,
    IReadOnlyList<string> ChamadosVinculados);

public sealed record EstadoItsm(
    IReadOnlyList<Chamado> Chamados,
    IReadOnlyList<Problema> Problemas,
    int ProximoNumeroChamado,
    int ProximoNumeroProblema)
{
    public static EstadoItsm Vazio => new([], [], 1, 1);

    public Chamado? ObterChamado(string id) =>
        Chamados.FirstOrDefault(c => string.Equals(c.Id, id, StringComparison.OrdinalIgnoreCase));

    public Problema? ObterProblema(string id) =>
        Problemas.FirstOrDefault(p => string.Equals(p.Id, id, StringComparison.OrdinalIgnoreCase));
}
