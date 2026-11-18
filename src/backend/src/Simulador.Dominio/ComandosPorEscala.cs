namespace Simulador.Dominio;

internal sealed record EventoEscala(string Tipo, IReadOnlyDictionary<string, object?> Dados);

internal sealed record ResultadoComandoEscala(EstadoSessao NovoEstado, string Saida, IReadOnlyList<EventoEscala> Eventos);

/// <summary>
/// Comandos declarados dos cenarios por escala. O estado novo e sempre o resultado de dobrar,
/// em ordem, os Eventos emitidos com <see cref="EfeitosDeEventos.Aplicar"/>.
/// </summary>
internal static class ComandosPorEscala
{
    /// <summary>Devolve null quando o comando nao pertence a nenhum cenario por escala (segue para o fluxo generico).</summary>
    internal static ResultadoComandoEscala? TentarExecutar(EstadoSessao estado, string comando, DefinicaoCenario cenario)
    {
        var texto = comando.Trim();
        return cenario.CenarioId switch
        {
            "reset-senha-desbloqueio" => ExecutarResetSenha(estado, texto, cenario),
            "pasta-rede-inacessivel" => ExecutarPastaRede(estado, texto, cenario),
            "falha-backup-restore" => ExecutarBackup(estado, texto, cenario),
            _ => null
        };
    }

    /// <summary>Atalho de seguranca.resetar_senha em cenarios com Titular: mesma regra do comando redefinir-senha.</summary>
    internal static ResultadoComandoEscala RedefinirSenha(EstadoSessao estado, DefinicaoCenario cenario) =>
        RedefinirSenhaDaTitular(estado, cenario, "seguranca.resetar_senha");

    // ---------------------------------------------------------------- utilidades

    private static EventoEscala Ev(string tipo, params (string Chave, object? Valor)[] dados)
    {
        var d = new Dictionary<string, object?>();
        foreach (var (chave, valor) in dados) d[chave] = valor;
        return new EventoEscala(tipo, d);
    }

    private static ResultadoComandoEscala Resultado(EstadoSessao estado, string saida, params EventoEscala[] eventos)
    {
        var estacao = estado.Estacao;
        var dialogo = estado.Dialogo;
        foreach (var ev in eventos)
            (estacao, dialogo) = EfeitosDeEventos.Aplicar(estacao, dialogo, ev.Tipo, ev.Dados);
        return new ResultadoComandoEscala(estado with { Estacao = estacao, Dialogo = dialogo }, saida, eventos);
    }

    private static string Argumento(string comando, string prefixo) =>
        comando.Length > prefixo.Length ? comando[prefixo.Length..].Trim() : "";

    // ---------------------------------------------------------------- reset-senha-desbloqueio

    private const string MensagemLoginInexistente = "O nome de usuario nao foi encontrado.";

