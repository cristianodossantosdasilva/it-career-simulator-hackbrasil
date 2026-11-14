using System.Text.Json;

namespace Simulador.Dominio;

public sealed record Acao(string Tipo, IReadOnlyDictionary<string, JsonElement>? Dados = null)
{
    public string? ObterString(string chave)
    {
        if (Dados is null || !Dados.TryGetValue(chave, out var el)) return null;
        return el.ValueKind == JsonValueKind.String ? el.GetString() : null;
    }

    public bool ObterBool(string chave, bool padrao = false)
    {
        if (Dados is null || !Dados.TryGetValue(chave, out var el)) return padrao;
        return el.ValueKind is JsonValueKind.True or JsonValueKind.False ? el.GetBoolean() : padrao;
    }

    public IReadOnlyList<string> ObterListaStrings(string chave)
    {
        if (Dados is null || !Dados.TryGetValue(chave, out var el) || el.ValueKind != JsonValueKind.Array)
            return [];
        return el.EnumerateArray()
            .Where(x => x.ValueKind == JsonValueKind.String)
            .Select(x => x.GetString()!)
            .ToArray();
    }
}

public sealed record EnvelopeEvento(
    int Seq,
    string Tipo,
    IReadOnlyDictionary<string, object?> Dados,
    int MinutoSimulado);

public static class TabelaCustoMinutos
{
    public static int ObterCusto(string tipoAcao) => tipoAcao switch
    {
        "itsm.assumir_chamado" => 1,
        "itsm.classificar_chamado" => 1,
        "itsm.adicionar_nota" => 1,
        "itsm.escalonar_chamado" => 3,
        "itsm.resolver_chamado" => 2,
        "itsm.encerrar_chamado" => 1,
        "itsm.criar_problema" => 2,
        "itsm.vincular_problema" => 1,
        "itsm.registrar_causa_raiz" => 2,
        "itsm.resolver_problema" => 3,
        "dialogo.pedir_pista" => 1,
        "dialogo.verificar_identidade" => 1,
        "dialogo.validar_identidade" => 2,
        "dialogo.liberar_acesso_remoto" => 1,
        "dialogo.confirmar_com_usuario" => 2,
        "dialogo.chat" => 1,
        "estacao.elevar_privilegio" => 1,
        "estacao.reduzir_privilegio" => 1,
        "estacao.executar_comando" => 2,
        "estacao.adicionar_usuario_grupo" => 3,
        "estacao.reiniciar_servico" => 3,
        "estacao.desativar_firewall" => 2,
        "estacao.aplicar_correcao_dns_n2" => 5,
        "estacao.novo_logon_usuario" => 2,
        "estacao.ler_logs" => 2,
        "estacao.consultar_servico" => 1,
        "seguranca.consultar_politica" => 1,
        "seguranca.solicitar_token" => 2,
        "seguranca.recusar_reset" => 2,
        "seguranca.resetar_senha" => 1,
        _ => 1
    };
}
