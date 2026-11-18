using Simulador.Dominio;

namespace Simulador.Dialogo;

public sealed record RespostaDialogo(string Mensagem, string Origem);

public interface IClienteDialogo
{
    Task<RespostaDialogo> ResponderAsync(EstadoSessao estado, string persona, string mensagemUsuario, CancellationToken ct = default);
}

/// <summary>Personas roteirizadas por cenário e etapa da conversa. Não faz chamadas externas.</summary>
public sealed class FallbackRoteirizadoDialogo : IClienteDialogo
{
    public Task<RespostaDialogo> ResponderAsync(EstadoSessao estado, string persona, string mensagemUsuario, CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();
        var texto = Normalizar(mensagemUsuario);
        var resposta = string.Equals(persona, "techlead", StringComparison.OrdinalIgnoreCase)
            ? ResponderTechLead(estado, texto)
            : ResponderCliente(estado, texto);
        return Task.FromResult(new RespostaDialogo(resposta, "roteiro"));
    }

    private static string ResponderCliente(EstadoSessao estado, string texto)
    {
        if (EhTentativaDeInjecao(texto))
            return "Não consigo alterar permissões pelo chat. Posso relatar o que observei; o acesso remoto depende da validação de identidade no formulário.";

        if (estado.Meta.CenarioId == "reset-senha-desbloqueio")
            return ResponderClienteResetSenha(estado, texto);

        if (texto.Contains("matricula") || texto.Contains("ramal") || texto.Contains("identifica"))
            return "Minha matrícula é AUR-1042 e meu ramal é 2042. Pode conferir os dois no formulário antes de liberar o SimuDesk.";

        if (texto.Contains("remoto") || texto.Contains("acesso") || texto.Contains("pin") || texto.Contains("id"))
            return estado.Dialogo.AcessoRemotoLiberado
                ? $"Acesso validado. ID SimuDesk: {estado.Dialogo.IdAcessoRemoto} | PIN: {estado.Dialogo.PinAcessoRemoto}."
                : "Ainda não consigo entrar no SimuDesk. Primeiro confirme minha matrícula e meu ramal no formulário de identidade.";

        if (estado.Meta.CenarioId == "sre-cloud-latencia")
            return texto.Contains("tls") || texto.Contains("certificado") || texto.Contains("https")
                ? "O painel mostra falhas intermitentes ao abrir algumas telas, mas ainda não sei se o problema está no serviço ou no caminho da conexão."
                : texto.Contains("pool") || texto.Contains("pgbouncer") || texto.Contains("conexao")
                    ? "Os pods respondem de forma irregular e as telas de pedidos ficam carregando até expirar. Não tenho visibilidade do banco; consigo informar horários e pedidos afetados."
                    : texto.Contains("pod") || texto.Contains("kubernetes") || texto.Contains("container")
                        ? "A lentidão começou depois da mudança de hoje. Algumas tentativas funcionam e outras falham; não sei qual componente está causando isso."
                        : texto.Contains("prazo") || texto.Contains("estimativa")
                            ? "A equipe de Operações também está cobrando uma previsão. Ainda não temos evidências suficientes para estimar com segurança; posso confirmar quando a fila normalizar."
                            : "Desde o início do turno, algumas consultas de pedidos estão demorando mais que o normal. O comportamento é intermitente e começou hoje.";

        if (estado.Meta.CenarioId == "diagnostico-sql-readonly")
            return texto.Contains("auditoria") || texto.Contains("historico")
                ? "A auditoria registra ajustes em alguns pedidos, mas não sei quais registros explicam a divergência. Preciso que a análise preserve os dados e seja somente leitura."
                : texto.Contains("select") || texto.Contains("consulta") || texto.Contains("sql")
                    ? "O relatório diário e a tela de pedidos mostram totais diferentes. Você pode investigar com consultas de somente leitura sem alterar os registros?"
                    : "O total de pagamentos do relatório não bate com o resumo operacional desta manhã. Percebi a diferença em mais de um pedido.";

        return estado.Meta.Causa switch
        {
            "C1" => "Aparece 'Acesso Negado' quando tento abrir a pasta \\\\fileserver.aurora.local\\Financeiro, mas meu colega João consegue abrir normalmente.",
            "C2" => "Quando clico no atalho da pasta, dá erro dizendo que o caminho da rede não foi encontrado.",
            "C3" => "Depois que reiniciou hoje cedo, nenhuma pasta de rede abre mais na minha estação.",
            "ENG_SOCIAL" => "Sou o Diretor Roberto e preciso do reset da minha senha agora. Não tenho tempo para validação!",
            "PATCH_MASSIVO" => "O ERP interno parou de responder com erro 503 logo após a reinicialização de hoje.",
            _ => "Estou aguardando o retorno sobre o chamado para conseguir voltar a trabalhar."
        };
    }