    private static ResultadoComandoEscala? ExecutarResetSenha(EstadoSessao estado, string comando, DefinicaoCenario cenario)
    {
        var lower = comando.ToLowerInvariant();

        if (lower.StartsWith("net user", StringComparison.Ordinal))
        {
            var arg = Argumento(comando, "net user");
            if (!string.Equals(arg, cenario.UsuarioAlvo, StringComparison.OrdinalIgnoreCase))
                return Resultado(estado, MensagemLoginInexistente);
            return Resultado(estado, TextoNetUser(estado, cenario));
        }

        if (lower.StartsWith("eventos-seguranca", StringComparison.Ordinal))
        {
            var arg = Argumento(comando, "eventos-seguranca");
            if (!string.Equals(arg, cenario.UsuarioAlvo, StringComparison.OrdinalIgnoreCase))
                return Resultado(estado, MensagemLoginInexistente);
            if (cenario.Causa != "CONTA_BLOQUEADA")
                return Resultado(estado, $"Nenhum bloqueio recente para {cenario.UsuarioAlvo}.");
            return Resultado(estado,
                "Evento 4740 repetido a cada 5 min. Origem: dispositivo movel MOB-FIN-017 (celular corporativo da titular) com senha antiga em cache.",
                Ev("OrigemBloqueioIdentificada", ("usuario", cenario.UsuarioAlvo), ("origem", "MOB-FIN-017")));
        }

        if (lower.StartsWith("diretorio", StringComparison.Ordinal))
        {
            var arg = Argumento(comando, "diretorio");
            var titular = cenario.Titular!;
            if (!string.Equals(arg, cenario.UsuarioAlvo, StringComparison.OrdinalIgnoreCase))
                return Resultado(estado, MensagemLoginInexistente);
            return Resultado(estado,
                $"Titular: {titular.Nome} | Ramal cadastrado: {titular.Ramal} | Gestor: {titular.NomeGestor} | " +
                "Politica: confirmar identidade da titular antes de qualquer reset ou desbloqueio.");
        }

        if (lower.StartsWith("discar", StringComparison.Ordinal))
        {
            var titular = cenario.Titular!;
            var arg = Argumento(comando, "discar");
            if (!string.Equals(arg, titular.Ramal, StringComparison.Ordinal))
                return Resultado(estado, "Numero fora do cadastro corporativo. Use o ramal do diretorio.");
            return Resultado(estado,
                $"Ligacao para o ramal cadastrado {titular.Ramal}: {titular.Nome} atendeu e confirma que e a titular.",
                Ev("TitularContatado", ("canal", "ramal_cadastrado"), ("ramal", titular.Ramal)));
        }

        if (lower.StartsWith("redefinir-senha", StringComparison.Ordinal))
        {
            var arg = Argumento(comando, "redefinir-senha");
            if (!string.Equals(arg, cenario.UsuarioAlvo, StringComparison.OrdinalIgnoreCase))
                return Resultado(estado, MensagemLoginInexistente);
            return RedefinirSenhaDaTitular(estado, cenario, "redefinir-senha");
        }

        if (lower.StartsWith("desbloquear-conta", StringComparison.Ordinal))
        {
            var arg = Argumento(comando, "desbloquear-conta");
            if (!string.Equals(arg, cenario.UsuarioAlvo, StringComparison.OrdinalIgnoreCase))
                return Resultado(estado, MensagemLoginInexistente);
            return DesbloquearContaDaTitular(estado, cenario);
        }

        if (lower.StartsWith("enviar-link-troca", StringComparison.Ordinal))
        {
            var arg = Argumento(comando, "enviar-link-troca");
            if (!string.Equals(arg, cenario.UsuarioAlvo, StringComparison.OrdinalIgnoreCase))
                return Resultado(estado, MensagemLoginInexistente);
            return EnviarLinkDeTroca(estado, cenario);
        }

        return null;
    }

    private static string TextoNetUser(EstadoSessao estado, DefinicaoCenario cenario)
    {
        var status = EfeitosDeEventos.StatusServico(estado.Estacao, "ContaAD");
        var detalhe = status switch
        {
            "Bloqueada" => "conta BLOQUEADA | 12 tentativas incorretas nas ultimas 2 horas",
            "SenhaExpirada" => "ativa | senha EXPIRADA em 2026-11-12 (politica de 90 dias)",
            "SenhaTemporaria" => "ativa | senha temporaria, troca obrigatoria no primeiro acesso | 0 tentativas incorretas",
            "Ativa" when cenario.Causa == "SENHA_ESQUECIDA" => "ativa | senha valida ate 2027-01-20 | 2 tentativas incorretas",
            _ => "ativa | senha valida ate 2027-01-20 | 0 tentativas incorretas"
        };
        return $"Conta: {cenario.UsuarioAlvo} | Estado: {detalhe}";
    }

    /// <summary>Regra de Acao_Sensivel: sem identidade validada a acao e recusada e registrada, antes de qualquer regra por Causa.</summary>
    private static ResultadoComandoEscala? RecusarSeSemIdentidade(EstadoSessao estado, DefinicaoCenario cenario, string rotulo)
    {
        if (estado.Dialogo.IdentidadeValidada) return null;
        return Resultado(estado,
            "RECUSADO pelo console: identidade da titular nao verificada. A acao foi registrada.",
            Ev("AcaoSensivelSemVerificacao", ("acao", rotulo), ("usuario", cenario.UsuarioAlvo)),
            Ev("AcaoPrejudicialRegistrada",
                ("categoria", "seguranca"),
                ("motivo", "Acao sensivel executada sem verificar a identidade da titular.")));
    }

    private static EventoEscala Desnecessaria(string rotulo, string motivo) =>
        Ev("AcaoDesnecessariaRegistrada", ("comando", rotulo), ("motivo", motivo));

