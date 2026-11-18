import { criarAmbienteDoNavegador, inicializarAparencia } from './inicializacao.ts'

inicializarAparencia(criarAmbienteDoNavegador(window, (mensagem) => console.warn(mensagem)))
