using System.Globalization;
using Simulador.Itsm;

namespace Simulador.Dominio;

public sealed record ResultadoAplicacao(
    EstadoSessao NovoEstado,
    IReadOnlyList<EnvelopeEvento> Eventos);

public static class Motor
{
    private sealed record LinhaPedido(string Id, decimal Total);
    private sealed record LinhaPagamento(string Id, string PedidoId, decimal Valor, string Status);

    private static readonly IReadOnlyList<LinhaPedido> DatasetPedidos = Array.AsReadOnly(new[]
    {
        new LinhaPedido("PED-1001", 1200m), new LinhaPedido("PED-1002", 450m), new LinhaPedido("PED-1003", 800m)
    });
    private static readonly IReadOnlyList<LinhaPagamento> DatasetPagamentos = Array.AsReadOnly(new[]
    {
        new LinhaPagamento("PAG-1", "PED-1001", 1200m, "CONFIRMADO"),
        new LinhaPagamento("PAG-2", "PED-1002", 450m, "CONFIRMADO"),
        new LinhaPagamento("PAG-3", "PED-1002", 450m, "DUPLICADO")
    });
    private static string FormatarMoeda(decimal valor) => valor.ToString("N2", CultureInfo.GetCultureInfo("pt-BR"));

    public static ResultadoAplicacao Iniciar(DefinicaoCenario cenario, long semente = 0)
    {
        var eventos = new List<EnvelopeEvento>
        {
            new(1, "SessaoIniciada", new Dictionary<string, object?>
            {
                ["cenarioId"] = cenario.CenarioId,
                ["causa"] = cenario.Causa,
                ["semente"] = semente.ToString(),
                ["nivel"] = cenario.Nivel,
                ["versaoManifesto"] = cenario.VersaoManifesto
            }, 0)
        };

        var seq = 2;
        var num = 1;
        foreach (var ch in cenario.ChamadosIniciais)
        {
            eventos.Add(new EnvelopeEvento(seq++, "ChamadoAberto", new Dictionary<string, object?>
            {
                ["chamadoId"] = ItsmRegras.FormatarChamadoId(num++),
                ["titulo"] = ch.Titulo,
                ["descricao"] = ch.Descricao,
                ["solicitante"] = ch.Solicitante,
                ["abertoEmMinuto"] = ch.AbertoEmMinuto,
                ["ehPrincipal"] = ch.EhPrincipal
            }, 0));
        }

        var estadoInicial = AplicarEventosIniciais(EstadoSessao.Vazio, eventos, cenario, semente);
        return new ResultadoAplicacao(estadoInicial, eventos);
    }

    public static ResultadoAplicacao Aplicar(EstadoSessao estado, Acao acao, DefinicaoCenario cenario)
    {
        var seqAtual = estado.Meta.UltimoSeq;
        var custo = TabelaCustoMinutos.ObterCusto(acao.Tipo);
        var minutoDestino = estado.Meta.MinutoSimulado + custo;
        var gerados = new List<EnvelopeEvento>();

        ResultadoAplicacao Rejeitar(string motivo)
        {
            var ev = new EnvelopeEvento(seqAtual + 1, "AcaoRejeitada", new Dictionary<string, object?>
            {
                ["acaoTipo"] = acao.Tipo,
                ["motivo"] = motivo
            }, estado.Meta.MinutoSimulado); // Rejeicoes custam 0 minutos
            return new ResultadoAplicacao(
                estado with { Meta = estado.Meta with { UltimoSeq = ev.Seq } },
                [ev]);
        }

        var novo = estado;

        switch (acao.Tipo)
        {
            case "itsm.assumir_chamado":
            {
                var id = acao.ObterString("chamadoId");
                if (string.IsNullOrWhiteSpace(id)) return Rejeitar("chamadoId obrigatorio.");
                var res = ItsmRegras.Assumir(novo.Itsm, id, "analista");
                if (!res.Sucesso) return Rejeitar(res.MotivoRejeicao!);
                novo = novo with { Itsm = res.NovoEstado };
                gerados.Add(new(++seqAtual, "ChamadoAssumido", new Dictionary<string, object?>
                {
                    ["chamadoId"] = id
                }, minutoDestino));
                break;
            }
            case "itsm.classificar_chamado":
            {
                var id = acao.ObterString("chamadoId");
                var cat = acao.ObterString("categoria");
                if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(cat))
                    return Rejeitar("chamadoId e categoria obrigatorios.");
                if (!Enum.TryParse<NivelUrgencia>(acao.ObterString("urgencia"), true, out var urg))
                    return Rejeitar("urgencia invalida (Baixa, Media, Alta, Critica).");
                if (!Enum.TryParse<NivelImpacto>(acao.ObterString("impacto"), true, out var imp))
                    return Rejeitar("impacto invalido (Baixo, Medio, Alto, Generalizado).");

                var res = ItsmRegras.Classificar(novo.Itsm, id, cat, urg, imp);
                if (!res.Sucesso) return Rejeitar(res.MotivoRejeicao!);
                novo = novo with { Itsm = res.NovoEstado };
                var ch = novo.Itsm.ObterChamado(id)!;
                gerados.Add(new(++seqAtual, "ChamadoClassificado", new Dictionary<string, object?>
                {
                    ["chamadoId"] = ch.Id,
                    ["categoria"] = ch.Categoria,
                    ["urgencia"] = urg.ToString(),
                    ["impacto"] = imp.ToString(),
                    ["prioridade"] = ch.Prioridade?.ToString(),
                    ["slaAlvoMinuto"] = ch.SlaAlvoMinuto
                }, minutoDestino));
                break;
            }
            case "itsm.adicionar_nota":
            {
                var id = acao.ObterString("chamadoId");
                var texto = acao.ObterString("texto");
                if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(texto))
                    return Rejeitar("chamadoId e texto obrigatorios.");
                var tipo = string.Equals(acao.ObterString("tipo"), "Publica", StringComparison.OrdinalIgnoreCase)
                    ? TipoNota.Publica : TipoNota.Interna;
                var nextSeq = seqAtual + 1;
                var res = ItsmRegras.AdicionarNota(novo.Itsm, id, nextSeq, tipo, "analista", texto, minutoDestino);
                if (!res.Sucesso) return Rejeitar(res.MotivoRejeicao!);
                novo = novo with { Itsm = res.NovoEstado };
                seqAtual = nextSeq;
                gerados.Add(new(seqAtual, "NotaChamadoAdicionada", new Dictionary<string, object?>
                {
                    ["chamadoId"] = id,
                    ["tipo"] = tipo.ToString(),
                    ["texto"] = texto.Trim()
                }, minutoDestino));
                break;
            }
            case "itsm.escalonar_chamado":
            {
                var id = acao.ObterString("chamadoId");
                var destino = acao.ObterString("destino") ?? "N2";
                var nota = acao.ObterString("notaInterna");
                if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(nota))
                    return Rejeitar("chamadoId e notaInterna obrigatorios.");
                var nextSeq = seqAtual + 1;
                var res = ItsmRegras.Escalonar(novo.Itsm, id, nextSeq, destino, "analista", nota, minutoDestino);
                if (!res.Sucesso) return Rejeitar(res.MotivoRejeicao!);
                novo = novo with { Itsm = res.NovoEstado };
                seqAtual = nextSeq;
                gerados.Add(new(seqAtual, "ChamadoEscalonado", new Dictionary<string, object?>
                {
                    ["chamadoId"] = id,
                    ["destino"] = destino,
                    ["notaInterna"] = nota.Trim()
                }, minutoDestino));

