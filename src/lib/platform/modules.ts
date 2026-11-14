import type { NavIconName } from '@/lib/navigation';

export interface PlatformModulePageConfig {
  slug: string;
  permission: string;
  title: string;
  description: string;
  icon: NavIconName;
  capabilities: string[];
}

export const platformModulePages: Record<string, PlatformModulePageConfig> = {
  clinicas: {
    slug: 'clinicas',
    permission: 'plataforma-clinicas:view',
    title: 'Clínicas',
    description:
      'Cadastro e contratação de clínicas, módulos contratados, vínculo de conta e situação da assinatura.',
    icon: 'building',
    capabilities: [
      'Busca e filtros por status e plano',
      'Cadastro de clínica, matriz e administrador',
      'Módulos contratados e limites',
      'Link da conta e histórico de implantação',
    ],
  },
  planos: {
    slug: 'planos',
    permission: 'plataforma-planos:view',
    title: 'Planos de assinatura',
    description:
      'Catálogo comercial com preços mensal e anual, limites e composição de módulos.',
    icon: 'layers',
    capabilities: [
      'Cards com preço, limites e módulos',
      'Criação e edição de planos',
      'Comparativo de limites por plano',
      'Clínicas ativas por plano',
    ],
  },
  modulos: {
    slug: 'modulos',
    permission: 'plataforma-modulos:view',
    title: 'Módulos e funcionalidades',
    description:
      'Catálogo de módulos por categoria, funcionalidades expansíveis e adoção por clínica.',
    icon: 'boxes',
    capabilities: [
      'Catálogo por categoria e público',
      'Funcionalidades por módulo',
      'Adoção e ativação por clínica',
      'Ativar ou desativar módulo globalmente',
    ],
  },
  assinaturas: {
    slug: 'assinaturas',
    permission: 'plataforma-assinaturas:view',
    title: 'Assinaturas',
    description:
      'Contratos, status, renovações, gateway e registro de pagamentos.',
    icon: 'file-badge',
    capabilities: [
      'Busca e filtros por status',
      'Tabela de clínica, plano e renovação',
      'Registro de pagamento e baixa',
      'Renovações e inadimplência',
    ],
  },
  pagamentos: {
    slug: 'pagamentos',
    permission: 'plataforma-pagamentos:view',
    title: 'Pagamentos',
    description:
      'Faturas vigentes e em aberto, conciliação manual e contratos monitorados.',
    icon: 'wallet',
    capabilities: [
      'Faturas abertas, pagas e vencidas',
      'Registro manual de pagamento',
      'Conciliação com gateway',
      'Histórico por clínica',
    ],
  },
  relatorios: {
    slug: 'relatorios',
    permission: 'plataforma-relatorios:view',
    title: 'Relatórios',
    description:
      'Receita por plano, assinaturas por status, adoção de módulos e próximas renovações.',
    icon: 'chart-column',
    capabilities: [
      'MRR, ARR e ticket médio',
      'Receita por plano',
      'Adoção de módulos por clínica',
      'Exportação em CSV e PDF',
    ],
  },
  configuracoes: {
    slug: 'configuracoes',
    permission: 'plataforma-configuracoes:view',
    title: 'Configurações da plataforma',
    description:
      'Nome da plataforma, e-mail de suporte, dias de teste, gateway padrão e observações.',
    icon: 'settings',
    capabilities: [
      'Identidade e contato da plataforma',
      'Dias de teste e periodicidade padrão',
      'Gateway de pagamento padrão',
      'Observações internas auditadas',
    ],
  },
};
