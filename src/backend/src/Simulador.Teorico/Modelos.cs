namespace Simulador.Teorico;

public sealed record Alternativa(string Id, string Texto);

public sealed record ExplicacaoIncorreta(string AlternativaId, string Texto);

public sealed record Explicacao(string Correta, IReadOnlyList<ExplicacaoIncorreta> Incorretas, string Referencia);

/// <summary>Questão do banco. O gabarito (<see cref="Corretas"/>) fica só no servidor.</summary>
public sealed record Questao(
    string Id,
    string Dominio,
    string Topico,
    int Nivel,
    string Enunciado,
    IReadOnlyList<Alternativa> Alternativas,
    IReadOnlySet<string> Corretas,
    Explicacao Explicacao)
{
    public string Selecao => Corretas.Count > 1 ? "multipla" : "unica";
}

public sealed record Dominio(string Id, string Nome);

public sealed record TopicoInfo(string Dominio, string Topico, int Questoes, IReadOnlyList<int> Niveis);

public sealed record DominioInfo(string Id, string Nome, int Questoes, IReadOnlyList<TopicoInfo> Topicos);

public sealed record CatalogoTopicos(IReadOnlyList<DominioInfo> Dominios, int Total);

// ---- Requisições e respostas ----

public sealed record CriarProvaRequest(string? Formato, string? Escopo, string[]? Topicos, int? Nivel, int? Quantidade, long? Semente);

public sealed record QuestaoPublica(string Id, string Dominio, string Topico, int Nivel, string Enunciado, IReadOnlyList<Alternativa> Alternativas, string Selecao);

public sealed record ProvaGerada(
    string ProvaId,
    long Semente,
    int? DuracaoSegundos,
    int NotaAprovacao,
    IReadOnlyList<QuestaoPublica> Questoes);

public sealed record VerificarRequest(string[]? Respostas);

public sealed record VerificacaoResultado(bool Correta, IReadOnlyList<string> Gabarito, Explicacao Explicacao);

public sealed record RespostaQuestao(string? QuestaoId, string[]? Respostas);

public sealed record CorrigirRequest(long? Semente, string? Formato, string? Escopo, RespostaQuestao[]? Respostas);

public sealed record ResultadoDominio(string Dominio, int Total, int Corretas);

public sealed record ResultadoQuestao(string Id, bool Correta, IReadOnlyList<string> Gabarito, Explicacao Explicacao);

public sealed record CorrecaoResultado(
    int Total,
    int Corretas,
    double Percentual,
    bool Aprovado,
    IReadOnlyList<ResultadoDominio> PorDominio,
    IReadOnlyList<ResultadoQuestao> Questoes);

public sealed record ExplicarRequest(string? Estilo);

public sealed record ExplicacaoTexto(string Texto, string Origem);

/// <summary>Erro de validação ou de recurso ausente, traduzido para ErroProblema na API.</summary>
public sealed class ErroTeorico(int status, string tipo, string mensagem) : Exception(mensagem)
{
    public int Status { get; } = status;
    public string Tipo { get; } = tipo;
}