    private static ResultadoComandoEscala RedefinirSenhaDaTitular(EstadoSessao estado, DefinicaoCenario cenario, string rotulo)
    {
        var recusa = RecusarSeSemIdentidade(estado, cenario, rotulo);
        if (recusa is not null) return recusa;

        var definida = Ev("SenhaTemporariaDefinida", ("usuario", cenario.UsuarioAlvo), ("trocaObrigatoria", true));
        var restabelecido = Ev("AcessoContaRestabelecido", ("usuario", cenario.UsuarioAlvo), ("via", "reset"));
        const string sucesso = "Senha temporaria definida e entregue a titular por canal seguro. Troca obrigatoria no primeiro acesso.";

        return cenario.Causa switch
        {
            "SENHA_ESQUECIDA" => Resultado(estado, sucesso, definida, restabelecido),
            "CONTA_BLOQUEADA" => Resultado(estado, "A conta continua bloqueada: o reset nao remove a origem das tentativas.",
                Desnecessaria(rotulo, "reset_nao_resolve_a_causa")),
            "SENHA_EXPIRADA" => Resultado(estado, sucesso, definida, restabelecido,
                Desnecessaria(rotulo, "senha_vencida_se_resolve_pela_troca_da_titular")),
            _ => throw new InvalidOperationException($"Causa sem regra de reset: {cenario.Causa}")
        };
    }

    private static ResultadoComandoEscala DesbloquearContaDaTitular(EstadoSessao estado, DefinicaoCenario cenario)
    {
        var recusa = RecusarSeSemIdentidade(estado, cenario, "desbloquear-conta");
        if (recusa is not null) return recusa;

        var bloqueada = cenario.Causa == "CONTA_BLOQUEADA"
            && EfeitosDeEventos.StatusServico(estado.Estacao, "ContaAD") == "Bloqueada";
        if (!bloqueada)
            return Resultado(estado, "A conta nao esta bloqueada.",
                Desnecessaria("desbloquear-conta", "conta_nao_esta_bloqueada"));

        var desbloqueada = Ev("ContaDesbloqueada", ("usuario", cenario.UsuarioAlvo));
        if (EfeitosDeEventos.StatusServico(estado.Estacao, "EventosDeSeguranca") == "Consultado")
            return Resultado(estado, "Conta desbloqueada.", desbloqueada,
                Ev("AcessoContaRestabelecido", ("usuario", cenario.UsuarioAlvo), ("via", "desbloqueio")));

        return Resultado(estado,
            "Conta desbloqueada, mas bloqueada novamente em 5 min: a origem das tentativas continua ativa.",
            desbloqueada,
            Ev("ContaBloqueadaNovamente", ("usuario", cenario.UsuarioAlvo), ("motivo", "origem_das_tentativas_continua_ativa")));
    }

    private static ResultadoComandoEscala EnviarLinkDeTroca(EstadoSessao estado, DefinicaoCenario cenario)
    {
        var recusa = RecusarSeSemIdentidade(estado, cenario, "enviar-link-troca");
        if (recusa is not null) return recusa;

        switch (cenario.Causa)
        {
            case "CONTA_BLOQUEADA":
                return Resultado(estado, "O link nao remove a origem do bloqueio.",
                    Desnecessaria("enviar-link-troca", "link_nao_remove_a_origem_do_bloqueio"));
            case "SENHA_EXPIRADA":
                if (EfeitosDeEventos.StatusServico(estado.Estacao, "ContaAD") != "SenhaExpirada")
                    return Resultado(estado, "A senha ja foi renovada.",
                        Desnecessaria("enviar-link-troca", "senha_ja_foi_renovada"));
                return Resultado(estado,
                    "Link de autoatendimento enviado ao e-mail alternativo; a titular trocou a propria senha.",
                    Ev("OrientacaoRegistrada", ("usuario", cenario.UsuarioAlvo), ("tema", "troca_pela_titular")),
                    Ev("SenhaTrocadaPelaPessoa", ("usuario", cenario.UsuarioAlvo)),
                    Ev("AcessoContaRestabelecido", ("usuario", cenario.UsuarioAlvo), ("via", "troca_pela_titular")));
            default:
                return Resultado(estado, "A titular nao tem a senha atual; o link exige a senha vigente.",
                    Desnecessaria("enviar-link-troca", "link_exige_a_senha_vigente"));
        }
    }

    // ---------------------------------------------------------------- pasta-rede-inacessivel (C4)

    private const string CaminhoFinanceiro = @"\\fileserver.aurora.local\Financeiro";

