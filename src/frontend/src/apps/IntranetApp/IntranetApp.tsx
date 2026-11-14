import { useState } from 'react'

const ARTIGOS = [
  {
    id: 'KB-001',
    titulo: 'Politica de Verificacao de Identidade e Acesso Remoto',
    conteudo:
      'Antes de liberar acesso remoto (SimuDesk) ou resetar senhas, confirme Matricula e Ramal do colaborador. Nunca atenda pedidos urgentes sem validacao, mesmo de supostos diretores.',
  },
  {
    id: 'KB-002',
    titulo: 'Topologia e Acesso a Pasta Financeiro (Aurora Logistica)',
    conteudo:
      'Servidor de arquivos: fileserver.aurora.local (IP esperado: 10.10.20.15). Grupo de acesso obrigatorio: GRP_FINANCEIRO_PASTA. Servico critico na estacao: Workstation.',
  },
  {
    id: 'KB-003',
    titulo: 'Runbook N1: Diagnostico de Pasta de Rede Inacessivel',
    conteudo:
      '1) Execute diagnostico antes de alterar a estacao (whoami /groups, nslookup, ping, net start). 2) Se grupo ausente, eleve privilegio e adicione ao grupo. 3) Se DNS apontar IP diferente de 10.10.20.15, escalone para N2. 4) Se servico Workstation parado, inicie o servico com privilegio elevado.',
  },
]

export function IntranetApp() {
  const [busca, setBusca] = useState('')
  const filtrados = ARTIGOS.filter(
    (a) =>
      a.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      a.conteudo.toLowerCase().includes(busca.toLowerCase()),
  )

  return (
    <section className="panel" aria-label="Intranet e Base de Conhecimento">
      <div className="row-between">
        <h2>Intranet — Base de Conhecimento (Aurora Logistica)</h2>
        <input
          aria-label="Buscar na Base de Conhecimento"
          placeholder="Buscar procedimento..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>
      <div className="kb-list">
        {filtrados.map((a) => (
          <article key={a.id} className="card-section">
            <h3>
              {a.id} — {a.titulo}
            </h3>
            <p>{a.conteudo}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