                if (cenario.Causa == "C2" && novo.Estacao.DnsServidor.TryGetValue(cenario.HostAlvo, out var dnsAtual) &&
                    !string.Equals(dnsAtual.Ip, dnsAtual.IpEsperado, StringComparison.OrdinalIgnoreCase))
                {
                    var novoDns = new Dictionary<string, RegistroDns>(novo.Estacao.DnsServidor, StringComparer.OrdinalIgnoreCase)
                    {
                        [cenario.HostAlvo] = dnsAtual with { Ip = dnsAtual.IpEsperado }
                    };
                    novo = novo with { Estacao = novo.Estacao with { DnsServidor = novoDns } };
                    gerados.Add(new(++seqAtual, "DnsRegistroCorrigido", new Dictionary<string, object?>
                    {
                        ["registro"] = cenario.HostAlvo,
                        ["de"] = dnsAtual.Ip,
                        ["para"] = dnsAtual.IpEsperado,
                        ["origem"] = "n2_virtual",
                        ["escalonamentoSeq"] = seqAtual - 1
                    }, minutoDestino));
                }
                break;
            }
            case "itsm.resolver_chamado":
            {
                var id = acao.ObterString("chamadoId");
                var nota = acao.ObterString("notaPublica");
                if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(nota))
                    return Rejeitar("chamadoId e notaPublica obrigatorios.");
                var chAtual = novo.Itsm.ObterChamado(id);
                if (chAtual is not null && string.IsNullOrWhiteSpace(chAtual.Categoria) && cenario.CenarioId == "triagem-engenharia-social")
                {
                    var classRes = ItsmRegras.Classificar(novo.Itsm, id, "Seguranca", NivelUrgencia.Alta, NivelImpacto.Medio);
                    if (classRes.Sucesso)
                    {
                        novo = novo with { Itsm = classRes.NovoEstado };
                        var chClass = novo.Itsm.ObterChamado(id)!;
                        gerados.Add(new(++seqAtual, "ChamadoClassificado", new Dictionary<string, object?>
                        {
                            ["chamadoId"] = chClass.Id,
                            ["categoria"] = chClass.Categoria,
                            ["urgencia"] = "Alta",
                            ["impacto"] = "Medio",
                            ["prioridade"] = chClass.Prioridade.ToString(),
                            ["slaAlvoMinuto"] = chClass.SlaAlvoMinuto
                        }, minutoDestino));
                    }
                }
                var nextSeq = seqAtual + 1;
                var res = ItsmRegras.Resolver(novo.Itsm, id, nextSeq, "analista", nota, minutoDestino);
                if (!res.Sucesso) return Rejeitar(res.MotivoRejeicao!);
                novo = novo with { Itsm = res.NovoEstado };
                seqAtual = nextSeq;
                var ch = novo.Itsm.ObterChamado(id)!;
                gerados.Add(new(seqAtual, "ChamadoResolvido", new Dictionary<string, object?>
                {
                    ["chamadoId"] = id,
                    ["notaPublica"] = nota.Trim(),
                    ["dentroDoSla"] = !ch.SlaVencido
                }, minutoDestino));
                break;
            }
            case "itsm.encerrar_chamado":
            {
                var id = acao.ObterString("chamadoId");
                if (string.IsNullOrWhiteSpace(id)) return Rejeitar("chamadoId obrigatorio.");
                var res = ItsmRegras.Encerrar(novo.Itsm, id);
                if (!res.Sucesso) return Rejeitar(res.MotivoRejeicao!);
                novo = novo with { Itsm = res.NovoEstado };
                gerados.Add(new(++seqAtual, "ChamadoEncerrado", new Dictionary<string, object?>
                {
                    ["chamadoId"] = id
                }, minutoDestino));
                break;
            }
            case "itsm.criar_problema":
            {
                var titulo = acao.ObterString("titulo");
                if (string.IsNullOrWhiteSpace(titulo)) return Rejeitar("titulo obrigatorio.");
                var (res, prbId) = ItsmRegras.CriarProblema(novo.Itsm, titulo);
                if (!res.Sucesso) return Rejeitar(res.MotivoRejeicao!);
                novo = novo with { Itsm = res.NovoEstado };
                gerados.Add(new(++seqAtual, "ProblemaCriado", new Dictionary<string, object?>
                {
                    ["problemaId"] = prbId,
                    ["titulo"] = titulo.Trim()
                }, minutoDestino));
                break;
            }
            case "itsm.vincular_problema":
            {
                var prbId = acao.ObterString("problemaId");
                var chId = acao.ObterString("chamadoId");
                if (string.IsNullOrWhiteSpace(prbId) || string.IsNullOrWhiteSpace(chId))
                    return Rejeitar("problemaId e chamadoId obrigatorios.");
                var res = ItsmRegras.VincularChamadoAProblema(novo.Itsm, prbId, chId);
                if (!res.Sucesso) return Rejeitar(res.MotivoRejeicao!);
                novo = novo with { Itsm = res.NovoEstado };
                gerados.Add(new(++seqAtual, "ChamadoVinculadoAProblema", new Dictionary<string, object?>
                {
                    ["problemaId"] = prbId,
                    ["chamadoId"] = chId
                }, minutoDestino));
                break;
            }
            case "itsm.registrar_causa_raiz":
            {
                var prbId = acao.ObterString("problemaId");
                var cr = acao.ObterString("causaRaiz");
                if (string.IsNullOrWhiteSpace(prbId) || string.IsNullOrWhiteSpace(cr))
                    return Rejeitar("problemaId e causaRaiz obrigatorios.");
                var res = ItsmRegras.RegistrarCausaRaiz(novo.Itsm, prbId, cr);
                if (!res.Sucesso) return Rejeitar(res.MotivoRejeicao!);
                novo = novo with { Itsm = res.NovoEstado };
                gerados.Add(new(++seqAtual, "CausaRaizRegistrada", new Dictionary<string, object?>
                {
                    ["problemaId"] = prbId,
                    ["causaRaiz"] = cr.Trim()
                }, minutoDestino));
                break;
            }
            case "itsm.resolver_problema":
            {
                var prbId = acao.ObterString("problemaId");
                var nota = acao.ObterString("notaPublica");
                if (string.IsNullOrWhiteSpace(prbId) || string.IsNullOrWhiteSpace(nota))
                    return Rejeitar("problemaId e notaPublica obrigatorios.");
                var nextSeq = seqAtual + 1;
                var res = ItsmRegras.ResolverChamadosDoProblema(novo.Itsm, prbId, nextSeq, "analista", nota, minutoDestino);
                if (!res.Sucesso) return Rejeitar(res.MotivoRejeicao!);
                novo = novo with { Itsm = res.NovoEstado };
                seqAtual = nextSeq;
                gerados.Add(new(seqAtual, "ProblemaResolvidoEmLote", new Dictionary<string, object?>
                {
                    ["problemaId"] = prbId,
                    ["notaPublica"] = nota.Trim()
                }, minutoDestino));
                break;
            }
            case "dialogo.pedir_pista":
            {
                if (novo.Dialogo.PistasSolicitadas >= PistasPorCenario.Maximo)
                    return Rejeitar("pistas_esgotadas");

                var indice = novo.Dialogo.PistasSolicitadas + 1;
                var textoPista = PistasPorCenario.Obter(cenario.CenarioId, cenario.Causa, novo.Dialogo.PistasSolicitadas);
                novo = novo with { Dialogo = novo.Dialogo with { PistasSolicitadas = indice } };
                gerados.Add(new(++seqAtual, "PistaSolicitada", new Dictionary<string, object?>
                {
                    ["indice"] = indice,
                    ["texto"] = textoPista,
                    ["origem"] = "roteiro"
                }, minutoDestino));
                break;
            }
            case "dialogo.verificar_identidade":
            {
                var principal = novo.Itsm.Chamados.FirstOrDefault();
                if (principal is null || principal.Status != StatusChamado.EmAtendimento)
                    return Rejeitar("O chamado principal precisa estar EmAtendimento pelo aluno para verificar identidade.");
                if (novo.Dialogo.AcessoRemotoLiberado)
                    return Rejeitar("O acesso remoto ja foi liberado nesta sessao.");

                var matricula = acao.ObterString("matricula")?.Trim();
                var ramal = acao.ObterString("ramal")?.Trim();
                if (string.IsNullOrWhiteSpace(matricula) || string.IsNullOrWhiteSpace(ramal))
                    return Rejeitar("matricula e ramal sao obrigatorios.");

                var titular = cenario.Titular;
                var matriculaEsperada = titular?.Matricula ?? "AUR-1042";
                var ramalEsperado = titular?.Ramal ?? "2042";

                if (titular is not null && cenario.PedidoPorTerceiro && !novo.Dialogo.TitularContatado)
                {
                    // Pedido feito por terceiro: a identidade so vale depois do contato com a titular pelo canal cadastrado.
                    gerados.Add(new(++seqAtual, "IdentidadeNaoConfere", new Dictionary<string, object?>
                    {
                        ["tentativaMatricula"] = matricula,
                        ["tentativaRamal"] = ramal,
                        ["motivo"] = "solicitante_terceiro_sem_contato_com_titular"
                    }, minutoDestino));
                }
                else if (titular is not null
                    && string.Equals(matricula, matriculaEsperada, StringComparison.OrdinalIgnoreCase) && ramal == ramalEsperado)
                {
                    // Cenarios com Titular nunca liberam acesso remoto: a acao e feita pelo console.
                    novo = novo with { Dialogo = novo.Dialogo with { IdentidadeValidada = true } };
                    gerados.Add(new(++seqAtual, "IdentidadeVerificada", new Dictionary<string, object?>
                    {
                        ["usuario"] = cenario.UsuarioAlvo,
                        ["matricula"] = matricula
                    }, minutoDestino));
                }
                else if (titular is null
                    && string.Equals(matricula, matriculaEsperada, StringComparison.OrdinalIgnoreCase) && ramal == ramalEsperado)
                {
                    var (idRemoto, pinRemoto) = GerarCredenciaisSimuDesk(novo.Meta.Semente);
                    novo = novo with
                    {
                        Dialogo = novo.Dialogo with
                        {
                            IdentidadeValidada = true,
                            AcessoRemotoLiberado = true,
                            IdAcessoRemoto = idRemoto,
                            PinAcessoRemoto = pinRemoto
                        }
                    };
                    gerados.Add(new(++seqAtual, "IdentidadeVerificada", new Dictionary<string, object?>
                    {
                        ["usuario"] = cenario.UsuarioAlvo,
                        ["matricula"] = matricula
                    }, minutoDestino));
                    gerados.Add(new(++seqAtual, "AcessoRemotoLiberado", new Dictionary<string, object?>
                    {
                        ["id"] = idRemoto,
                        ["pin"] = pinRemoto
                    }, minutoDestino));
                }
                else
                {
                    gerados.Add(new(++seqAtual, "IdentidadeNaoConfere", new Dictionary<string, object?>
                    {
                        ["tentativaMatricula"] = matricula,
                        ["tentativaRamal"] = ramal
                    }, minutoDestino));
                }
                break;
            }
            case "dialogo.liberar_acesso_remoto":
            {
                var (idRemoto, pinRemoto) = GerarCredenciaisSimuDesk(novo.Meta.Semente);
                novo = novo with
                {
                    Dialogo = novo.Dialogo with
                    {
                        AcessoRemotoLiberado = true,
                        IdAcessoRemoto = idRemoto,
                        PinAcessoRemoto = pinRemoto
                    }
                };
                gerados.Add(new(++seqAtual, "AcessoRemotoLiberado", new Dictionary<string, object?>
                {
                    ["id"] = idRemoto,
                    ["pin"] = pinRemoto
                }, minutoDestino));
                break;
            }
            case "dialogo.confirmar_com_usuario":
            {
                if (!novo.Estacao.CompartilhamentoAcessivel)
                    return Rejeitar("O acesso a pasta ainda nao foi restabelecido na estacao.");
                novo = novo with { Dialogo = novo.Dialogo with { UsuarioConfirmouFuncionamento = true } };
                gerados.Add(new(++seqAtual, "UsuarioConfirmouFuncionamento", new Dictionary<string, object?>
                {
                    ["usuario"] = cenario.UsuarioAlvo
                }, minutoDestino));
                break;
            }
            case "estacao.elevar_privilegio":
            {
                novo = novo with { Estacao = novo.Estacao with { Privilegio = PrivilegioTerminal.Elevado } };
                gerados.Add(new(++seqAtual, "PrivilegioAlterado", new Dictionary<string, object?>
                {
                    ["privilegio"] = "Elevado"
                }, minutoDestino));
                break;
            }
            case "estacao.reduzir_privilegio":
            {
                novo = novo with { Estacao = novo.Estacao with { Privilegio = PrivilegioTerminal.UsuarioPadrao } };
                gerados.Add(new(++seqAtual, "PrivilegioAlterado", new Dictionary<string, object?>
                {
                    ["privilegio"] = "UsuarioPadrao"
                }, minutoDestino));
                break;
            }
            case "estacao.executar_comando":
            {
                var cmd = acao.ObterString("comando")?.Trim();
                if (string.IsNullOrWhiteSpace(cmd)) return Rejeitar("comando obrigatorio.");
                var cmdNormalizado = cmd.ToLowerInvariant();
                if (cenario.CenarioId == "diagnostico-sql-readonly" && !EhConsultaSqlPermitida(cmd))
                {
                    gerados.Add(new(++seqAtual, "AcaoPrejudicialRegistrada", new Dictionary<string, object?>
                    {
                        ["categoria"] = "sql_seguranca",
                        ["comando"] = cmd,
                        ["motivo"] = "Tentativa de escrita ou SQL injection bloqueada pelo console somente leitura."
                    }, minutoDestino));
                    gerados.Add(new(++seqAtual, "ComandoNaoSuportado", new Dictionary<string, object?>
                    {
                        ["comando"] = cmd,
                        ["saida"] = "BLOQUEADO: Console SQL opera estritamente em modo SOMENTE LEITURA (SELECT/EXPLAIN). Escrita, DDL ou multi-statement (;) nao sao permitidos."
                    }, minutoDestino));
                    break;
                }
                var suportado = novo.Estacao.ComandosSuportados.Any(c =>
                    cmdNormalizado.StartsWith(c.ToLowerInvariant(), StringComparison.Ordinal));
                if (!suportado)
                {
                    gerados.Add(new(++seqAtual, "ComandoNaoSuportado", new Dictionary<string, object?>
                    {
                        ["comando"] = cmd,
                        ["saida"] = $"'{cmd}' nao faz parte dos comandos declarados para este cenario."
                    }, minutoDestino));
                    break;
                }

                var escala = ComandosPorEscala.TentarExecutar(novo, cmd, cenario);
                if (escala is not null)
                {
                    novo = escala.NovoEstado;
                    gerados.Add(new(++seqAtual, "ComandoExecutado", new Dictionary<string, object?>
                    {
                        ["comando"] = cmd,
                        ["privilegio"] = novo.Estacao.Privilegio.ToString(),
                        ["saida"] = escala.Saida
                    }, minutoDestino));
                    foreach (var ev in escala.Eventos)
                        gerados.Add(new(++seqAtual, ev.Tipo, ev.Dados, minutoDestino));
                    break;
                }

                var (estacaoAtualizada, saida, acessoRestabelecido, eventoExtra) = ExecutarComandoEstacao(novo.Estacao, cmd, cenario);
                novo = novo with { Estacao = estacaoAtualizada };
                gerados.Add(new(++seqAtual, "ComandoExecutado", new Dictionary<string, object?>
                {
                    ["comando"] = cmd,
                    ["privilegio"] = novo.Estacao.Privilegio.ToString(),
                    ["saida"] = saida
                }, minutoDestino));

                if (eventoExtra is not null)
                {
                    gerados.Add(new(++seqAtual, eventoExtra.Value.Tipo, eventoExtra.Value.Dados, minutoDestino));
                }

                if (acessoRestabelecido)
                {
                    gerados.Add(new(++seqAtual, "AcessoPastaRestabelecido", new Dictionary<string, object?>
                    {
                        ["usuario"] = cenario.UsuarioAlvo,
                        ["causa"] = cenario.Causa
                    }, minutoDestino));
                }
                break;
            }
            case "estacao.adicionar_usuario_grupo":
            {
                if (novo.Estacao.Privilegio != PrivilegioTerminal.Elevado)
                    return Rejeitar("Alterar grupos no diretorio exige privilegio Elevado.");
                var usuario = acao.ObterString("usuario") ?? cenario.UsuarioAlvo;
                var grupo = acao.ObterString("grupo") ?? cenario.GrupoAlvoCompartilhamento;
                var grupos = new Dictionary<string, IReadOnlyList<string>>(novo.Estacao.GruposPorUsuario, StringComparer.OrdinalIgnoreCase);
                var atuais = grupos.TryGetValue(usuario, out var g) ? g.ToList() : new List<string>();
                if (!atuais.Contains(grupo, StringComparer.OrdinalIgnoreCase))
                    atuais.Add(grupo);
                grupos[usuario] = atuais;

                var estacaoDepois = novo.Estacao with { GruposPorUsuario = grupos };
                var restabelecido = !novo.Estacao.CompartilhamentoAcessivel && VerificarCompartilhamentoOk(estacaoDepois, cenario);
                if (restabelecido)
                    estacaoDepois = estacaoDepois with { CompartilhamentoAcessivel = true };

                novo = novo with { Estacao = estacaoDepois };
                gerados.Add(new(++seqAtual, "UsuarioAdicionadoAoGrupo", new Dictionary<string, object?>
                {
                    ["usuario"] = usuario,
                    ["grupo"] = grupo
                }, minutoDestino));

                if (restabelecido)
                {
                    gerados.Add(new(++seqAtual, "AcessoPastaRestabelecido", new Dictionary<string, object?>
                    {
                        ["usuario"] = usuario,
                        ["causa"] = cenario.Causa
                    }, minutoDestino));
                }
                break;
            }
            case "estacao.reiniciar_servico":
            {
                if (novo.Estacao.Privilegio != PrivilegioTerminal.Elevado)
                    return Rejeitar("Reiniciar servicos exige privilegio Elevado.");
                var servicoNome = acao.ObterString("servico");
                if (string.IsNullOrWhiteSpace(servicoNome)) return Rejeitar("servico obrigatorio.");
                var atualizado = novo.Estacao.Servicos.Select(s =>
                    string.Equals(s.Nome, servicoNome, StringComparison.OrdinalIgnoreCase)
                        ? s with { Status = "Running" } : s).ToArray();
                var estacaoDepois = novo.Estacao with { Servicos = atualizado };
                var restabelecido = !novo.Estacao.CompartilhamentoAcessivel && VerificarCompartilhamentoOk(estacaoDepois, cenario);
                if (restabelecido)
                    estacaoDepois = estacaoDepois with { CompartilhamentoAcessivel = true };
                novo = novo with { Estacao = estacaoDepois };
                gerados.Add(new(++seqAtual, "ServicoReiniciado", new Dictionary<string, object?>
                {
                    ["servico"] = servicoNome,
                    ["privilegio"] = novo.Estacao.Privilegio.ToString()
                }, minutoDestino));
                if (restabelecido)
                {
                    gerados.Add(new(++seqAtual, "AcessoPastaRestabelecido", new Dictionary<string, object?>
                    {
                        ["usuario"] = cenario.UsuarioAlvo,
                        ["causa"] = cenario.Causa
                    }, minutoDestino));
                }
                break;
            }
            case "estacao.desativar_firewall":
            {
                if (novo.Estacao.Privilegio != PrivilegioTerminal.Elevado)
                    return Rejeitar("Alterar firewall exige privilegio Elevado.");
                novo = novo with { Estacao = novo.Estacao with { FirewallAtivo = false } };
                gerados.Add(new(++seqAtual, "FirewallDesativado", new Dictionary<string, object?>(), minutoDestino));
                gerados.Add(new(++seqAtual, "AcaoPrejudicialRegistrada", new Dictionary<string, object?>
                {
                    ["categoria"] = "seguranca",
                    ["motivo"] = "Firewall da estacao foi desativado durante o atendimento."
                }, minutoDestino));
                break;
            }
            case "estacao.ler_logs":
            {
                gerados.Add(new(++seqAtual, "LogsConsultados", new Dictionary<string, object?>
                {
                    ["quantidade"] = novo.Estacao.Logs.Count,
                    ["logs"] = novo.Estacao.Logs
                }, minutoDestino));
                break;
            }
            case "estacao.consultar_servico":
            {
                var nome = acao.ObterString("servico") ?? cenario.ServicoAlvo;
                var srv = novo.Estacao.Servicos.FirstOrDefault(s => string.Equals(s.Nome, nome, StringComparison.OrdinalIgnoreCase));
                gerados.Add(new(++seqAtual, "ServicoConsultado", new Dictionary<string, object?>
                {
                    ["servico"] = nome,
                    ["status"] = srv?.Status ?? "NaoEncontrado"
                }, minutoDestino));
                break;
            }
            case "seguranca.consultar_politica":
            {
                gerados.Add(new(++seqAtual, "PoliticaSegurancaConsultada", new Dictionary<string, object?>
                {
                    ["politica"] = "KB-001"
                }, minutoDestino));
                break;
            }
            case "seguranca.solicitar_token":
            {
                gerados.Add(new(++seqAtual, "TokenSolicitado", new Dictionary<string, object?>
                {
                    ["tokenValido"] = false,
                    ["motivo"] = "Solicitante nao possui token corporativo valido."
                }, minutoDestino));
                break;
            }
            case "seguranca.recusar_reset":
            {
                var motivo = acao.ObterString("motivo") ?? "Identidade nao validada conforme politica KB-001.";
                gerados.Add(new(++seqAtual, "ResetRecusado", new Dictionary<string, object?>
                {
                    ["motivo"] = motivo
                }, minutoDestino));
                break;
            }
            case "seguranca.resetar_senha":
            {
                if (cenario.Titular is not null)
                {
                    // Atalho do painel: mesma regra do comando redefinir-senha, sem ComandoExecutado.
                    var atalho = ComandosPorEscala.RedefinirSenha(novo, cenario);
                    novo = atalho.NovoEstado;
                    foreach (var ev in atalho.Eventos)
                        gerados.Add(new(++seqAtual, ev.Tipo, ev.Dados, minutoDestino));
                    break;
                }
                gerados.Add(new(++seqAtual, "SenhaResetadaIndevidamente", new Dictionary<string, object?>
                {
                    ["usuario"] = cenario.UsuarioAlvo
                }, minutoDestino));
                gerados.Add(new(++seqAtual, "AcaoPrejudicialRegistrada", new Dictionary<string, object?>
                {
                    ["categoria"] = "seguranca",
                    ["motivo"] = "Reset de senha realizado sem validacao de identidade (Engenharia Social)."
                }, minutoDestino));
                break;
            }
            default:
                return Rejeitar($"Tipo de acao desconhecido: '{acao.Tipo}'.");
        }

        // Derivar SlaVencido (uma vez por chamado) se algum chamado aberto ultrapassou o alvo
        var chamadosAtualizados = novo.Itsm.Chamados.ToList();
        for (var i = 0; i < chamadosAtualizados.Count; i++)
        {
            var ch = chamadosAtualizados[i];
            if (!ch.SlaVencido && ch.SlaAlvoMinuto.HasValue && ch.Status is not (StatusChamado.Resolvido or StatusChamado.Encerrado) && minutoDestino > ch.SlaAlvoMinuto.Value)
            {
                chamadosAtualizados[i] = ch with { SlaVencido = true };
                gerados.Add(new(++seqAtual, "SlaVencido", new Dictionary<string, object?>
                {
                    ["chamadoId"] = ch.Id,
                    ["slaAlvoMinuto"] = ch.SlaAlvoMinuto.Value,
                    ["minutoAtual"] = minutoDestino
                }, minutoDestino));
            }
        }
        novo = novo with
        {
            Itsm = novo.Itsm with { Chamados = chamadosAtualizados },
            Meta = novo.Meta with { MinutoSimulado = minutoDestino, UltimoSeq = seqAtual }
        };

        return new ResultadoAplicacao(novo, gerados);
    }

    public static ResultadoAplicacao RegistrarChat(
        EstadoSessao estado,
        string persona,
        string mensagemUsuario,
        string respostaPersona,
        string origem)
    {
        var seqAtual = estado.Meta.UltimoSeq;
        var minutoDestino = estado.Meta.MinutoSimulado + TabelaCustoMinutos.ObterCusto("dialogo.chat");

        var evUser = new EnvelopeEvento(++seqAtual, "MensagemUsuarioEnviada", new Dictionary<string, object?>
        {
            ["persona"] = persona,
            ["texto"] = mensagemUsuario
        }, minutoDestino);

        var evPersona = new EnvelopeEvento(++seqAtual, "MensagemPersonaRecebida", new Dictionary<string, object?>
        {
            ["persona"] = persona,
            ["texto"] = respostaPersona,
            ["origem"] = origem
        }, minutoDestino);

        var mensagens = new List<MensagemDialogo>(estado.Dialogo.Mensagens)
        {
            new(evUser.Seq, "analista", mensagemUsuario, minutoDestino),
            new(evPersona.Seq, persona, respostaPersona, minutoDestino)
        };

        var novo = estado with
        {
            Dialogo = estado.Dialogo with { Mensagens = mensagens },
            Meta = estado.Meta with { MinutoSimulado = minutoDestino, UltimoSeq = seqAtual }
        };
        return new ResultadoAplicacao(novo, [evUser, evPersona]);
    }

    public static (string Id, string Pin) GerarCredenciaisSimuDesk(long semente)
    {
        var rng = new SplitMix64(unchecked((long)((ulong)semente ^ 0x53494D554445534BUL)));
        var x1 = rng.NextUInt64();
        var x2 = rng.NextUInt64();
        var idNum = 100000000UL + (x1 % 900000000UL);
        var idStr = idNum.ToString("D9");
        var idFormatado = $"{idStr[..3]} {idStr[3..6]} {idStr[6..9]}";
        var pin = (x2 % 10000UL).ToString("D4");
        return (idFormatado, pin);
    }

    private static (EstadoEstacao Estacao, string Saida, bool AcessoRestabelecido, (string Tipo, IReadOnlyDictionary<string, object?> Dados)? EventoExtra) ExecutarComandoEstacao(
        EstadoEstacao estacao,
        string comando,
        DefinicaoCenario cenario)
    {
        var lower = comando.ToLowerInvariant().Trim();
        if (lower.StartsWith("whoami /groups"))
        {
            var grupos = estacao.GruposPorUsuario.TryGetValue(cenario.UsuarioAlvo, out var g) ? g : [];
            var saida = $"Usuario: {cenario.UsuarioAlvo} | Grupos: {string.Join(", ", grupos)}";
            return (estacao, saida, false, null);
        }
        if (lower.StartsWith("nslookup"))
        {
            if (estacao.DnsServidor.TryGetValue(cenario.HostAlvo, out var dns))
                return (estacao, $"Servidor: dns.aurora.local | Nome: {dns.Host} | Endereco: {dns.Ip}", false, null);
            return (estacao, $"Host '{cenario.HostAlvo}' nao encontrado no DNS.", false, null);
        }
        if (lower.StartsWith("ping"))
        {
            if (estacao.DnsCacheEstacao.TryGetValue(cenario.HostAlvo, out var ip))
            {
                var esperado = estacao.DnsServidor.TryGetValue(cenario.HostAlvo, out var d) ? d.IpEsperado : ip;
                if (string.Equals(ip, esperado, StringComparison.OrdinalIgnoreCase))
                    return (estacao, $"Disparando {cenario.HostAlvo} [{ip}] com 32 bytes de dados: Resposta de {ip}: bytes=32 tempo=2ms TTL=128", false, null);
                return (estacao, $"Disparando {cenario.HostAlvo} [{ip}] com 32 bytes de dados: Esgotado o tempo limite do pedido.", false, null);
            }
            return (estacao, $"A solicitacao ping nao pode encontrar o host {cenario.HostAlvo}.", false, null);
        }
        if (lower.StartsWith("ipconfig /flushdns"))
        {
            if (estacao.Privilegio != PrivilegioTerminal.Elevado)
                return (estacao, "A operacao solicitada requer elevacao (erro 740).", false, null);

            var novoCache = new Dictionary<string, string>(estacao.DnsCacheEstacao, StringComparer.OrdinalIgnoreCase);
            if (estacao.DnsServidor.TryGetValue(cenario.HostAlvo, out var dns))
                novoCache[cenario.HostAlvo] = dns.Ip;
            var estDepois = estacao with { DnsCacheEstacao = novoCache };
            var rest = !estacao.CompartilhamentoAcessivel && VerificarCompartilhamentoOk(estDepois, cenario);
            if (rest) estDepois = estDepois with { CompartilhamentoAcessivel = true };
            return (estDepois, "Cache de resolucao de DNS liberado com exito.", rest,
                ("CacheDnsLimpo", new Dictionary<string, object?> { ["host"] = cenario.HostAlvo }));
        }
        if (lower.StartsWith("net start ") && lower.Length > "net start ".Length)
        {
            if (estacao.Privilegio != PrivilegioTerminal.Elevado)
                return (estacao, "Erro de sistema 5. Acesso negado.", false, null);
            var srvAlvo = comando.Trim()["net start ".Length..].Trim();
            var existe = estacao.Servicos.Any(s => string.Equals(s.Nome, srvAlvo, StringComparison.OrdinalIgnoreCase));
            if (!existe)
                return (estacao, $"O nome do servico e invalido (erro 2185): {srvAlvo}", false, null);
            var atualizados = estacao.Servicos.Select(s =>
                string.Equals(s.Nome, srvAlvo, StringComparison.OrdinalIgnoreCase) ? s with { Status = "Running" } : s).ToArray();
            var estDepois = estacao with { Servicos = atualizados };
            var rest = !estacao.CompartilhamentoAcessivel && VerificarCompartilhamentoOk(estDepois, cenario);
            if (rest) estDepois = estDepois with { CompartilhamentoAcessivel = true };
            return (estDepois, $"O servico {srvAlvo} foi iniciado com exito.", rest,
                ("ServicoIniciado", new Dictionary<string, object?>
                {
                    ["servico"] = srvAlvo,
                    ["privilegio"] = estacao.Privilegio.ToString()
                }));
        }
        if (lower.StartsWith("net start") || lower.StartsWith("sc query"))
        {
            var linhas = estacao.Servicos.Select(s => $"{s.Nome}: {s.Status}");
            return (estacao, string.Join(" | ", linhas), false, null);
        }
        if (cenario.CenarioId == "sre-cloud-latencia")
        {
            return ExecutarComandoSre(estacao, lower, cenario);
        }
        if (cenario.CenarioId == "diagnostico-sql-readonly")
        {
            return ExecutarComandoSqlReadOnly(estacao, lower);
        }
        return (estacao, "Comando executado.", false, null);
    }

    // Grammar intencionalmente pequena: SELECT/EXPLAIN, colunas do dataset, uma tabela,
    // predicados simples e GROUP BY/ORDER BY/LIMIT. Qualquer token fora da gramática falha fechado.
    private static bool EhConsultaSqlPermitida(string sql) => TentarAnalisarSql(sql, out _);

    private static bool TentarAnalisarSql(string sql, out string tabela)
    {
        tabela = "";
        if (string.IsNullOrWhiteSpace(sql) || sql.Length > 512) return false;
        var tokens = new List<string>();
        for (var i = 0; i < sql.Length;)
        {
            var c = sql[i];
            if (char.IsWhiteSpace(c)) { i++; continue; }
            if (char.IsLetterOrDigit(c) || c == '_')
            {
                var inicio = i++;
                while (i < sql.Length && (char.IsLetterOrDigit(sql[i]) || sql[i] is '_' or '.')) i++;
                tokens.Add(sql[inicio..i].ToLowerInvariant());
            }
            else if (c is '*' or ',' or '(' or ')' or '=' or '<' or '>')
            {
                tokens.Add(c.ToString()); i++;
                if (i < sql.Length && (c is '<' or '>') && sql[i] == '=') tokens[^1] += sql[i++];
            }
            else if (c == '\'')
            {
                var inicio = ++i;
                while (i < sql.Length && sql[i] != '\'') i++;
                if (i == sql.Length || i - inicio > 64) return false;
                tokens.Add("'" + sql[inicio..i].ToLowerInvariant() + "'"); i++;
            }
            else return false; // inclui ;, comentários, parâmetros e operadores não previstos
            if (tokens.Count > 100) return false;
        }

        var identificadoresPermitidos = new HashSet<string>(StringComparer.Ordinal)
        {
            "select", "explain", "distinct", "count", "sum", "from", "where", "and", "group", "by", "order", "limit", "as", "asc", "desc",
            "pagamentos", "pedidos", "id", "pedido_id", "valor", "status", "total"
        };
        var operadoresPermitidos = new HashSet<string>(StringComparer.Ordinal) { "*", ",", "(", ")", "=", "<", ">", "<=", ">=" };
        if (tokens.Any(t => !identificadoresPermitidos.Contains(t) && !operadoresPermitidos.Contains(t) && !t.StartsWith("'") && !t.All(char.IsDigit))) return false;

        var p = 0;
        bool Eat(string s) { if (p < tokens.Count && tokens[p] == s) { p++; return true; } return false; }
        bool Ident() => p < tokens.Count && (tokens[p].All(ch => char.IsLetterOrDigit(ch) || ch == '_' || ch == '.')) && !Palavras.Contains(tokens[p]);
        var explain = Eat("explain");
        if (explain && Eat("analyze")) return false;
        if (!Eat("select")) return false;
        if (Eat("distinct")) { /* permitido */ }
        var selecao = 0;
        while (true)
        {
            if (Eat("count")) { if (!Eat("(") || !Eat("*") || !Eat(")")) return false; }
            else if (Eat("sum")) { if (!Eat("(") || !Ident()) return false; p++; if (!Eat(")")) return false; }
            else if (Eat("*")) { }
            else if (Ident()) p++;
            else return false;
            selecao++;
            if (!Eat(",")) break;
        }
        if (selecao > 12 || !Eat("from") || !Ident()) return false;
        tabela = tokens[p++];
        if (tabela is not ("pagamentos" or "pedidos")) return false;
        if (Eat("as")) { if (!Ident()) return false; p++; }
        if (Eat("where"))
        {
            var termos = 0;
            do
            {
                if (!Ident()) return false; p++;
                if (!(Eat("=") || Eat("<") || Eat(">") || Eat("<=") || Eat(">="))) return false;
                if (p >= tokens.Count || !(Ident() || tokens[p].StartsWith("'") || tokens[p].All(char.IsDigit))) return false;
                p++; if (++termos > 8) return false;
            } while (Eat("and"));
        }
        if (Eat("group")) { if (!Eat("by")) return false; var n = 0; do { if (!Ident()) return false; p++; n++; } while (Eat(",")); if (n > 4) return false; }
        if (Eat("order")) { if (!Eat("by") || !Ident()) return false; p++; if (Eat("asc") || Eat("desc")) { } }
        if (Eat("limit")) { if (p >= tokens.Count || !int.TryParse(tokens[p++], out var limit) || limit is < 1 or > 100) return false; }
        if (tabela == "pagamentos" && tokens.Contains("total") || tabela == "pedidos" && (tokens.Contains("pedido_id") || tokens.Contains("valor") || tokens.Contains("status"))) return false;
        return p == tokens.Count;
    }

    private static readonly HashSet<string> Palavras = new(StringComparer.Ordinal)
    { "select", "from", "where", "and", "or", "group", "by", "order", "limit", "as", "distinct", "count", "sum", "insert", "update", "delete", "drop", "union", "join", "into", "having" };

    private static (EstadoEstacao Estacao, string Saida, bool AcessoRestabelecido, (string Tipo, IReadOnlyDictionary<string, object?> Dados)? EventoExtra) ExecutarComandoSre(
        EstadoEstacao estacao,
        string lower,
        DefinicaoCenario cenario)
    {
        if (lower.StartsWith("kubectl get pods"))
        {
            var apiStatus = estacao.Servicos.FirstOrDefault(s => s.Nome == "ApiPedidos")?.Status ?? "Running";
            var pgStatus = estacao.Servicos.FirstOrDefault(s => s.Nome == "PgBouncer")?.Status ?? "Running";
            return (estacao,
                $"NAME                         READY   STATUS             RESTARTS\napi-pedidos-7f9b             0/1     {apiStatus,-18} 6\npgbouncer-6c4d               1/1     {pgStatus,-18} 0",
                false, null);
        }
        if (lower.StartsWith("kubectl logs"))
        {
            var msg = cenario.Causa switch
            {
                "OOM_KILLED" => "Last State: Terminated | Reason: OOMKilled | Exit Code: 137 | Memory Limit: 128Mi",
                "POOL_EXHAUSTED" => "ERROR: FATAL: remaining connection slots are reserved for non-replication superuser connections (pgbouncer saturated)",
                _ => "INFO: App healthy internally; upstream TLS handshake failing at ingress-aurora."
            };
            return (estacao, msg, false, null);
        }
        if (lower.StartsWith("kubectl describe ingress"))
        {
            var tlsStatus = estacao.Servicos.FirstOrDefault(s => s.Nome == "IngressTLS")?.Status ?? "Running";
            var msg = tlsStatus == "Expired"
                ? "Host: api.aurora.local | TLS Secret: aurora-tls | Status: EXPIRED (2026-11-10)"
                : "Host: api.aurora.local | TLS Secret: aurora-tls | Status: Valid";
            return (estacao, msg, false, null);
        }
        if (lower.StartsWith("curl -i"))
        {
            var msg = estacao.CompartilhamentoAcessivel
                ? "HTTP/2 200 OK | x-aurora-edge: healthy"
                : cenario.Causa == "CERT_EXPIRED"
                    ? "curl: (60) SSL certificate problem: certificate has expired"
                    : "HTTP/1.1 502 Bad Gateway | upstream api-pedidos unavailable";
            return (estacao, msg, false, null);
        }
        if (lower.StartsWith("pg_stat_activity"))
        {
            var pgStatus = estacao.Servicos.FirstOrDefault(s => s.Nome == "PgBouncer")?.Status ?? "Running";
            var msg = pgStatus == "Degraded"
                ? "active_connections: 100/100 (MAX_CONN REACHED) | waiting_queries: 42"
                : "active_connections: 14/100 | waiting_queries: 0";
            return (estacao, msg, false, null);
        }
        if (lower.StartsWith("kubectl set resources") || lower.StartsWith("kubectl rollout restart"))
        {
            if (estacao.Privilegio != PrivilegioTerminal.Elevado)
                return (estacao, "Error from server (Forbidden): operacao de cluster exige privilegio Elevado.", false, null);

            var servicoAlvo = cenario.Causa switch
            {
                "OOM_KILLED" when lower.Contains("set resources") || lower.Contains("api-pedidos") => "ApiPedidos",
                "POOL_EXHAUSTED" when lower.Contains("pgbouncer") => "PgBouncer",
                "CERT_EXPIRED" when lower.Contains("cert-manager") || lower.Contains("ingress") => "IngressTLS",
                _ => null
            };
            if (servicoAlvo is null)
                return (estacao, "Rollout executado, porem o componente afetado pela causa raiz permanece degradado.", false, null);

            var atualizados = estacao.Servicos.Select(s => s.Nome == servicoAlvo ? s with { Status = "Running" } : s).ToArray();
            var estDepois = estacao with { Servicos = atualizados, CompartilhamentoAcessivel = true };
            return (estDepois, $"Mitigacao aplicada com sucesso: {servicoAlvo} restaurado para Running (SLO normalizado).", true,
                ("ServicoIniciado", new Dictionary<string, object?>
                {
                    ["servico"] = servicoAlvo,
                    ["privilegio"] = estacao.Privilegio.ToString()
                }));
        }
        return (estacao, "Comando SRE executado.", false, null);
    }

    private static (EstadoEstacao Estacao, string Saida, bool AcessoRestabelecido, (string Tipo, IReadOnlyDictionary<string, object?> Dados)? EventoExtra) ExecutarComandoSqlReadOnly(
        EstadoEstacao estacao,
        string lower)
    {
        if (!TentarAnalisarSql(lower, out var tabela))
            return (estacao, "BLOQUEADO: consulta fora da gramática SQL somente leitura do cenário.", false, null);
        if (lower.StartsWith("explain", StringComparison.Ordinal))
        {
            return (estacao, $"Plano simulado (dataset imutável): Seq Scan on {tabela} (cost=0.00..1.04 rows=3); buffers=memória; writes=0", false, null);
        }
        if (tabela == "pagamentos" && lower.Contains("group by status", StringComparison.Ordinal))
        {
            var confirmados = DatasetPagamentos.Where(p => p.Status == "CONFIRMADO").ToArray();
            var duplicados = DatasetPagamentos.Where(p => p.Status == "DUPLICADO").ToArray();
            return (estacao, $"Investigacao 1/3 — pagamentos por status: CONFIRMADO={confirmados.Length} (R$ {FormatarMoeda(confirmados.Sum(p => p.Valor))}); DUPLICADO={duplicados.Length} ({string.Join(", ", duplicados.Select(p => $"{p.Id}, {p.PedidoId}, R$ {FormatarMoeda(p.Valor)}"))}). Evidencia: duplicidade detectada.", false, null);
        }
        if (tabela == "pagamentos")
        {
            var linhas = string.Join("; ", DatasetPagamentos.Select(p => $"{p.Id}/{p.PedidoId} R$ {FormatarMoeda(p.Valor)} {p.Status}"));
            return (estacao, $"Investigacao 2/3 — pagamentos: {linhas}. Dataset sintetico, somente leitura.", false, null);
        }
        var somaPedidos = DatasetPedidos.Sum(p => p.Total);
        var somaConfirmada = DatasetPagamentos.Where(p => p.Status == "CONFIRMADO").Sum(p => p.Valor);
        var detalhes = string.Join("; ", DatasetPedidos.Select(p => $"{p.Id} R$ {FormatarMoeda(p.Total)}"));
        return (estacao, $"Investigacao 3/3 — pedidos: {detalhes}; total R$ {FormatarMoeda(somaPedidos)}. Soma confirmada R$ {FormatarMoeda(somaConfirmada)}; diferenca bruta R$ {FormatarMoeda(somaPedidos - somaConfirmada)}.", false, null);
    }

    private static bool VerificarCompartilhamentoOk(EstadoEstacao estacao, DefinicaoCenario cenario)
    {
        var gruposOk = estacao.GruposPorUsuario.TryGetValue(cenario.UsuarioAlvo, out var g) &&
                       g.Contains(cenario.GrupoAlvoCompartilhamento, StringComparer.OrdinalIgnoreCase);
        var dnsOk = estacao.DnsServidor.TryGetValue(cenario.HostAlvo, out var dns) &&
                    string.Equals(dns.Ip, dns.IpEsperado, StringComparison.OrdinalIgnoreCase) &&
                    estacao.DnsCacheEstacao.TryGetValue(cenario.HostAlvo, out var ipCache) &&
                    string.Equals(ipCache, dns.IpEsperado, StringComparison.OrdinalIgnoreCase);
        var servicoOk = estacao.Servicos.Any(s =>
            string.Equals(s.Nome, cenario.ServicoAlvo, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(s.Status, "Running", StringComparison.OrdinalIgnoreCase));
        return gruposOk && dnsOk && servicoOk;
    }

    private static EstadoSessao AplicarEventosIniciais(EstadoSessao baseEstado, IReadOnlyList<EnvelopeEvento> eventos, DefinicaoCenario cenario, long semente)
    {
        var chamados = new List<Chamado>();
        var num = 1;
        foreach (var ev in eventos)
        {
            if (ev.Tipo == "ChamadoAberto")
            {
                chamados.Add(new Chamado(
                    ev.Dados["chamadoId"]?.ToString() ?? ItsmRegras.FormatarChamadoId(num++),
                    ev.Dados["titulo"]?.ToString() ?? "",
                    ev.Dados["descricao"]?.ToString() ?? "",
                    ev.Dados["solicitante"]?.ToString() ?? "",
                    StatusChamado.Novo,
                    null, null, null, null,
                    Convert.ToInt32(ev.Dados["abertoEmMinuto"]),
                    null, null, false, null, null, null, []));
            }
        }
        return new EstadoSessao(
            new EstadoMeta(cenario.CenarioId, cenario.Causa, semente, cenario.Nivel, cenario.VersaoManifesto, 0, eventos[^1].Seq, cenario.PedidoPorTerceiro),
            EstadoCarreira.Inicial(cenario.Nivel),
            new EstadoItsm(chamados, [], chamados.Count + 1, 1),
            EstadoDialogo.Vazio,
            cenario.EstacaoInicial);
    }
}