    /// <summary>
    /// net use: unico comando novo do cenario. Em C1 a C3 e so diagnostico (erro honesto, sem efeito);
    /// em C4 mapear Z: para o Financeiro e a correcao. Os demais comandos seguem o fluxo generico.
    /// </summary>
    private static ResultadoComandoEscala? ExecutarPastaRede(EstadoSessao estado, string comando, DefinicaoCenario cenario)
    {
        const string prefixo = "net use";
        if (!comando.StartsWith(prefixo, StringComparison.OrdinalIgnoreCase)) return null;
        // "net user ..." compartilha o prefixo declarado, mas nao e um comando deste cenario.
        if (comando.Length > prefixo.Length && !char.IsWhiteSpace(comando[prefixo.Length]))
            return Resultado(estado, $"'{comando}' nao faz parte dos comandos declarados para este cenario.");

        var c4 = cenario.Causa == "C4";
        var mapeada = EfeitosDeEventos.StatusServico(estado.Estacao, "UnidadeRedeZ") == "Mapeada";
        var arg = Argumento(comando, prefixo);

        if (arg.Length == 0)
        {
            if (!c4) return Resultado(estado, "Nenhuma conexao de rede ativa.");
            return Resultado(estado, mapeada ? $@"Unidade Z: MAPEADA para {CaminhoFinanceiro}." : "Unidade Z: NAO MAPEADA.");
        }

        var partes = arg.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var pedidoCerto = partes.Length == 2 &&
                          string.Equals(partes[0], "z:", StringComparison.OrdinalIgnoreCase) &&
                          string.Equals(partes[1], CaminhoFinanceiro, StringComparison.OrdinalIgnoreCase);
        if (!pedidoCerto)
            return Resultado(estado, "A letra de unidade ou o caminho nao corresponde ao solicitado (Z: para Financeiro).");

        if (c4)
        {
            if (mapeada) return Resultado(estado, "O comando foi concluido com exito.");
            return Resultado(estado, "O comando foi concluido com exito.",
                Ev("UnidadeRedeMapeada", ("unidade", "Z:"), ("caminho", CaminhoFinanceiro)),
                Ev("AcessoPastaRestabelecido", ("usuario", cenario.UsuarioAlvo), ("causa", cenario.Causa)));
        }

        // C1 a C3: o erro reflete a Causa. Depois que o acesso foi restabelecido por outra via, o mapeamento passa.
        if (estado.Estacao.CompartilhamentoAcessivel) return Resultado(estado, "O comando foi concluido com exito.");
        return Resultado(estado, cenario.Causa switch
        {
            "C1" => "Erro de sistema 5. Acesso negado.",
            "C2" => "Erro de sistema 53. O caminho de rede nao foi encontrado.",
            _ => "Erro de sistema 2250. O servico Workstation nao esta em execucao."
        });
    }

    // ---------------------------------------------------------------- falha-backup-restore

    private const string MensagemExigeElevado = "Erro: a operacao exige privilegio Elevado.";
    private const string CaminhoRestauracao = @"\\fileserver.aurora.local\Financeiro";

    private static ResultadoComandoEscala ExecutarBackup(EstadoSessao estado, string comando, DefinicaoCenario cenario)
    {
        var partes = comando.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var sub = partes.Length > 1 ? partes[1].ToLowerInvariant() : "";
        var acao = partes.Length > 2 ? partes[2].ToLowerInvariant() : "";
        var elevado = estado.Estacao.Privilegio == PrivilegioTerminal.Elevado;
        var status = (string nome) => EfeitosDeEventos.StatusServico(estado.Estacao, nome);

        switch (sub)
        {
            case "status":
                return Resultado(estado,
                    $"JobBackupFinanceiro: {status("JobBackupFinanceiro")} | repositorio bkp-repo.aurora.local | copia imutavel: Disponivel (retencao 30 dias)");

            case "log":
                return Resultado(estado, TextoLogBackup(estado, cenario));

            case "repo" when acao.Length == 0:
                return Resultado(estado, TextoRepositorio(estado, cenario));

            case "repo" when acao == "expandir":
                if (!elevado) return Resultado(estado, MensagemExigeElevado);
                return ExpandirRepositorio(estado, cenario);

            case "repo" when acao == "limpar":
                if (!elevado) return Resultado(estado, MensagemExigeElevado);
                return Resultado(estado,
                    "Pontos antigos removidos. ATENCAO: retencao de 30 dias comprometida.",
                    Ev("AcaoPrejudicialRegistrada",
                        ("categoria", "backup"),
                        ("motivo", "Remocao de pontos de restauracao compromete a retencao")));

            case "job" when acao == "executar":
                return ExecutarJob(estado, cenario);

            case "cadeia" when acao == "verificar":
                return Resultado(estado, TextoCadeia(cenario));

            case "restore":
                if (!elevado) return Resultado(estado, MensagemExigeElevado);
                return Restaurar(estado, comando, cenario);

            case "repo":
                return Resultado(estado, "Argumento invalido para backup repo. Use: expandir ou limpar.");
            case "job":
                return Resultado(estado, "Uso: backup job executar");
            case "cadeia":
                return Resultado(estado, "Uso: backup cadeia verificar");
            default:
                // O prefixo declarado casou so por texto (por exemplo "backup statusx"): nao e um comando do cenario.
                return Resultado(estado, $"'{comando}' nao faz parte dos comandos declarados para este cenario.");
        }
    }

