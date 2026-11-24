/** Seção "Transparência do escopo": o que a demo implementa, o roteiro pós-hackathon e o aviso de dados. */
export function TransparenciaEscopo() {
  return (
    <section className="edu-card card-b" aria-labelledby="escopo-titulo">
      <h2 id="escopo-titulo" className="h2">
        Transparência do escopo: demo do hackathon e roteiro do curso livre
      </h2>
      <div className="scope-grid">
        <div className="scope-card">
          <h3>Implementado nesta demo</h3>
          <ul>
            <li>
              Academia completa: painel, aulas com recordação ativa e SM-2, caderno estilo Cornell e Mentor com Feynman
              e STAR.
            </li>
            <li>
              Workstation determinística com 5 cenários jogáveis, ITSM, Comunicador auditável e SimuDesk (Terminal, AD,
              DNS, Logs, SRE e SQL somente leitura).
            </li>
            <li>Base de Conhecimento (26 artigos), Revisão Replay e Juiz 360º com assinatura ECDSA P-256.</li>
          </ul>
        </div>
        <div className="scope-card">
          <h3>Roteiro pós-hackathon (ondas 1 a 4)</h3>
          <ul>
            <li>
              Trilha integral de 560h (UC1 a UC8), persistência multi-tenant em PostgreSQL e simulados PBQ autorais.
            </li>
            <li>
              8 laboratórios interativos dedicados (Hardware ESD, Multi-OS, Cabeamento e Wi-Fi RF, M365, Servidores,
              Firewall, Data Center e Blue Team).
            </li>
            <li>Chamada por voz e vídeo com personas de IA sob teto orçamentário e certificado de curso livre.</li>
          </ul>
        </div>
      </div>
      <p className="muted mt">
        <strong>Aviso de dados e natureza:</strong> simulador educacional gratuito de demonstração em curso livre.
        Opera em sessão anônima, sem login, e usa apenas dados 100% sintéticos (empresa fictícia Aurora Logística). Não
        emite diploma técnico oficial nem certificação de terceiros.
      </p>
    </section>
  )
}
