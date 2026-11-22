/**
 * Textos do Modo_de_Demonstração, do Atalho_Experimentar e do Check-in_Rápido. Só texto: nada aqui lê
 * armazenamento, chama a API ou decide estado.
 */
export const ANUNCIO_MODO_ATIVADO =
  'Modo de demonstração ativado. Todas as escalas estão liberadas. A liberação não conta como voo concluído.'
export const ANUNCIO_MODO_DESATIVADO = 'Modo de demonstração desativado. As escalas seguem os voos concluídos.'

export const AVISO_FALHA_GRAVACAO_MODO =
  'Não foi possível guardar a escolha do modo de demonstração neste navegador. Ela vale só até você recarregar a página.'

export const TITULO_SECAO_MODO = 'Modo de demonstração'
export const ROTULO_CONTROLE_MODO = 'Liberar todas as escalas para demonstração'
export const ESTADO_MODO_ATIVADO = 'Ativado'
export const ESTADO_MODO_DESATIVADO = 'Desativado'
export const EXPLICACAO_MODO =
  'Atalho para conhecer todas as escalas. Libera o embarque em todas elas. A liberação não conta como voo concluído e não muda a avaliação do Juiz 360º.'

export const TEXTO_SELO_DEMONSTRACAO = 'Liberada para demonstração'

/** Texto de apoio da escala que só o modo liberou. `escalaAnterior` é o nome da escala que falta concluir. */
export function textoLiberadaSoParaDemonstracao(escalaAnterior: string): string {
  return `Liberada só para demonstração. Conclua ${escalaAnterior} para liberar pelos voos.`
}

export const ROTULO_ATALHO_EXPERIMENTAR = 'Atender meu primeiro chamado'
export const APOIO_ATALHO_EXPERIMENTAR =
  'Leva ao check-in rápido, com respostas padrão, e depois ao seu primeiro chamado de suporte. Não conta como voo concluído.'

export const TITULO_CHECKIN_RAPIDO = 'Check-in rápido'
export const ROTULO_CONFIRMAR_CHECKIN_RAPIDO = 'Confirmar e embarcar'
export const ROTULO_CHECKIN_COMPLETO = 'Fazer o check-in completo'
export const AVISO_CARTAO_NO_CHECKIN_RAPIDO =
  'Você já tem cartão de embarque. Para experimentar um voo sem trocar o cartão, use o botão abaixo.'
export const AVISO_CARTAO_DO_CHECKIN_RAPIDO = 'Cartão gerado pelo check-in rápido, com respostas padrão.'
export const TEXTO_INDICADOR_MODO = 'Modo de demonstração ativo'