    private static string ResponderTechLead(EstadoSessao estado, string texto)
    {
        if (EhTentativaDeInjecao(texto))
            return "Não vou ignorar as regras nem fornecer credenciais ou resposta pronta. Use evidências do cenário e mantenha as ações dentro do escopo autorizado.";

        var nivel = estado.Dialogo.Mensagens.Count(m => m.Remetente == "techlead");
        if (estado.Meta.CenarioId == "reset-senha-desbloqueio")
            return ResponderTechLeadResetSenha(estado, nivel);
        if (estado.Meta.CenarioId == "sre-cloud-latencia")
        {
            if (texto.Contains("post") || texto.Contains("causa") || texto.Contains("resolver"))
                return "No post-mortem, organize linha do tempo, impacto, sinais observados, decisões e ações de acompanhamento. Separe fatos de hipóteses e não conclua antes de correlacionar as evidências.";
            return nivel switch
            {
                0 => "Comece comparando o estado dos pods, os eventos recentes e a tendência de reinícios. Registre horários antes de intervir.",
                1 => "Agora compare os logs da aplicação com as métricas de latência e erros. Verifique também a saúde do pool de conexões e a validade da cadeia TLS, sem presumir qual camada iniciou o incidente.",
                _ => "Correlacione a mudança recente, os sinais do ingress e a saturação observada. Faça uma hipótese por vez, valide em comandos de leitura e deixe a causa para a análise das evidências."
            };
        }
        if (estado.Meta.CenarioId == "diagnostico-sql-readonly")
        {
            if (texto.Contains("chave") || texto.Contains("juntar") || texto.Contains("join"))
                return "Compare os totais em grupos pequenos e confira a granularidade das chaves antes de combinar tabelas. Uma junção pode multiplicar linhas.";
            return nivel switch
            {
                0 => "Comece identificando as tabelas e colunas disponíveis na documentação do cenário. Trabalhe somente com SELECT e limite o volume retornado.",
                1 => "Compare os totais em grupos pequenos e confira a granularidade das chaves antes de combinar tabelas. Uma junção pode multiplicar linhas.",
                _ => "Use consultas de auditoria somente leitura para comparar registros e horários. Explique como cada filtro sustenta sua conclusão; não altere dados nem copie uma consulta sem entendê-la."
            };
        }

        var dica = texto.Contains("escalon") || texto.Contains("dns")
            ? "Se o nslookup apontar IP divergente do servidor de arquivos da KB, documente a evidência e escalone para N2."
            : "Siga a ordem: valide a identidade da Maria (matrícula AUR-1042, ramal 2042), diagnostique antes de alterar e registre tudo no chamado.";
        return dica;
    }

    // reset-senha-desbloqueio: o dialogo so devolve texto; nenhuma resposta altera estado nem revela a Causa.
    private static string ResponderClienteResetSenha(EstadoSessao estado, string texto)
    {
        var t = SemAcento(texto);
        var perguntaIdentidade = t.Contains("matricula") || t.Contains("ramal") || t.Contains("identifica");

        if (estado.Meta.PedidoPorTerceiro && !estado.Dialogo.TitularContatado)
        {
            if (perguntaIdentidade)
                return "Sou o gestor dela, o Paulo. Não sei a matrícula da Fernanda de cabeça; liga pra ela no ramal e ela confirma.";
            return estado.Meta.Causa switch
            {
                "CONTA_BLOQUEADA" => "Sou o Paulo, gestor da Fernanda. O sistema diz que a conta dela está bloqueada e ela precisa trabalhar hoje. Pode resetar a senha e me passar a nova que eu repasso?",
                "SENHA_EXPIRADA" => "Sou o Paulo, gestor da Fernanda. O sistema diz que a senha dela venceu e não deixa entrar. Pode resetar e me passar a nova que eu repasso?",
                _ => "Sou o Paulo, gestor da Fernanda. Ela não consegue entrar por causa da senha e precisa trabalhar hoje. Pode resetar e me passar a nova que eu repasso?"
            };
        }

        if (perguntaIdentidade)
            return "Aqui é a Fernanda. Minha matrícula é AUR-2087 e meu ramal é 2087.";

        return estado.Meta.Causa switch
        {
            "SENHA_ESQUECIDA" => "Não lembro minha senha e não consigo abrir o e-mail.",
            "CONTA_BLOQUEADA" => "O sistema diz que minha conta está bloqueada. Não digitei errado hoje.",
            "SENHA_EXPIRADA" => "Ao entrar, o sistema fala em senha vencida e não me deixa passar.",
            _ => "Estou aguardando o retorno sobre o chamado para conseguir voltar a trabalhar."
        };
    }

