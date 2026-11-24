import type { SessaoProjecao } from '../api/types'

/**
 * Leituras da projeção do motor que o roteiro, a dica e o SimuDesk compartilham. Nenhuma devolve a Causa
 * da sessão: só o que o próprio console já mostra ao aluno (serviços e estado da estação).
 */

/**
 * Cenários em que o motor nunca libera acesso remoto: a ação é feita no console do diretório e a
 * identidade confirmada da titular não gera ID nem PIN do SimuDesk.
 */
const CENARIOS_SEM_ACESSO_REMOTO: readonly string[] = ['reset-senha-desbloqueio']

/** Cenários entregues pela spec cenarios-por-etapa, com solicitante e texto próprios. */
const CENARIOS_COM_SOLICITANTE_PROPRIO: readonly string[] = ['reset-senha-desbloqueio', 'falha-backup-restore']

/** Serviços externos de incidente-massivo. O console os expõe desde o início, como o próprio sintoma. */
const SERVICOS_EXTERNOS: readonly string[] = ['ProvedorEmail', 'DominioPublico']

export function semAcessoRemoto(cenarioId: string): boolean {
  return CENARIOS_SEM_ACESSO_REMOTO.includes(cenarioId)
}

/** Primeiro nome do solicitante do chamado principal, ou 'Maria' nos cenários que sempre a usaram. */
export function primeiroNomeDoCliente(sessao: SessaoProjecao): string {
  if (!CENARIOS_COM_SOLICITANTE_PROPRIO.includes(sessao.meta.cenarioId)) return 'Maria'
  const solicitante = sessao.chamados[0]?.solicitante?.trim() ?? ''
  return solicitante.split(/\s+/)[0] || 'Maria'
}

export function chamadoFechado(status: string | undefined): boolean {
  return status === 'Resolvido' || status === 'Encerrado'
}

/**
 * Em incidente-massivo, o serviço que já nasce parado ou suspenso fora da empresa, se houver. A leitura
 * serve só para saber se o serviço foi restabelecido, não para dizer ao aluno onde está a falha.
 */
export function servicoExterno(sessao: SessaoProjecao) {
  return sessao.estacao.servicos.find((servico) => SERVICOS_EXTERNOS.includes(servico.nome))
}

/** O serviço afetado voltou: AuroraGateway em execução, ou o serviço externo restabelecido. */
export function incidenteMassivoRestabelecido(sessao: SessaoProjecao): boolean {
  const externo = servicoExterno(sessao)
  if (externo) return externo.status === 'Restabelecido'
  return sessao.estacao.servicos.some((servico) => servico.nome === 'AuroraGateway' && servico.status === 'Running')
}
