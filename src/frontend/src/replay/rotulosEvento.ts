import type { NomeIcone } from '../ui/catalogoIcones'

/** Ferramenta da Workstation onde o evento acontece. Define o ícone do marcador na linha do tempo. */
export type OrigemEvento = 'itsm' | 'chat' | 'simudesk' | 'seguranca' | 'kb' | 'sistema'

interface RotuloEvento {
  rotulo: string
  origem: OrigemEvento
  /** Eventos que indicam risco ou ação prejudicial. O texto "Evento de risco" acompanha o ícone. */
  risco?: boolean
}

/** Tipos gerados pelo motor (Simulador.Dominio). Um tipo desconhecido aparece com o nome técnico. */
const EVENTOS: Record<string, RotuloEvento> = {
  SessaoIniciada: { rotulo: 'Sessão iniciada', origem: 'sistema' },
  ChamadoAberto: { rotulo: 'Chamado aberto', origem: 'itsm' },
  ChamadoAssumido: { rotulo: 'Chamado assumido', origem: 'itsm' },
  ChamadoClassificado: { rotulo: 'Chamado classificado', origem: 'itsm' },
  ChamadoEscalonado: { rotulo: 'Chamado escalonado', origem: 'itsm' },
  ChamadoResolvido: { rotulo: 'Chamado resolvido', origem: 'itsm' },
  ChamadoEncerrado: { rotulo: 'Chamado encerrado', origem: 'itsm' },
  ChamadoVinculadoAProblema: { rotulo: 'Chamado vinculado a problema', origem: 'itsm' },
  NotaChamadoAdicionada: { rotulo: 'Nota registrada no chamado', origem: 'itsm' },
  ProblemaCriado: { rotulo: 'Problema criado', origem: 'itsm' },
  ProblemaResolvidoEmLote: { rotulo: 'Problema resolvido em lote', origem: 'itsm' },
  CausaRaizRegistrada: { rotulo: 'Causa raiz registrada', origem: 'itsm' },
  SlaVencido: { rotulo: 'SLA vencido', origem: 'itsm', risco: true },
  MensagemUsuarioEnviada: { rotulo: 'Mensagem enviada ao solicitante', origem: 'chat' },
  MensagemPersonaRecebida: { rotulo: 'Resposta do solicitante', origem: 'chat' },
  PistaSolicitada: { rotulo: 'Pista solicitada', origem: 'chat' },
  UsuarioConfirmouFuncionamento: { rotulo: 'Solicitante confirmou o funcionamento', origem: 'chat' },
  IdentidadeVerificada: { rotulo: 'Identidade verificada', origem: 'seguranca' },
  IdentidadeNaoConfere: { rotulo: 'Identidade não confere', origem: 'seguranca' },
  PoliticaSegurancaConsultada: { rotulo: 'Política de segurança consultada', origem: 'kb' },
  TokenSolicitado: { rotulo: 'Token corporativo solicitado', origem: 'seguranca' },
  ResetRecusado: { rotulo: 'Reset recusado sem validação', origem: 'seguranca' },
  SenhaResetadaIndevidamente: { rotulo: 'Senha resetada sem validação', origem: 'seguranca', risco: true },
  AcaoPrejudicialRegistrada: { rotulo: 'Ação prejudicial registrada', origem: 'seguranca', risco: true },
  AcessoRemotoLiberado: { rotulo: 'Acesso remoto liberado', origem: 'simudesk' },
  ComandoExecutado: { rotulo: 'Comando executado', origem: 'simudesk' },
  ComandoNaoSuportado: { rotulo: 'Comando não suportado', origem: 'simudesk' },
  LogsConsultados: { rotulo: 'Logs consultados', origem: 'simudesk' },
  ServicoConsultado: { rotulo: 'Serviço consultado', origem: 'simudesk' },
  ServicoIniciado: { rotulo: 'Serviço iniciado', origem: 'simudesk' },
  ServicoReiniciado: { rotulo: 'Serviço reiniciado', origem: 'simudesk' },
  PrivilegioAlterado: { rotulo: 'Privilégio alterado', origem: 'simudesk' },
  UsuarioAdicionadoAoGrupo: { rotulo: 'Usuário adicionado ao grupo', origem: 'simudesk' },
  AcessoPastaRestabelecido: { rotulo: 'Acesso à pasta restabelecido', origem: 'simudesk' },
  DnsRegistroCorrigido: { rotulo: 'Registro DNS corrigido', origem: 'simudesk' },
  FirewallDesativado: { rotulo: 'Firewall desativado', origem: 'simudesk', risco: true },
  // Reset e desbloqueio de conta (reset-senha-desbloqueio).
  TitularContatado: { rotulo: 'Titular contatada pelo ramal cadastrado', origem: 'simudesk' },
  AcaoSensivelSemVerificacao: { rotulo: 'Ação sensível sem identidade verificada', origem: 'seguranca', risco: true },
  AcaoDesnecessariaRegistrada: { rotulo: 'Ação desnecessária registrada', origem: 'simudesk' },
  OrigemBloqueioIdentificada: { rotulo: 'Origem do bloqueio identificada', origem: 'simudesk' },
  SenhaTemporariaDefinida: { rotulo: 'Senha temporária definida', origem: 'simudesk' },
  ContaDesbloqueada: { rotulo: 'Conta desbloqueada', origem: 'simudesk' },
  ContaBloqueadaNovamente: { rotulo: 'Conta bloqueada de novo', origem: 'simudesk', risco: true },
  SenhaTrocadaPelaPessoa: { rotulo: 'Senha trocada pela própria titular', origem: 'simudesk' },
  OrientacaoRegistrada: { rotulo: 'Orientação à titular registrada', origem: 'simudesk' },
  AcessoContaRestabelecido: { rotulo: 'Acesso da conta restabelecido', origem: 'simudesk' },
  // Pedido de mapeamento de unidade de rede (pasta-rede-inacessivel).
  UnidadeRedeMapeada: { rotulo: 'Unidade de rede mapeada', origem: 'simudesk' },
  // Backup e restauração (falha-backup-restore).
  RepositorioExpandido: { rotulo: 'Repositório de backup expandido', origem: 'simudesk' },
  BackupConcluido: { rotulo: 'Backup concluído', origem: 'simudesk' },
  PastaFinanceiroRestaurada: { rotulo: 'Pasta Financeiro restaurada', origem: 'simudesk' },
  // Falha de fornecedor externo (incidente-massivo).
  EvidenciaExternaConfirmada: { rotulo: 'Evidência da falha externa confirmada', origem: 'simudesk' },
  AreaAcionada: { rotulo: 'Área ou fornecedor acionado', origem: 'simudesk' },
  AcompanhamentoRegistrado: { rotulo: 'Acompanhamento do fornecedor registrado', origem: 'simudesk' },
  ServicoExternoRestabelecido: { rotulo: 'Serviço externo restabelecido', origem: 'simudesk' },
  AcaoRejeitada: { rotulo: 'Ação rejeitada pelo motor', origem: 'sistema' },
}

export function rotuloDoEvento(tipo: string): string {
  return EVENTOS[tipo]?.rotulo ?? tipo
}

export function origemDoEvento(tipo: string): OrigemEvento {
  return EVENTOS[tipo]?.origem ?? 'sistema'
}

export function eventoDeRisco(tipo: string): boolean {
  return EVENTOS[tipo]?.risco === true
}

export const ICONE_ORIGEM: Record<OrigemEvento, NomeIcone> = {
  itsm: 'chamado',
  chat: 'conversa',
  simudesk: 'remoto',
  seguranca: 'verificar',
  kb: 'base',
  sistema: 'info',
}

export const ROTULO_ORIGEM: Record<OrigemEvento, string> = {
  itsm: 'ITSM',
  chat: 'Comunicador',
  simudesk: 'SimuDesk',
  seguranca: 'Segurança',
  kb: 'Base de conhecimento',
  sistema: 'Sistema',
}
