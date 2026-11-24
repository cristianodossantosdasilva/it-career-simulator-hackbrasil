using System.Security.Cryptography;
using System.Text;

namespace Simulador.Teorico;

/// <summary>
/// Gera provas, verifica e corrige respostas. Sem estado e sem LLM: o resultado depende só do banco e da
/// semente. A explicação "por IA" usa sempre o texto estático derivado da explicação estruturada.
/// </summary>
public sealed class ServicoTeorico(BancoQuestoes banco)
{
    public const int NotaAprovacao = 70;
    public const int QuantidadePadraoCompleto = 40;
    public const int SegundosPorQuestao = 90;
    public const int QuantidadeMaxima = 100;
    private const int MaxRespostas = 100;

    public CatalogoTopicos Topicos() => banco.Catalogo();

    public ProvaGerada GerarProva(CriarProvaRequest? pedido)
    {
        var formato = pedido?.Formato ?? "padrao";
        var escopo = pedido?.Escopo ?? "completo";
        if (formato is not ("padrao" or "pratica"))
            throw new ErroTeorico(400, "validacao", "formato deve ser 'padrao' ou 'pratica'.");
        if (escopo is not ("completo" or "personalizado"))
            throw new ErroTeorico(400, "validacao", "escopo deve ser 'completo' ou 'personalizado'.");
        if (pedido?.Nivel is { } n && n is < 1 or > 3)
            throw new ErroTeorico(400, "validacao", "nivel deve ser 1, 2 ou 3.");
        if (pedido?.Quantidade is { } q && q is < 1 or > QuantidadeMaxima)
            throw new ErroTeorico(400, "validacao", $"quantidade deve ficar entre 1 e {QuantidadeMaxima}.");

        IEnumerable<Questao> candidatas = banco.Todas;
        int quantidade;
        if (escopo == "personalizado")
        {
            var topicos = pedido?.Topicos?.Where(t => !string.IsNullOrWhiteSpace(t)).Select(t => t.Trim()).ToArray() ?? [];
            if (topicos.Length > 0)
            {
                var conhecidos = banco.Todas.SelectMany(x => new[] { x.Dominio, x.Topico }).ToHashSet(StringComparer.OrdinalIgnoreCase);
                var desconhecido = topicos.FirstOrDefault(t => !conhecidos.Contains(t));
                if (desconhecido is not null)
                    throw new ErroTeorico(400, "topico_desconhecido", $"Tópico ou domínio '{desconhecido}' não existe.");
                candidatas = candidatas.Where(x => topicos.Contains(x.Topico, StringComparer.OrdinalIgnoreCase)
                    || topicos.Contains(x.Dominio, StringComparer.OrdinalIgnoreCase));
            }
            if (pedido?.Nivel is { } nivel) candidatas = candidatas.Where(x => x.Nivel == nivel);
            quantidade = pedido?.Quantidade ?? 10;
        }
        else
        {
            quantidade = pedido?.Quantidade ?? QuantidadePadraoCompleto;
        }

        var lista = candidatas.ToList();
        if (lista.Count == 0)
            throw new ErroTeorico(400, "sem_questoes", "Nenhuma questão atende aos filtros informados.");
        quantidade = Math.Min(quantidade, lista.Count);

        var semente = pedido?.Semente ?? Random.Shared.NextInt64(1, int.MaxValue);
        var escolhidas = Selecionar(lista, quantidade, semente);
        var rng = new Sorteio(semente ^ 0x5DEECE66DL);
        var publicas = escolhidas
            .Select(x => new QuestaoPublica(x.Id, x.Dominio, x.Topico, x.Nivel, x.Enunciado, Embaralhar(x.Alternativas, rng), x.Selecao))
            .ToList();

        var provaId = IdDaProva(formato, escopo, semente, escolhidas);
        int? duracao = formato == "padrao" ? quantidade * SegundosPorQuestao : null;
        return new ProvaGerada(provaId, semente, duracao, NotaAprovacao, publicas);
    }

    public VerificacaoResultado Verificar(string questaoId, VerificarRequest? pedido)
    {
        var questao = Obter(questaoId);
        var respostas = ValidarRespostas(questao, pedido?.Respostas);
        return new VerificacaoResultado(Correta(questao, respostas), Gabarito(questao), questao.Explicacao);
    }

    public CorrecaoResultado Corrigir(CorrigirRequest? pedido)
    {
        if (pedido?.Respostas is null || pedido.Respostas.Length == 0)
            throw new ErroTeorico(400, "validacao", "respostas é obrigatório (uma entrada por questão da prova).");
        if (pedido.Respostas.Length > MaxRespostas)
            throw new ErroTeorico(400, "validacao", $"respostas excede {MaxRespostas} entradas.");
        if (pedido.Formato is not null and not ("padrao" or "pratica"))
            throw new ErroTeorico(400, "validacao", "formato deve ser 'padrao' ou 'pratica'.");

        var vistos = new HashSet<string>();
        var resultados = new List<ResultadoQuestao>();
        var porDominio = new Dictionary<string, (int Total, int Corretas)>();
        foreach (var entrada in pedido.Respostas)
        {
            if (string.IsNullOrWhiteSpace(entrada?.QuestaoId))
                throw new ErroTeorico(400, "validacao", "Cada resposta precisa de questaoId.");
            if (!vistos.Add(entrada.QuestaoId))
                throw new ErroTeorico(400, "validacao", $"Questão '{entrada.QuestaoId}' repetida.");
            var questao = Obter(entrada.QuestaoId);
            var certa = Correta(questao, ValidarRespostas(questao, entrada.Respostas ?? []));
            resultados.Add(new ResultadoQuestao(questao.Id, certa, Gabarito(questao), questao.Explicacao));
            var atual = porDominio.GetValueOrDefault(questao.Dominio);
            porDominio[questao.Dominio] = (atual.Total + 1, atual.Corretas + (certa ? 1 : 0));
        }

        var total = resultados.Count;
        var corretas = resultados.Count(r => r.Correta);
        var percentual = Math.Round(100.0 * corretas / total, 1);
        var nomes = banco.Dominios.ToDictionary(d => d.Id, d => d.Nome);
        var dominios = porDominio
            .OrderBy(p => p.Key, StringComparer.Ordinal)
            .Select(p => new ResultadoDominio(nomes.GetValueOrDefault(p.Key, p.Key), p.Value.Total, p.Value.Corretas))
            .ToList();
        return new CorrecaoResultado(total, corretas, percentual, percentual >= NotaAprovacao, dominios, resultados);
    }

