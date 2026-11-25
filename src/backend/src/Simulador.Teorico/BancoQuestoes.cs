namespace Simulador.Teorico;

/// <summary>
/// Banco de questões originais em português, escritas para este projeto (nada copiado de exames ou bancos
/// pagos). Dados 100% sintéticos. As referências apontam para documentação pública.
/// </summary>
public sealed class BancoQuestoes
{
    public static BancoQuestoes Padrao { get; } = new(QuestoesPadrao.Criar(), PerguntasPadrao.Criar());

    public IReadOnlyList<Questao> Todas { get; }
    public IReadOnlyList<Dominio> Dominios { get; } =
    [
        new("acesso", "Acesso e contas"),
        new("redes", "Redes"),
        new("hardware", "Hardware"),
        new("sistemas", "Sistemas e ERP"),
        new("seguranca", "Segurança"),
        new("backup", "Backup e continuidade"),
    ];

    private readonly Dictionary<string, Questao> _porId;

    private readonly IReadOnlyDictionary<string, IReadOnlyList<(string Pergunta, string Resposta)>> _faq;

    public BancoQuestoes(
        IReadOnlyList<Questao> questoes,
        IReadOnlyDictionary<string, IReadOnlyList<(string Pergunta, string Resposta)>>? faq = null)
    {
        Todas = questoes;
        _faq = faq ?? new Dictionary<string, IReadOnlyList<(string Pergunta, string Resposta)>>();
        _porId = questoes.ToDictionary(q => q.Id, StringComparer.Ordinal);
    }

    public Questao? Obter(string id) => _porId.GetValueOrDefault(id);

    /// <summary>Perguntas escritas à mão para a questão (sem a pergunta derivada da explicação).</summary>
    public IReadOnlyList<(string Pergunta, string Resposta)> PerguntasManuais(string id) =>
        _faq.GetValueOrDefault(id) ?? [];

    public CatalogoTopicos Catalogo()
    {
        var dominios = Dominios.Select(d =>
        {
            var doDominio = Todas.Where(q => q.Dominio == d.Id).ToList();
            var topicos = doDominio
                .GroupBy(q => q.Topico)
                .OrderBy(g => g.Key, StringComparer.Ordinal)
                .Select(g => new TopicoInfo(d.Id, g.Key, g.Count(), g.Select(q => q.Nivel).Distinct().Order().ToList()))
                .ToList();
            return new DominioInfo(d.Id, d.Nome, doDominio.Count, topicos);
        }).ToList();
        return new CatalogoTopicos(dominios, Todas.Count);
    }
}
