import type { NavIconName } from '@/lib/navigation';

export interface ModulePageConfig {
  slug: string;
  moduleKey: string;
  permission: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: NavIconName;
  capabilities: string[];
}

export const modulePages: Record<string, ModulePageConfig> = {
  agenda: {
    slug: 'agenda',
    moduleKey: 'agenda',
    permission: 'agenda:view',
    eyebrow: 'Operação',
    title: 'Agenda',
    description:
      'Organize horários por profissional e unidade, confirme presenças e acompanhe a lista de espera.',
    icon: 'calendar-days',
    capabilities: [
      'Visão diária e semanal por profissional',
      'Confirmação de presença e lembretes',
      'Bloqueio de horários e lista de espera',
      'Check-in e encaixe de pacientes',
    ],
  },
  consultas: {
    slug: 'consultas',
    moduleKey: 'consultas',
    permission: 'consultas:view',
    eyebrow: 'Operação',
    title: 'Consultas',
    description:
      'Acompanhe o status dos atendimentos, do check-in à conclusão, com histórico por paciente.',
    icon: 'stethoscope',
    capabilities: [
      'Fila de atendimento em tempo real',
      'Histórico por período e profissional',
      'Registro de início e conclusão',
      'Vínculo com prontuário e financeiro',
    ],
  },
  prontuarios: {
    slug: 'prontuarios',
    moduleKey: 'prontuarios',
    permission: 'prontuarios:view',
    eyebrow: 'Clínico',
    title: 'Prontuários',
    description:
      'Documentação clínica versionada, com assinatura, controle de acesso e trilha de auditoria.',
    icon: 'file-text',
    capabilities: [
      'Anamnese, evolução e histórico médico',
      'Alergias e diagnósticos CID-10',
      'Assinatura com hash e versionamento',
      'Acesso restrito ao profissional e administrador',
    ],
  },
  prescricoes: {
    slug: 'prescricoes',
    moduleKey: 'prescricoes',
    permission: 'prescricoes:view',
    eyebrow: 'Clínico',
    title: 'Prescrições',
    description:
      'Emissão de receitas com catálogo de medicamentos, assinatura e código de verificação.',
    icon: 'pill',
    capabilities: [
      'Receitas simples e de controle especial',
      'Catálogo de medicamentos e modelos',
      'Assinatura digital e código de verificação',
      'Cancelamento com justificativa auditada',
    ],
  },
  exames: {
    slug: 'exames',
    moduleKey: 'exames',
    permission: 'exames:view',
    eyebrow: 'Clínico',
    title: 'Exames',
    description:
      'Solicitações, acompanhamento de pendências e liberação de resultados com rastreabilidade.',
    icon: 'flask-conical',
    capabilities: [
      'Pedidos com múltiplos exames e prioridade',
      'Acompanhamento de coleta e análise',
      'Anexação e liberação de laudos',
      'Notificação de resultado ao paciente',
    ],
  },
  financeiro: {
    slug: 'financeiro',
    moduleKey: 'financeiro',
    permission: 'financeiro:view',
    eyebrow: 'Gestão',
    title: 'Financeiro',
    description:
      'Contas a pagar e receber, fluxo de caixa, faturamento e conciliação com auditoria.',
    icon: 'wallet',
    capabilities: [
      'Lançamentos de receitas e despesas',
      'Fluxo de caixa e saldo consolidado',
      'Faturamento por atendimento e convênio',
      'Comissões e relatórios financeiros',
    ],
  },
  convenios: {
    slug: 'convenios',
    moduleKey: 'convenios',
    permission: 'convenios:view',
    eyebrow: 'Gestão',
    title: 'Convênios',
    description:
      'Operadoras, contratos, guias, autorizações, faturamento e tratamento de glosas.',
    icon: 'shield-check',
    capabilities: [
      'Cadastro de operadoras e contratos',
      'Emissão e acompanhamento de guias',
      'Autorizações e faturamento',
      'Recursos de glosa e conciliação',
    ],
  },
  estoque: {
    slug: 'estoque',
    moduleKey: 'estoque',
    permission: 'estoque:view',
    eyebrow: 'Gestão',
    title: 'Estoque',
    description:
      'Produtos, insumos e movimentações com alerta de estoque mínimo e controle de validade.',
    icon: 'package',
    capabilities: [
      'Cadastro de produtos e insumos',
      'Entradas, saídas e ajustes',
      'Alerta de estoque mínimo',
      'Controle de lotes e validade',
    ],
  },
  pacientes: {
    slug: 'pacientes',
    moduleKey: 'pacientes',
    permission: 'pacientes:view',
    eyebrow: 'Cadastros',
    title: 'Pacientes',
    description:
      'Cadastro completo com consentimento LGPD, histórico e proteção de dados sensíveis.',
    icon: 'users',
    capabilities: [
      'Busca por nome, CPF ou telefone',
      'Consentimento e evidências LGPD',
      'Mascaramento de CPF por perfil',
      'Histórico de atendimentos e documentos',
    ],
  },
  profissionais: {
    slug: 'profissionais',
    moduleKey: 'medicos',
    permission: 'medicos:view',
    eyebrow: 'Cadastros',
    title: 'Médicos e profissionais',
    description:
      'Corpo clínico com conselho, especialidades, valores de consulta e vínculo com unidades.',
    icon: 'user-round-cog',
    capabilities: [
      'Cadastro com CRM e UF',
      'Especialidades e valores de consulta',
      'Duração padrão e comissão',
      'Vínculo com uma ou mais unidades',
    ],
  },
  unidades: {
    slug: 'unidades',
    moduleKey: 'unidades',
    permission: 'unidades:view',
    eyebrow: 'Cadastros',
    title: 'Unidades',
    description:
      'Matriz, filiais e consultórios com endereço, responsável e horário de funcionamento.',
    icon: 'building',
    capabilities: [
      'Cadastro de matriz e filiais',
      'Endereço e contatos por unidade',
      'Vínculo de profissionais',
      'Horários e status de operação',
    ],
  },
  ia: {
    slug: 'ia',
    moduleKey: 'ia',
    permission: 'ia:use',
    eyebrow: 'Relacionamento',
    title: 'Assistente de IA',
    description:
      'Apoio à documentação e organização clínica, sempre com revisão humana e sem decisão autônoma.',
    icon: 'sparkles',
    capabilities: [
      'Apoio à redação de documentos',
      'Resumo de prontuário para revisão',
      'Busca inteligente com minimização de dados',
      'Registro de uso e guardrails de segurança',
    ],
  },
  whatsapp: {
    slug: 'whatsapp',
    moduleKey: 'whatsapp',
    permission: 'whatsapp:view',
    eyebrow: 'Relacionamento',
    title: 'WhatsApp',
    description:
      'Lembretes, templates aprovados e histórico de mensagens com status de entrega.',
    icon: 'message-circle',
    capabilities: [
      'Lembretes de consulta',
      'Templates de mensagem aprovados',
      'Histórico e status de entrega',
      'Vínculo com a agenda do paciente',
    ],
  },
  portal: {
    slug: 'portal',
    moduleKey: 'portal',
    permission: 'portal:view',
    eyebrow: 'Relacionamento',
    title: 'Portal do paciente',
    description:
      'Gerencie o acesso do paciente às próprias consultas, resultados e documentos.',
    icon: 'globe',
    capabilities: [
      'Concessão e revogação de acesso',
      'Consulta à agenda e histórico',
      'Resultados liberados pelo profissional',
      'Documentos e receitas assinadas',
    ],
  },
  usuarios: {
    slug: 'usuarios',
    moduleKey: 'usuarios',
    permission: 'usuarios:view',
    eyebrow: 'Sistema',
    title: 'Usuários e permissões',
    description:
      'Equipe, perfis, unidades e matriz de permissões aplicada no servidor.',
    icon: 'user-cog',
    capabilities: [
      'Convites e aceite de novos usuários',
      'Perfis e vínculo com unidades',
      'Matriz de permissões por papel',
      'Auditoria de acessos e ações',
    ],
  },
  assinatura: {
    slug: 'assinatura',
    moduleKey: 'assinatura',
    permission: 'assinatura:view',
    eyebrow: 'Sistema',
    title: 'Assinatura',
    description:
      'Plano atual, módulos liberados, limites contratados, faturas e upgrade.',
    icon: 'credit-card',
    capabilities: [
      'Plano e módulos efetivamente liberados',
      'Limites de usuários, unidades e pacientes',
      'Histórico de faturas',
      'Solicitação de upgrade',
    ],
  },
  configuracoes: {
    slug: 'configuracoes',
    moduleKey: 'configuracoes',
    permission: 'configuracoes:view',
    eyebrow: 'Sistema',
    title: 'Configurações',
    description:
      'Dados da clínica, preferências, fuso horário, integrações e segurança.',
    icon: 'settings',
    capabilities: [
      'Identificação e contato da clínica',
      'Preferências de agenda e moeda',
      'Integrações de WhatsApp, pagamentos e IA',
      'Segurança, sessões e LGPD',
    ],
  },
  relatorios: {
    slug: 'relatorios',
    moduleKey: 'relatorios',
    permission: 'relatorios:view',
    eyebrow: 'Sistema',
    title: 'Relatórios',
    description:
      'Indicadores operacionais e financeiros com exportação e agendamento.',
    icon: 'chart-column',
    capabilities: [
      'Consultas, faltas e produção',
      'Receita, despesa e convênios',
      'Exportação em CSV e PDF',
      'Envio periódico por e-mail',
    ],
  },
};
