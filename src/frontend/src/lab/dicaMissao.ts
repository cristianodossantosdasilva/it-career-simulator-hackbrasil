import type { SessaoProjecao } from '../api/types'
import { TEXTOS_WORKSTATION } from '../textos/workstation'
import { chamadoFechado, incidenteMassivoRestabelecido } from './estadoDoCenario'

const TI = TEXTOS_WORKSTATION.itsm

export function obterProximaDicaMissao(
  sessao: SessaoProjecao,
  passosTriagem?: { politica: boolean; token: boolean; recusado: boolean },
): string {
  const cenario = sessao.meta.cenarioId
  const ch1 = sessao.chamados[0]
  if (!ch1) return 'Explore a Workstation.'
  if (cenario === 'triagem-engenharia-social') {
    if (ch1.status === 'Novo') return `1) Clique em "${TI.assumirChamado}" no ITSM.`
    if (!passosTriagem?.politica) {
      return `2) Clique em "${TI.consultarPolitica}" em Ações de segurança, no ITSM.`
    }
    if (!passosTriagem?.token) {
      return `3) Clique em "${TI.solicitarToken}" para verificar a identidade do solicitante.`
    }
    if (ch1.notas.every((n) => n.tipo !== 'Interna')) {
      return '4) Registre uma nota interna no chamado documentando a tentativa sem token.'
    }
    if (!passosTriagem?.recusado) return `5) Clique em "${TI.recusarReset}" em Ações de segurança, no ITSM.`
    if (ch1.status !== 'Resolvido' && ch1.status !== 'Encerrado') {
      return `6) Em "Encerrar a recusa", escreva a nota pública e clique em "${TI.resolverChamado}".`
    }
    return 'Missão concluída! Abra "Juiz 360º e Replay" para conferir sua nota e seu Currículo Vivo.'
  }
  if (cenario === 'incidente-massivo') {
    if (sessao.chamados.every((c) => c.status === 'Novo')) {
      return '1) Assuma um chamado no ITSM (classifique se precisar resolver individualmente) e crie um problema ITIL.'
    }
    if (sessao.problemas.length === 0) return '2) Crie um problema ITIL no ITSM e vincule os 3 chamados.'
    if (!sessao.dialogo.acessoRemotoLiberado) {
      return '3) Valide a identidade da Maria no Comunicador IA (AUR-1042 / 2042) para liberar o SimuDesk.'
    }
    if (!incidenteMassivoRestabelecido(sessao)) {
      return '4) No SimuDesk, investigue logs, serviços e comandos de diagnóstico antes de agir. Confirme onde está a falha e só então corrija ou acione quem pode corrigir.'
    }
    if (!sessao.problemas.some((p) => p.resolvido)) {
      return '5) Informe os solicitantes com uma nota pública, registre a causa raiz no problema (o que falhou e por quê) e resolva em lote.'
    }
    return 'Incidente massivo resolvido! Confira o Juiz 360º e Replay.'
  }
  if (cenario === 'sre-cloud-latencia') {
    if (ch1.status === 'Novo') return '1) Assuma e classifique o incidente SRE CH-0001 no ITSM.'
    if (!sessao.dialogo.acessoRemotoLiberado) return '2) Valide a identidade da Maria no Comunicador IA (AUR-1042 / 2042) para liberar o SimuDesk.'
    if (!sessao.estacao.compartilhamentoAcessivel) return '3) No SimuDesk, diagnostique pods, logs e curl, eleve o privilégio e aplique a mitigação.'
    if (ch1.status !== 'Resolvido' && ch1.status !== 'Encerrado') return '4) Resolva o chamado CH-0001 com nota de post-mortem.'
    return 'Incidente SRE mitigado! Confira o Juiz 360º e Replay.'
  }
  if (cenario === 'reset-senha-desbloqueio') {
    if (ch1.status === 'Novo') return '1) Assuma e classifique o chamado principal no ITSM.'
    if (!sessao.dialogo.identidadeValidada) {
      return '2) Confirme quem é a dona da conta. Se o pedido veio de outra pessoa, use o ramal do diretório (SimuDesk) e valide matrícula e ramal no Comunicador.'
    }
    if (!sessao.estacao.compartilhamentoAcessivel) {
      return '3) No SimuDesk, consulte o estado da conta e escolha a menor ação que resolve o sintoma.'
    }
    if (!chamadoFechado(ch1.status)) return '4) Resolva o chamado com uma nota pública que diga o que foi feito e por quê.'
    return 'Atendimento concluído! Confira o Juiz 360º e Replay.'
  }
  if (cenario === 'falha-backup-restore') {
    if (ch1.status === 'Novo') return '1) Assuma e classifique o chamado principal no ITSM.'
    if (!sessao.dialogo.acessoRemotoLiberado) {
      return '2) Valide a identidade de quem pede no Comunicador (AUR-1042 / 2042) para liberar o SimuDesk.'
    }
    if (!sessao.estacao.compartilhamentoAcessivel) {
      return '3) No SimuDesk, comece pelo estado e pelo log do job, compare repositório e cadeia e só então corrija, com privilégio elevado.'
    }
    if (!chamadoFechado(ch1.status)) return '4) Confirme com o dono da pasta e resolva o chamado com uma nota pública.'
    return 'Backup tratado! Confira o Juiz 360º e Replay.'
  }
  if (cenario === 'diagnostico-sql-readonly') {
    if (ch1.status === 'Novo') return '1) Assuma e classifique o chamado de auditoria SQL CH-0001 no ITSM.'
    if (!sessao.dialogo.acessoRemotoLiberado) return '2) Valide a identidade da Maria no Comunicador IA (AUR-1042 / 2042) para liberar o console SQL.'
    if (ch1.status !== 'Resolvido' && ch1.status !== 'Encerrado') return '3) Execute SELECT somente leitura no SimuDesk (sem escrita) e resolva o chamado com o diagnóstico.'
    return 'Auditoria SQL concluída! Confira o Juiz 360º e Replay.'
  }
  if (ch1.status === 'Novo') return '1) Assuma e classifique o chamado CH-0001 no ITSM: incidente ou solicitação de serviço.'
  if (!sessao.dialogo.acessoRemotoLiberado) return '2) Valide a identidade da Maria no Comunicador (AUR-1042 / 2042) para liberar o SimuDesk.'
  if (!sessao.estacao.compartilhamentoAcessivel) return '3) No SimuDesk, execute o diagnóstico antes de alterar e atenda o que o chamado pede.'
  if (ch1.status !== 'Resolvido' && ch1.status !== 'Encerrado') return '4) Resolva o chamado CH-0001 no ITSM com nota pública.'
  return 'Atendimento concluído! Confira o relatório do Juiz 360º e seu Currículo Vivo.'
}
