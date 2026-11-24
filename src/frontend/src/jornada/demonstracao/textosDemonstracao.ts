/**
 * Textos do Modo_de_Demonstração, do Atalho_Experimentar e do Diagnóstico_Rápido. Só texto: nada aqui lê
 * armazenamento, chama a API ou decide estado.
 */
export const ANUNCIO_MODO_ATIVADO =
  'Modo de demonstração ativado. Todas as etapas estão liberadas. A liberação não conta como missão concluída.'
export const ANUNCIO_MODO_DESATIVADO = 'Modo de demonstração desativado. As etapas seguem as missões concluídas.'

export const AVISO_FALHA_GRAVACAO_MODO =
  'Não foi possível guardar a escolha do modo de demonstração neste navegador. Ela vale só até você recarregar a página.'

export const TITULO_SECAO_MODO = 'Modo de demonstração'
export const ROTULO_CONTROLE_MODO = 'Liberar todas as etapas para demonstração'
export const ESTADO_MODO_ATIVADO = 'Ativado'
export const ESTADO_MODO_DESATIVADO = 'Desativado'
export const EXPLICACAO_MODO =
  'Atalho para conhecer todas as etapas. Libera o perfil em todas elas. A liberação não conta como missão concluída e não muda a avaliação do Juiz 360º.'

export const TEXTO_SELO_DEMONSTRACAO = 'Liberada para demonstração'

/** Texto de apoio da etapa que só o modo liberou. `etapaAnterior` é o nome da etapa que falta concluir. */
export function textoLiberadaSoParaDemonstracao(etapaAnterior: string): string {
  return `Liberada só para demonstração. Conclua ${etapaAnterior} para liberar pelas missões.`
}

export const ROTULO_ATALHO_EXPERIMENTAR = 'Atender meu primeiro chamado'
export const APOIO_ATALHO_EXPERIMENTAR =
  'Leva ao diagnóstico rápido, com respostas padrão, e depois ao seu primeiro chamado de suporte. Não conta como missão concluída.'

export const TITULO_DIAGNOSTICO_RAPIDO = 'Diagnóstico rápido'
export const ROTULO_CONFIRMAR_DIAGNOSTICO_RAPIDO = 'Confirmar e iniciar'
export const ROTULO_DIAGNOSTICO_COMPLETO = 'Fazer o diagnóstico completo'
export const AVISO_CARTAO_NO_DIAGNOSTICO_RAPIDO =
  'Você já tem cartão de perfil. Para experimentar uma missão sem trocar o cartão, use o botão abaixo.'
export const AVISO_CARTAO_DO_DIAGNOSTICO_RAPIDO = 'Cartão gerado pelo diagnóstico rápido, com respostas padrão.'
export const TEXTO_INDICADOR_MODO = 'Modo de demonstração ativo'