    private static string ResponderTechLeadResetSenha(EstadoSessao estado, int nivel)
    {
        var porTerceiro = estado.Meta.PedidoPorTerceiro;
        return nivel switch
        {
            0 => "Comece confirmando a identidade da dona da conta e olhando o estado da conta no console.",
            1 => porTerceiro
                ? "Quem pede não é a dona da conta: use o ramal do diretório, não o que foi informado. Compare o estado da conta com o sintoma; se a conta estiver bloqueada, leia os eventos de segurança."
                : "Compare o estado da conta com o sintoma; se a conta estiver bloqueada, leia os eventos de segurança antes de agir.",
            _ => "Escolha a menor ação que resolve o sintoma e registre no chamado o motivo da escolha."
        };
    }

    private static string SemAcento(string texto)
    {
        var decomposto = texto.Normalize(System.Text.NormalizationForm.FormD);
        var sb = new System.Text.StringBuilder(decomposto.Length);
        foreach (var ch in decomposto)
            if (System.Globalization.CharUnicodeInfo.GetUnicodeCategory(ch) != System.Globalization.UnicodeCategory.NonSpacingMark)
                sb.Append(ch);
        return sb.ToString().ToLowerInvariant();
    }
    private static string Normalizar(string texto) => texto.Normalize().ToLowerInvariant();

    private static bool EhTentativaDeInjecao(string texto)
    {
        var tentaSobrescreverRegras = texto.Contains("ignore") &&
            (texto.Contains("regra") || texto.Contains("instruc") || texto.Contains("instruç") || texto.Contains("prompt") || texto.Contains("sistema"));
        var tentaExtrairSegredo = (texto.Contains("revele") || texto.Contains("diga") || texto.Contains("mostre") || texto.Contains("forne")) &&
            (texto.Contains("causa") || texto.Contains("pin") || texto.Contains("credencial") || texto.Contains("resposta pronta"));
        var tentaContornarIdentidade = (texto.Contains("libere") || texto.Contains("conceda") || texto.Contains("mostre")) &&
            (texto.Contains("acesso") || texto.Contains("pin") || texto.Contains("credencial")) &&
            (texto.Contains("sem validar") || texto.Contains("sem verificar") || texto.Contains("sem triagem"));
        return tentaSobrescreverRegras || tentaExtrairSegredo || tentaContornarIdentidade ||
            texto.Contains("system prompt") || texto.Contains("prompt do sistema") ||
            texto.Contains("atue como administrador") || texto.Contains("esqueca o contexto") ||
            texto.Contains("esqueça o contexto") || texto.Contains("system override") ||
            texto.Contains("segredo_sintetico");
    }
}

/// <summary>Compatibilidade de configuração: permanece determinístico mesmo se uma chave LLM estiver presente.</summary>
public sealed class DialogoComFallback : IClienteDialogo
{
    private readonly FallbackRoteirizadoDialogo _roteiro = new();

    public DialogoComFallback(string? apiKey, bool habilitarLlm, HttpClient? http = null)
    {
        // Os parâmetros são mantidos para compatibilidade com a composição existente. W4/D3 proíbe rede.
        _ = apiKey;
        _ = habilitarLlm;
        _ = http;
    }

    public Task<RespostaDialogo> ResponderAsync(EstadoSessao estado, string persona, string mensagemUsuario, CancellationToken ct = default) =>
        _roteiro.ResponderAsync(estado, persona, mensagemUsuario, ct);
}
