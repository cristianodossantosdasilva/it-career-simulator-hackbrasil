using Simulador.Itsm;

namespace Simulador.Dominio;

public static class Projecao
{
    public static EstadoSessao Reconstruir(IReadOnlyList<EnvelopeEvento> eventos, ICatalogoCenarios catalogo)
    {
        if (eventos.Count == 0)
            throw new InvalidOperationException("Trilha de eventos vazia.");

        if (eventos[0].Seq != 1 || eventos[0].Tipo != "SessaoIniciada")
            throw new InvalidOperationException("Evento inicial deve ter seq 1 e tipo SessaoIniciada.");

        var inicio = eventos[0].Dados;
        var cenarioId = inicio["cenarioId"]?.ToString() ?? throw new InvalidOperationException("cenarioId ausente em SessaoIniciada.");
        var causa = inicio["causa"]?.ToString();
        var versao = inicio["versaoManifesto"]?.ToString() ?? throw new InvalidOperationException("versaoManifesto ausente em SessaoIniciada.");
        var semente = long.TryParse(inicio["semente"]?.ToString(), out var s) ? s : 0L;

        if (!catalogo.SuportaVersao(cenarioId, versao))
            throw new InvalidOperationException($"Versao de manifesto '{versao}' nao suportada para '{cenarioId}'.");

        var cenario = catalogo.Obter(cenarioId, versao, causa, semente);

        var seqEsperado = 1;
        var minutoAnterior = 0;
        foreach (var ev in eventos)
        {
            if (ev.Seq != seqEsperado)
                throw new InvalidOperationException($"Sequencia invalida: esperado {seqEsperado}, obtido {ev.Seq}.");
            if (ev.MinutoSimulado < minutoAnterior)
                throw new InvalidOperationException($"Minuto simulado decrescente no seq {ev.Seq}: {ev.MinutoSimulado} < {minutoAnterior}.");
            seqEsperado++;
            minutoAnterior = ev.MinutoSimulado;
        }

        // Reconstrucao deterministica a partir dos eventos persistidos
        var chamados = new List<Chamado>();
        var problemas = new List<Problema>();
        var estacao = cenario.EstacaoInicial;
        var dialogo = EstadoDialogo.Vazio;
        var numChamado = 1;
        var numProblema = 1;

        foreach (var ev in eventos.Skip(1))
        {
            switch (ev.Tipo)
            {
                case "ChamadoAberto":
                    chamados.Add(new Chamado(
                        ev.Dados["chamadoId"]?.ToString() ?? ItsmRegras.FormatarChamadoId(numChamado++),
                        ev.Dados["titulo"]?.ToString() ?? "",
                        ev.Dados["descricao"]?.ToString() ?? "",
                        ev.Dados["solicitante"]?.ToString() ?? "",
                        StatusChamado.Novo,
                        null, null, null, null,
                        Convert.ToInt32(ev.Dados["abertoEmMinuto"]),
                        null, null, false, null, null, null, []));
                    break;
                case "ChamadoAssumido":
                {
                    var id = ev.Dados["chamadoId"]!.ToString()!;
                    var idx = chamados.FindIndex(c => c.Id == id);
                    if (idx >= 0) chamados[idx] = chamados[idx] with { Status = StatusChamado.EmAtendimento, Responsavel = "analista", NivelAtendimento = chamados[idx].NivelAtendimento ?? "N1" };
                    break;
                }
                case "ChamadoClassificado":
                {
                    var id = ev.Dados["chamadoId"]!.ToString()!;
                    var idx = chamados.FindIndex(c => c.Id == id);
                    if (idx >= 0)
                    {
                        var urg = Enum.Parse<NivelUrgencia>(ev.Dados["urgencia"]!.ToString()!, true);
                        var imp = Enum.Parse<NivelImpacto>(ev.Dados["impacto"]!.ToString()!, true);
                        var pri = Enum.Parse<PrioridadeChamado>(ev.Dados["prioridade"]!.ToString()!, true);
                        chamados[idx] = chamados[idx] with
                        {
                            Categoria = ev.Dados["categoria"]?.ToString(),
                            Urgencia = urg,
                            Impacto = imp,
                            Prioridade = pri,
                            SlaAlvoMinuto = ev.Dados["slaAlvoMinuto"] is null ? null : Convert.ToInt32(ev.Dados["slaAlvoMinuto"])
                        };
                    }
                    break;
                }
                case "NotaChamadoAdicionada":
                {
                    var id = ev.Dados["chamadoId"]!.ToString()!;
                    var idx = chamados.FindIndex(c => c.Id == id);
                    if (idx >= 0)
                    {
                        var tipo = Enum.Parse<TipoNota>(ev.Dados["tipo"]!.ToString()!, true);
                        var nota = new NotaChamado(ev.Seq, tipo, "analista", ev.Dados["texto"]?.ToString() ?? "", ev.MinutoSimulado);
                        chamados[idx] = chamados[idx] with { Notas = [.. chamados[idx].Notas, nota] };
                    }
                    break;
                }
                case "ChamadoEscalonado":
                {
                    var id = ev.Dados["chamadoId"]!.ToString()!;
                    var idx = chamados.FindIndex(c => c.Id == id);
                    if (idx >= 0)
                    {
                        var nota = new NotaChamado(ev.Seq, TipoNota.Interna, "analista", ev.Dados["notaInterna"]?.ToString() ?? "", ev.MinutoSimulado);
                        chamados[idx] = chamados[idx] with { Status = StatusChamado.Escalonado, NivelAtendimento = "N2", Notas = [.. chamados[idx].Notas, nota] };
                    }
                    break;
                }
                case "ChamadoResolvido":
                {
                    var id = ev.Dados["chamadoId"]!.ToString()!;
                    var idx = chamados.FindIndex(c => c.Id == id);
                    if (idx >= 0)
                    {
                        var nota = new NotaChamado(ev.Seq, TipoNota.Publica, "analista", ev.Dados["notaPublica"]?.ToString() ?? "", ev.MinutoSimulado);
                        chamados[idx] = chamados[idx] with { Status = StatusChamado.Resolvido, ResolvidoEmMinuto = ev.MinutoSimulado, Notas = [.. chamados[idx].Notas, nota] };
                    }
                    break;
                }
                case "ChamadoEncerrado":
                {
                    var id = ev.Dados["chamadoId"]!.ToString()!;
                    var idx = chamados.FindIndex(c => c.Id == id);
                    if (idx >= 0) chamados[idx] = chamados[idx] with { Status = StatusChamado.Encerrado };
                    break;
                }
                case "SlaVencido":
                {
                    var id = ev.Dados["chamadoId"]!.ToString()!;
                    var idx = chamados.FindIndex(c => c.Id == id);
                    if (idx >= 0) chamados[idx] = chamados[idx] with { SlaVencido = true };
                    break;
                }
                case "ProblemaCriado":
                    problemas.Add(new Problema(ev.Dados["problemaId"]!.ToString()!, ev.Dados["titulo"]?.ToString() ?? "", null, false, []));
                    numProblema++;
                    break;
                case "ChamadoVinculadoAProblema":
                {
                    var prbId = ev.Dados["problemaId"]!.ToString()!;
                    var chId = ev.Dados["chamadoId"]!.ToString()!;
                    var pIdx = problemas.FindIndex(p => p.Id == prbId);
                    if (pIdx >= 0) problemas[pIdx] = problemas[pIdx] with { ChamadosVinculados = [.. problemas[pIdx].ChamadosVinculados, chId] };
                    var cIdx = chamados.FindIndex(c => c.Id == chId);
                    if (cIdx >= 0) chamados[cIdx] = chamados[cIdx] with { ProblemaId = prbId };
                    break;
                }
                case "CausaRaizRegistrada":
                {
                    var prbId = ev.Dados["problemaId"]!.ToString()!;
                    var pIdx = problemas.FindIndex(p => p.Id == prbId);
                    if (pIdx >= 0) problemas[pIdx] = problemas[pIdx] with { CausaRaiz = ev.Dados["causaRaiz"]?.ToString() };
                    break;
                }
                case "ProblemaResolvidoEmLote":
                {
                    var prbId = ev.Dados["problemaId"]!.ToString()!;
                    var notaTxt = ev.Dados["notaPublica"]?.ToString() ?? "";
                    var pIdx = problemas.FindIndex(p => p.Id == prbId);
                    if (pIdx >= 0)
                    {
                        foreach (var chId in problemas[pIdx].ChamadosVinculados)
                        {
                            var cIdx = chamados.FindIndex(c => c.Id == chId);
                            if (cIdx >= 0 && chamados[cIdx].Status is not (StatusChamado.Resolvido or StatusChamado.Encerrado))
                            {
                                var nota = new NotaChamado(ev.Seq, TipoNota.Publica, "analista", notaTxt, ev.MinutoSimulado);
                                chamados[cIdx] = chamados[cIdx] with { Status = StatusChamado.Resolvido, ResolvidoEmMinuto = ev.MinutoSimulado, Notas = [.. chamados[cIdx].Notas, nota] };
                            }
                        }
                        problemas[pIdx] = problemas[pIdx] with { Resolvido = true };
                    }
                    break;
                }
                case "PistaSolicitada":
                    dialogo = dialogo with { PistasSolicitadas = ev.Dados.TryGetValue("indice", out var idxP) ? Convert.ToInt32(idxP) : dialogo.PistasSolicitadas + 1 };
                    break;
                case "IdentidadeVerificada":
                    dialogo = dialogo with { IdentidadeValidada = true };
                    break;
                case "AcessoRemotoLiberado":
                    dialogo = dialogo with
                    {
                        AcessoRemotoLiberado = true,
                        IdAcessoRemoto = ev.Dados["id"]?.ToString(),
                        PinAcessoRemoto = ev.Dados.TryGetValue("pin", out var pinEl) ? pinEl?.ToString() : dialogo.PinAcessoRemoto
                    };
                    break;
                case "MensagemUsuarioEnviada":
                    dialogo = dialogo with
                    {
                        Mensagens = [.. dialogo.Mensagens, new MensagemDialogo(ev.Seq, "analista", ev.Dados["texto"]?.ToString() ?? "", ev.MinutoSimulado)]
                    };
                    break;
                case "MensagemPersonaRecebida":
                    dialogo = dialogo with
                    {
                        Mensagens = [.. dialogo.Mensagens, new MensagemDialogo(ev.Seq, ev.Dados["persona"]?.ToString() ?? "cliente", ev.Dados["texto"]?.ToString() ?? "", ev.MinutoSimulado)]
                    };
                    break;
                case "ComandoExecutado":
                {
                    var cmdTxt = ev.Dados["comando"]?.ToString()?.ToLowerInvariant() ?? "";
                    if (cmdTxt.StartsWith("ipconfig /flushdns") && estacao.DnsServidor.TryGetValue(cenario.HostAlvo, out var dns))
                    {
                        var novoCache = new Dictionary<string, string>(estacao.DnsCacheEstacao, StringComparer.OrdinalIgnoreCase)
                        {
                            [cenario.HostAlvo] = dns.Ip
                        };
                        estacao = estacao with { DnsCacheEstacao = novoCache };
                    }
                    break;
                }
                case "UsuarioConfirmouFuncionamento":
                    dialogo = dialogo with { UsuarioConfirmouFuncionamento = true };
                    break;
                case "PrivilegioAlterado":
                    estacao = estacao with { Privilegio = Enum.Parse<PrivilegioTerminal>(ev.Dados["privilegio"]!.ToString()!, true) };
                    break;
                case "UsuarioAdicionadoAoGrupo":
                {
                    var u = ev.Dados["usuario"]!.ToString()!;
                    var g = ev.Dados["grupo"]!.ToString()!;
                    var grupos = new Dictionary<string, IReadOnlyList<string>>(estacao.GruposPorUsuario, StringComparer.OrdinalIgnoreCase);
                    var atuais = grupos.TryGetValue(u, out var lista) ? lista.ToList() : [];
                    if (!atuais.Contains(g, StringComparer.OrdinalIgnoreCase)) atuais.Add(g);
                    grupos[u] = atuais;
                    estacao = estacao with { GruposPorUsuario = grupos };
                    break;
                }
                case "ServicoReiniciado":
                {
                    var sNome = ev.Dados["servico"]!.ToString()!;
                    estacao = estacao with { Servicos = estacao.Servicos.Select(s => s.Nome == sNome ? s with { Status = "Running" } : s).ToArray() };
                    break;
                }
                case "FirewallDesativado":
                    estacao = estacao with { FirewallAtivo = false };
                    break;
                case "AcaoPrejudicialRegistrada":
                    break;
                case "AcessoPastaRestabelecido":
                    estacao = estacao with { CompartilhamentoAcessivel = true };
                    break;
            }
        }

        return new EstadoSessao(
            new EstadoMeta(cenario.CenarioId, cenario.Causa, semente, cenario.Nivel, cenario.VersaoManifesto, eventos[^1].MinutoSimulado, eventos[^1].Seq),
            EstadoCarreira.Inicial(cenario.Nivel),
            new EstadoItsm(chamados, problemas, chamados.Count + 1, numProblema),
            dialogo,
            estacao);
    }
}
