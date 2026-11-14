using Simulador.Itsm;

namespace Simulador.Dominio;

public sealed record ResultadoAplicacao(
    EstadoSessao NovoEstado,
    IReadOnlyList<EnvelopeEvento> Eventos);

public static class Motor
{
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
                break;
            }
            case "itsm.resolver_chamado":
            {
                var id = acao.ObterString("chamadoId");
                var nota = acao.ObterString("notaPublica");
                if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(nota))
                    return Rejeitar("chamadoId e notaPublica obrigatorios.");
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
                string[] pistas =
                [
                    "Pista 1: Antes de alterar qualquer configuracao, verifique no terminal os sinais da estacao (whoami /groups, nslookup, ping, net start).",
                    "Pista 2: Compare o resultado do diagnostico com a Base de Conhecimento: grupo ausente (C1), DNS errado (C2) ou servico parado (C3).",
                    "Pista 3: Para corrigir com seguranca, eleve o privilegio no terminal/painel e depois confirme o acesso antes de resolver o chamado."
                ];
                if (novo.Dialogo.PistasSolicitadas >= pistas.Length)
                    return Rejeitar("pistas_esgotadas");

                var indice = novo.Dialogo.PistasSolicitadas + 1;
                var textoPista = pistas[novo.Dialogo.PistasSolicitadas];
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

                if (string.Equals(matricula, "AUR-1042", StringComparison.OrdinalIgnoreCase) && ramal == "2042")
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

                var (estacaoAtualizada, saida, acessoRestabelecido) = ExecutarComandoEstacao(novo.Estacao, cmd, cenario);
                novo = novo with { Estacao = estacaoAtualizada };
                gerados.Add(new(++seqAtual, "ComandoExecutado", new Dictionary<string, object?>
                {
                    ["comando"] = cmd,
                    ["privilegio"] = novo.Estacao.Privilegio.ToString(),
                    ["saida"] = saida
                }, minutoDestino));

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
                    ["servico"] = servicoNome
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

    private static (EstadoEstacao Estacao, string Saida, bool AcessoRestabelecido) ExecutarComandoEstacao(
        EstadoEstacao estacao,
        string comando,
        DefinicaoCenario cenario)
    {
        var lower = comando.ToLowerInvariant();
        if (lower.StartsWith("whoami /groups"))
        {
            var grupos = estacao.GruposPorUsuario.TryGetValue(cenario.UsuarioAlvo, out var g) ? g : [];
            var saida = $"Usuario: {cenario.UsuarioAlvo} | Grupos: {string.Join(", ", grupos)}";
            return (estacao, saida, false);
        }
        if (lower.StartsWith("nslookup"))
        {
            if (estacao.DnsServidor.TryGetValue(cenario.HostAlvo, out var dns))
                return (estacao, $"Servidor: dns.aurora.local | Nome: {dns.Host} | Endereco: {dns.Ip}", false);
            return (estacao, $"Host '{cenario.HostAlvo}' nao encontrado no DNS.", false);
        }
        if (lower.StartsWith("ping"))
        {
            if (estacao.DnsCacheEstacao.TryGetValue(cenario.HostAlvo, out var ip))
                return (estacao, $"Disparando {cenario.HostAlvo} [{ip}] com 32 bytes de dados: Resposta de {ip}: bytes=32 tempo=2ms TTL=128", false);
            return (estacao, $"A solicitacao ping nao pode encontrar o host {cenario.HostAlvo}.", false);
        }
        if (lower.StartsWith("ipconfig /flushdns"))
        {
            var novoCache = new Dictionary<string, string>(estacao.DnsCacheEstacao, StringComparer.OrdinalIgnoreCase);
            if (estacao.DnsServidor.TryGetValue(cenario.HostAlvo, out var dns))
                novoCache[cenario.HostAlvo] = dns.Ip;
            var estDepois = estacao with { DnsCacheEstacao = novoCache };
            var rest = !estacao.CompartilhamentoAcessivel && VerificarCompartilhamentoOk(estDepois, cenario);
            if (rest) estDepois = estDepois with { CompartilhamentoAcessivel = true };
            return (estDepois, "Cache de resolucao de DNS liberado com exito.", rest);
        }
        if (lower.StartsWith("net start") || lower.StartsWith("sc query"))
        {
            var linhas = estacao.Servicos.Select(s => $"{s.Nome}: {s.Status}");
            return (estacao, string.Join(" | ", linhas), false);
        }
        return (estacao, "Comando executado.", false);
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
            new EstadoMeta(cenario.CenarioId, cenario.Causa, semente, cenario.Nivel, cenario.VersaoManifesto, 0, eventos[^1].Seq),
            EstadoCarreira.Inicial(cenario.Nivel),
            new EstadoItsm(chamados, [], chamados.Count + 1, 1),
            EstadoDialogo.Vazio,
            cenario.EstacaoInicial);
    }
}
