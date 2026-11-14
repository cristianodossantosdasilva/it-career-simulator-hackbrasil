using Simulador.Dominio;

namespace Simulador.Dialogo;

public sealed record RespostaDialogo(string Mensagem, bool AcessoRemotoLiberado, string Modo);

public interface IClienteDialogo
{
    Task<RespostaDialogo> ResponderAsync(EstadoSessao estado, string mensagemUsuario, CancellationToken ct = default);
}

public sealed class FallbackRoteirizadoDialogo : IClienteDialogo
{
    public Task<RespostaDialogo> ResponderAsync(EstadoSessao estado, string mensagemUsuario, CancellationToken ct = default)
    {
        var texto = mensagemUsuario.ToLowerInvariant();
        if (texto.Contains("remoto") || texto.Contains("acesso") || texto.Contains("pin") || texto.Contains("id"))
        {
            return Task.FromResult(new RespostaDialogo(
                "Claro! Pode acessar minha estacao pelo SimuDesk usando o ID SD-402-918 e o PIN 7391.",
                true,
                "roteirizado"));
        }

        var resposta = estado.Meta.Causa switch
        {
            "C1" => "Aparece 'Acesso Negado' quando tento abrir a pasta \\\\fileserver.aurora.local\\Financeiro, mas meu colega Joao consegue abrir normalmente.",
            "C2" => "Quando clico no atalho da pasta, da erro dizendo que o caminho da rede nao foi encontrado.",
            "C3" => "Depois que reiniciou hoje cedo, nenhuma pasta de rede abre mais na minha estacao.",
            _ => "Estou aguardando o retorno sobre o chamado para conseguir voltar a trabalhar."
        };

        return Task.FromResult(new RespostaDialogo(resposta, false, "roteirizado"));
    }
}
