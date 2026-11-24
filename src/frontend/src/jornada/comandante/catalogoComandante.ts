import type { IdPagina } from '../navegacao/rotas'

export type PapelComandante = 'consultor' | 'instrutor' | 'copiloto' | 'mentor'

export interface DefinicaoPapel {
  id: PapelComandante
  nome: 'Consultor' | 'Instrutor' | 'Copiloto' | 'Mentor'
  resumo: string
  faz: readonly string[]
  naoFaz: readonly string[]
  abertura: Partial<Record<IdPagina, string>>
  sugestoes: readonly { pergunta: string; resposta: string }[]
}

/** Texto fixo que o Mentor repete na Caixa-preta e no Portfólio (Requirement 11.6). */
export const AVISO_JUIZ = 'Quem avalia é o Juiz 360º da plataforma, não este guia'

export const PAPEIS: Readonly<Record<PapelComandante, DefinicaoPapel>> = {
  consultor: {
    id: 'consultor',
    nome: 'Consultor',
    resumo: 'Ajuda a escolher por onde começar e explica o diagnóstico.',
    faz: ['Explica as perguntas do diagnóstico', 'Mostra o que cada rota pratica', 'Indica o próximo passo da jornada'],
    naoFaz: ['Não escolhe a rota por você', 'Não promete emprego nem certificação'],
    abertura: {
      inicio: 'Olá. Sou o Mentor no papel Consultor. Posso explicar como o diagnóstico indica uma rota.',
      'check-in': 'Responda com calma. Não há resposta certa: o diagnóstico só indica um ponto de partida.',
    },
    sugestoes: [
      {
        pergunta: 'Como funciona o diagnóstico?',
        resposta: 'São três perguntas curtas. A indicação sai de uma regra simples, mostrada junto do resultado.',
      },
      {
        pergunta: 'Preciso saber programar?',
        resposta: 'Não. A rota Suporte de TI começa pelo atendimento ao usuário e pela investigação de causa.',
      },
    ],
  },
  instrutor: {
    id: 'instrutor',
    nome: 'Instrutor',
    resumo: 'Explica as etapas, as missões e o que libera a próxima etapa.',
    faz: ['Explica cada etapa da rota', 'Diz o que falta para liberar a próxima etapa', 'Sugere aulas antes da missão'],
    naoFaz: ['Não libera etapa sem missão registrado', 'Não altera o Cartão de Perfil'],
    abertura: {
      'plano-de-voo': 'Sou o Mentor no papel Instrutor. Cada etapa libera a seguinte quando as missões dela ficam registrados.',
    },
    sugestoes: [
      {
        pergunta: 'Como libero a próxima etapa?',
        resposta: 'Conclua as missões disponíveis da etapa atual. O registro de cada missão fica guardado neste navegador.',
      },
      {
        pergunta: 'O que significa em preparação?',
        resposta: 'O cenário aparece no plano, mas ainda não está disponível no simulador. Ele não bloqueia a sua rota.',
      },
    ],
  },
  copiloto: {
    id: 'copiloto',
    nome: 'Copiloto',
    resumo: 'Acompanha a missão na Mesa de Trabalho e sugere o próximo passo do atendimento.',
    faz: ['Sugere o próximo passo pela situação do chamado', 'Explica termos técnicos da missão'],
    naoFaz: ['Não executa ações no simulador', 'Não resolve o chamado por você'],
    abertura: {
      cabine: 'Sou o Mentor no papel Copiloto. Pergunte "O que faço agora?" se travar.',
    },
    sugestoes: [
      {
        pergunta: 'O que é DNS?',
        resposta: 'DNS traduz nomes, como servidor.aurora.local, em endereços IP. Registro errado leva ao servidor errado.',
      },
      {
        pergunta: 'O que é engenharia social?',
        resposta: 'É a tentativa de obter acesso enganando pessoas. Valide a identidade antes de qualquer reset de senha.',
      },
    ],
  },
  mentor: {
    id: 'mentor',
    nome: 'Mentor',
    resumo: 'Ajuda a ler a linha do tempo da missão e a planejar o próximo treino.',
    faz: ['Explica como ler a linha do tempo da Caixa-preta', 'Sugere o que treinar no próximo missão'],
    naoFaz: ['Não dá nota', 'Não aprova nem reprova', 'Não altera o Registro de Missão'],
    abertura: {
      'caixa-preta': `Sou o Mentor no papel Mentor. A linha do tempo mostra cada ação na ordem em que aconteceu. ${AVISO_JUIZ}.`,
      breve: `Sou o Mentor no papel Mentor. O Portfólio reúne as missões registrados neste navegador. ${AVISO_JUIZ}.`,
    },
    sugestoes: [
      {
        pergunta: 'Como leio a linha do tempo?',
        resposta: 'Cada linha é um evento registrado pelo motor, com o minuto simulado. Os critérios apontam o evento que os comprovou.',
      },
      {
        pergunta: 'O que treino agora?',
        resposta: 'Repita a missão e tente cumprir os critérios que ficaram pendentes, consultando a KB antes de agir.',
      },
    ],
  },
}

export const PAPEL_POR_PAGINA: Partial<Record<IdPagina, PapelComandante>> = {
  inicio: 'consultor',
  'check-in': 'consultor',
  'plano-de-voo': 'instrutor',
  cabine: 'copiloto',
  'caixa-preta': 'mentor',
  breve: 'mentor',
}

export function papelPorPagina(pagina: IdPagina): PapelComandante | null {
  return PAPEL_POR_PAGINA[pagina] ?? null
}