    public ExplicacaoTexto Explicar(string questaoId, ExplicarRequest? pedido)
    {
        var questao = Obter(questaoId);
        var estilo = pedido?.Estilo;
        if (estilo is not ("simples" or "exemplo" or "por-que-erradas"))
            throw new ErroTeorico(400, "validacao", "estilo deve ser 'simples', 'exemplo' ou 'por-que-erradas'.");
        return new ExplicacaoTexto(TextoEstatico(questao, estilo), "fallback");
    }

    // ---- internos ----

    private Questao Obter(string id) =>
        banco.Obter(id) ?? throw new ErroTeorico(404, "questao_nao_encontrada", "Questão não encontrada.");

    private static IReadOnlyList<string> Gabarito(Questao q) => q.Corretas.OrderBy(x => x, StringComparer.Ordinal).ToList();

    private static bool Correta(Questao q, HashSet<string> respostas) => respostas.SetEquals(q.Corretas);

    private static HashSet<string> ValidarRespostas(Questao q, string[]? respostas)
    {
        var conjunto = (respostas ?? []).ToHashSet(StringComparer.Ordinal);
        var validos = q.Alternativas.Select(a => a.Id).ToHashSet(StringComparer.Ordinal);
        if (!conjunto.IsSubsetOf(validos))
            throw new ErroTeorico(400, "validacao", "respostas contém alternativa inexistente.");
        return conjunto;
    }

    /// <summary>Seleção determinística e balanceada: embaralha cada domínio e intercala por rodízio.</summary>
    private static List<Questao> Selecionar(List<Questao> candidatas, int quantidade, long semente)
    {
        var rng = new Sorteio(semente);
        var filas = candidatas
            .GroupBy(x => x.Dominio)
            .OrderBy(g => g.Key, StringComparer.Ordinal)
            .Select(g => new Queue<Questao>(Embaralhar(g.OrderBy(x => x.Id, StringComparer.Ordinal).ToList(), rng)))
            .ToList();
        var resultado = new List<Questao>();
        while (resultado.Count < quantidade)
        {
            var avancou = false;
            foreach (var fila in filas)
            {
                if (resultado.Count >= quantidade) break;
                if (fila.Count == 0) continue;
                resultado.Add(fila.Dequeue());
                avancou = true;
            }
            if (!avancou) break;
        }
        return Embaralhar(resultado, rng);
    }

    private static List<T> Embaralhar<T>(IReadOnlyList<T> origem, Sorteio rng)
    {
        var lista = origem.ToList();
        for (var i = lista.Count - 1; i > 0; i--)
        {
            var j = rng.Proximo(i + 1);
            (lista[i], lista[j]) = (lista[j], lista[i]);
        }
        return lista;
    }

    private static string IdDaProva(string formato, string escopo, long semente, IReadOnlyList<Questao> questoes)
    {
        var texto = $"{formato}|{escopo}|{semente}|{string.Join(',', questoes.Select(q => q.Id))}";
        return "pt-" + Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(texto)))[..12].ToLowerInvariant();
    }

    private static string TextoEstatico(Questao q, string estilo)
    {
        var correta = string.Join("; ", q.Alternativas.Where(a => q.Corretas.Contains(a.Id)).Select(a => a.Texto));
        switch (estilo)
        {
            case "simples":
                return $"Resposta: {correta}. Em outras palavras: {q.Explicacao.Correta}";
            case "exemplo":
                return $"Exemplo no atendimento: {q.Enunciado} A conduta esperada é: {correta}. {q.Explicacao.Correta}";
            default:
                var linhas = q.Explicacao.Incorretas
                    .Select(i => $"- {q.Alternativas.First(a => a.Id == i.AlternativaId).Texto}: {i.Texto}");
                return "Por que as outras alternativas estão erradas:\n" + string.Join('\n', linhas);
        }
    }

    /// <summary>Gerador pseudoaleatório estável (xorshift), independente da versão do .NET.</summary>
    private sealed class Sorteio(long semente)
    {
        private ulong _estado = (ulong)semente * 6364136223846793005UL + 1442695040888963407UL;

        public int Proximo(int limite)
        {
            _estado ^= _estado << 13;
            _estado ^= _estado >> 7;
            _estado ^= _estado << 17;
            return (int)((_estado >> 11) % (ulong)limite);
        }
    }
}
