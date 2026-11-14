using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Simulador.Dominio;

namespace Simulador.Dialogo;

public sealed record RespostaDialogo(string Mensagem, string Origem);

public interface IClienteDialogo
{
    Task<RespostaDialogo> ResponderAsync(EstadoSessao estado, string persona, string mensagemUsuario, CancellationToken ct = default);
}

public sealed class FallbackRoteirizadoDialogo : IClienteDialogo
{
    public Task<RespostaDialogo> ResponderAsync(EstadoSessao estado, string persona, string mensagemUsuario, CancellationToken ct = default)
    {
        var texto = mensagemUsuario.ToLowerInvariant();
        if (string.Equals(persona, "techlead", StringComparison.OrdinalIgnoreCase))
        {
            var dica = texto.Contains("escalon") || texto.Contains("dns")
                ? "Se o nslookup apontar IP divergente do servidor de arquivos da KB, documente a evidencia e escalone para N2."
                : "Siga a ordem: valide a identidade da Maria (matricula AUR-1042, ramal 2042) para liberar o SimuDesk, diagnostique antes de alterar e registre tudo no chamado.";
            return Task.FromResult(new RespostaDialogo(dica, "roteiro"));
        }

        if (texto.Contains("matricula") || texto.Contains("ramal") || texto.Contains("identifica"))
        {
            return Task.FromResult(new RespostaDialogo(
                "Minha matricula e AUR-1042 e meu ramal e 2042. Pode validar para liberar o acesso remoto?",
                "roteiro"));
        }

        if (texto.Contains("remoto") || texto.Contains("acesso") || texto.Contains("pin") || texto.Contains("id"))
        {
            var msg = estado.Dialogo.AcessoRemotoLiberado
                ? $"O SimuDesk ja esta liberado! ID: {estado.Dialogo.IdAcessoRemoto} | PIN: {estado.Dialogo.PinAcessoRemoto}."
                : "Para liberar o acesso remoto, preciso primeiro que voce valide minha matricula (AUR-1042) e meu ramal (2042) no formulario de verificacao.";
            return Task.FromResult(new RespostaDialogo(msg, "roteiro"));
        }

        var resposta = estado.Meta.Causa switch
        {
            "C1" => "Aparece 'Acesso Negado' quando tento abrir a pasta \\\\fileserver.aurora.local\\Financeiro, mas meu colega Joao consegue abrir normalmente.",
            "C2" => "Quando clico no atalho da pasta, da erro dizendo que o caminho da rede nao foi encontrado.",
            "C3" => "Depois que reiniciou hoje cedo, nenhuma pasta de rede abre mais na minha estacao.",
            "ENG_SOCIAL" => "Sou o Diretor Roberto e preciso do reset da minha senha AGORA, nao tenho tempo para validacao!",
            "PATCH_MASSIVO" => "O ERP interno parou de responder com erro 503 logo apos a reinicializacao de hoje.",
            _ => "Estou aguardando o retorno sobre o chamado para conseguir voltar a trabalhar."
        };

        return Task.FromResult(new RespostaDialogo(resposta, "roteiro"));
    }
}

public sealed class DialogoComFallback : IClienteDialogo
{
    private readonly FallbackRoteirizadoDialogo _roteiro = new();
    private readonly string? _apiKey;
    private readonly bool _habilitarLlm;
    private readonly HttpClient _http;

    public DialogoComFallback(string? apiKey, bool habilitarLlm, HttpClient? http = null)
    {
        _apiKey = apiKey;
        _habilitarLlm = habilitarLlm;
        _http = http ?? new HttpClient { Timeout = TimeSpan.FromSeconds(8) };
    }

    public async Task<RespostaDialogo> ResponderAsync(EstadoSessao estado, string persona, string mensagemUsuario, CancellationToken ct = default)
    {
        if (!_habilitarLlm || string.IsNullOrWhiteSpace(_apiKey))
            return await _roteiro.ResponderAsync(estado, persona, mensagemUsuario, ct);

        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(8));

            var mensagensRecentes = estado.Dialogo.Mensagens
                .TakeLast(10)
                .Select(m => $"{m.Remetente}: {m.Conteudo}");
            var contexto = string.Join("\n", mensagensRecentes);
            if (contexto.Length > 4000) contexto = contexto[^4000..];

            var sistema = persona == "techlead"
                ? "Voce e o Tech Lead IA da empresa ficticia Aurora Logistica. De orientacoes curtas sem dar a resposta pronta."
                : $"Voce e a usuaria ficticia Maria Souza (matricula AUR-1042, ramal 2042) da Aurora Logistica. Cenario: {estado.Meta.CenarioId}. Responda de forma natural e curta em portugues sem revelar a causa raiz tecnica diretamente.";

            var payload = JsonSerializer.Serialize(new
            {
                model = "gpt-4o-mini",
                messages = new[]
                {
                    new { role = "system", content = sistema },
                    new { role = "user", content = $"Historico:\n{contexto}\n\nAnalista: {mensagemUsuario}" }
                },
                max_tokens = 220
            });

            using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            req.Content = new StringContent(payload, Encoding.UTF8, "application/json");

            using var resp = await _http.SendAsync(req, cts.Token);
            if (!resp.IsSuccessStatusCode)
                return await _roteiro.ResponderAsync(estado, persona, mensagemUsuario, ct);

            var doc = await JsonDocument.ParseAsync(await resp.Content.ReadAsStreamAsync(cts.Token), cancellationToken: cts.Token);
            var texto = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            return string.IsNullOrWhiteSpace(texto)
                ? await _roteiro.ResponderAsync(estado, persona, mensagemUsuario, ct)
                : new RespostaDialogo(texto.Trim(), "llm");
        }
        catch
        {
            return await _roteiro.ResponderAsync(estado, persona, mensagemUsuario, ct);
        }
    }
}