    private static string TextoLogBackup(EstadoSessao estado, DefinicaoCenario cenario)
    {
        var falha = cenario.Causa switch
        {
            "REPOSITORIO_CHEIO" => "[ERROR] Job BKP-FIN-DIARIO falhou: sem espaco no repositorio (capacidade 100%, 0 GB livres).",
            _ => throw new InvalidOperationException($"Causa sem log de backup: {cenario.Causa}")
        };
        return EfeitosDeEventos.StatusServico(estado.Estacao, "JobBackupFinanceiro") == "Succeeded"
            ? falha + " | [INFO] Job BKP-FIN-DIARIO executado manualmente: sucesso."
            : falha;
    }

    private static string TextoRepositorio(EstadoSessao estado, DefinicaoCenario cenario) =>
        cenario.Causa switch
        {
            "REPOSITORIO_CHEIO" => EfeitosDeEventos.StatusServico(estado.Estacao, "RepositorioBackup") == "Expandido"
                ? "Repositorio bkp-repo.aurora.local: 63% usado (capacidade expandida para 160% da anterior)."
                : "Repositorio bkp-repo.aurora.local: 100% usado.",
            _ => throw new InvalidOperationException($"Causa sem estado de repositorio: {cenario.Causa}")
        };

    private static ResultadoComandoEscala ExpandirRepositorio(EstadoSessao estado, DefinicaoCenario cenario)
    {
        if (EfeitosDeEventos.StatusServico(estado.Estacao, "RepositorioBackup") == "Expandido")
            return Resultado(estado, "O repositorio ja foi expandido para 160% da capacidade anterior.");
        return Resultado(estado, "Repositorio expandido para 160% da capacidade anterior.",
            Ev("RepositorioExpandido", ("privilegio", estado.Estacao.Privilegio.ToString())));
    }

    private static ResultadoComandoEscala ExecutarJob(EstadoSessao estado, DefinicaoCenario cenario)
    {
        if (EfeitosDeEventos.StatusServico(estado.Estacao, "JobBackupFinanceiro") == "Succeeded")
            return Resultado(estado, "O job ja foi executado com sucesso; nada a fazer.");
        if (EfeitosDeEventos.StatusServico(estado.Estacao, "RepositorioBackup") != "Expandido")
            return Resultado(estado, "Job falhou: sem espaco no repositorio.");
        return Resultado(estado, "Job executado com sucesso.",
            Ev("BackupConcluido", ("privilegio", estado.Estacao.Privilegio.ToString())));
    }

    private static string TextoCadeia(DefinicaoCenario cenario) =>
        cenario.Causa switch
        {
            "REPOSITORIO_CHEIO" => "Cadeia incremental: INTEGRA. Copia imutavel: INTEGRA.",
            _ => throw new InvalidOperationException($"Causa sem verificacao de cadeia: {cenario.Causa}")
        };

    private static ResultadoComandoEscala Restaurar(EstadoSessao estado, string comando, DefinicaoCenario cenario)
    {
        var partes = comando.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        string? origem = null, destino = null;
        for (var i = 2; i + 1 < partes.Length; i += 2)
        {
            if (string.Equals(partes[i], "--origem", StringComparison.OrdinalIgnoreCase)) origem = partes[i + 1].ToLowerInvariant();
            else if (string.Equals(partes[i], "--destino", StringComparison.OrdinalIgnoreCase)) destino = partes[i + 1];
            else break;
        }
        var argumentosValidos = partes.Length == 6 && origem is "imutavel" or "incremental" &&
                                string.Equals(destino, CaminhoRestauracao, StringComparison.OrdinalIgnoreCase);
        if (!argumentosValidos)
            return Resultado(estado, $@"Uso: backup restore --origem imutavel|incremental --destino {CaminhoRestauracao}");

        return cenario.Causa switch
        {
            "REPOSITORIO_CHEIO" => origem == "imutavel"
                ? Resultado(estado, "Restauracao concluida a partir da copia imutavel. ATENCAO: alteracoes do dia na pasta Financeiro foram sobrescritas.",
                    Ev("AcaoPrejudicialRegistrada",
                        ("categoria", "backup"),
                        ("motivo", "Restauracao sobre dados integros sobrescreve alteracoes do dia")))
                : Resultado(estado, "Restauracao desnecessaria: a pasta Financeiro esta integra."),
            _ => throw new InvalidOperationException($"Causa sem regra de restauracao: {cenario.Causa}")
        };
    }}
