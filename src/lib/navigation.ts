export type NavIconName =
  | 'layout-dashboard'
  | 'calendar-days'
  | 'stethoscope'
  | 'file-text'
  | 'pill'
  | 'flask-conical'
  | 'wallet'
  | 'shield-check'
  | 'package'
  | 'users'
  | 'user-round-cog'
  | 'building'
  | 'sparkles'
  | 'message-circle'
  | 'globe'
  | 'user-cog'
  | 'credit-card'
  | 'settings'
  | 'chart-column'
  | 'layers'
  | 'boxes'
  | 'file-badge'
  | 'home';

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: NavIconName;
  permission: string;
  moduleKey?: string;
  badge?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

interface ClinicNavDefinition extends NavItem {
  moduleKey: string;
  group: string;
  groupOrder: number;
}

const clinicDefinitions: ClinicNavDefinition[] = [
  {
    key: 'painel',
    label: 'Painel',
    href: '/app/painel',
    icon: 'layout-dashboard',
    permission: 'painel:view',
    moduleKey: 'painel',
    group: 'Operação',
    groupOrder: 10,
  },
  {
    key: 'agenda',
    label: 'Agenda',
    href: '/app/agenda',
    icon: 'calendar-days',
    permission: 'agenda:view',
    moduleKey: 'agenda',
    group: 'Operação',
    groupOrder: 10,
  },
  {
    key: 'consultas',
    label: 'Consultas',
    href: '/app/consultas',
    icon: 'stethoscope',
    permission: 'consultas:view',
    moduleKey: 'consultas',
    group: 'Operação',
    groupOrder: 10,
  },
  {
    key: 'prontuarios',
    label: 'Prontuários',
    href: '/app/prontuarios',
    icon: 'file-text',
    permission: 'prontuarios:view',
    moduleKey: 'prontuarios',
    group: 'Clínico',
    groupOrder: 20,
  },
  {
    key: 'prescricoes',
    label: 'Prescrições',
    href: '/app/prescricoes',
    icon: 'pill',
    permission: 'prescricoes:view',
    moduleKey: 'prescricoes',
    group: 'Clínico',
    groupOrder: 20,
  },
  {
    key: 'exames',
    label: 'Exames',
    href: '/app/exames',
    icon: 'flask-conical',
    permission: 'exames:view',
    moduleKey: 'exames',
    group: 'Clínico',
    groupOrder: 20,
  },
  {
    key: 'financeiro',
    label: 'Financeiro',
    href: '/app/financeiro',
    icon: 'wallet',
    permission: 'financeiro:view',
    moduleKey: 'financeiro',
    group: 'Gestão',
    groupOrder: 30,
  },
  {
    key: 'convenios',
    label: 'Convênios',
    href: '/app/convenios',
    icon: 'shield-check',
    permission: 'convenios:view',
    moduleKey: 'convenios',
    group: 'Gestão',
    groupOrder: 30,
  },
  {
    key: 'estoque',
    label: 'Estoque',
    href: '/app/estoque',
    icon: 'package',
    permission: 'estoque:view',
    moduleKey: 'estoque',
    group: 'Gestão',
    groupOrder: 30,
  },
  {
    key: 'pacientes',
    label: 'Pacientes',
    href: '/app/pacientes',
    icon: 'users',
    permission: 'pacientes:view',
    moduleKey: 'pacientes',
    group: 'Cadastros',
    groupOrder: 40,
  },
  {
    key: 'medicos',
    label: 'Médicos e profissionais',
    href: '/app/profissionais',
    icon: 'user-round-cog',
    permission: 'medicos:view',
    moduleKey: 'medicos',
    group: 'Cadastros',
    groupOrder: 40,
  },
  {
    key: 'unidades',
    label: 'Unidades',
    href: '/app/unidades',
    icon: 'building',
    permission: 'unidades:view',
    moduleKey: 'unidades',
    group: 'Cadastros',
    groupOrder: 40,
  },
  {
    key: 'ia',
    label: 'Assistente de IA',
    href: '/app/ia',
    icon: 'sparkles',
    permission: 'ia:use',
    moduleKey: 'ia',
    group: 'Relacionamento',
    groupOrder: 50,
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    href: '/app/whatsapp',
    icon: 'message-circle',
    permission: 'whatsapp:view',
    moduleKey: 'whatsapp',
    group: 'Relacionamento',
    groupOrder: 50,
  },
  {
    key: 'portal',
    label: 'Portal do paciente',
    href: '/app/portal',
    icon: 'globe',
    permission: 'portal:view',
    moduleKey: 'portal',
    group: 'Relacionamento',
    groupOrder: 50,
  },
  {
    key: 'usuarios',
    label: 'Usuários e permissões',
    href: '/app/usuarios',
    icon: 'user-cog',
    permission: 'usuarios:view',
    moduleKey: 'usuarios',
    group: 'Sistema',
    groupOrder: 60,
  },
  {
    key: 'assinatura',
    label: 'Assinatura',
    href: '/app/assinatura',
    icon: 'credit-card',
    permission: 'assinatura:view',
    moduleKey: 'assinatura',
    group: 'Sistema',
    groupOrder: 60,
  },
  {
    key: 'configuracoes',
    label: 'Configurações',
    href: '/app/configuracoes',
    icon: 'settings',
    permission: 'configuracoes:view',
    moduleKey: 'configuracoes',
    group: 'Sistema',
    groupOrder: 60,
  },
  {
    key: 'relatorios',
    label: 'Relatórios',
    href: '/app/relatorios',
    icon: 'chart-column',
    permission: 'relatorios:view',
    moduleKey: 'relatorios',
    group: 'Sistema',
    groupOrder: 60,
  },
];

export function buildClinicNav(
  entitled: Set<string>,
  permissions: Set<string>,
): NavGroup[] {
  const groups = new Map<string, NavGroup>();
  const order: string[] = [];

  for (const definition of clinicDefinitions) {
    if (!entitled.has(definition.moduleKey)) continue;
    if (!permissions.has(definition.permission)) continue;

    if (!groups.has(definition.group)) {
      groups.set(definition.group, { label: definition.group, items: [] });
      order.push(definition.group);
    }
    groups.get(definition.group)!.items.push({
      key: definition.key,
      label: definition.label,
      href: definition.href,
      icon: definition.icon,
      permission: definition.permission,
      moduleKey: definition.moduleKey,
    });
  }

  return order
    .sort(
      (a, b) =>
        (clinicDefinitions.find((def) => def.group === a)?.groupOrder ?? 0) -
        (clinicDefinitions.find((def) => def.group === b)?.groupOrder ?? 0),
    )
    .map((label) => groups.get(label)!)
    .filter((group) => group.items.length > 0);
}

export const platformNav: NavGroup[] = [  {
    label: 'Administração da plataforma',
    items: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        href: '/admin',
        icon: 'layout-dashboard',
        permission: 'plataforma-dashboard:view',
      },
      {
        key: 'clinicas',
        label: 'Clínicas',
        href: '/admin/clinicas',
        icon: 'building',
        permission: 'plataforma-clinicas:view',
      },
      {
        key: 'planos',
        label: 'Planos de assinatura',
        href: '/admin/planos',
        icon: 'layers',
        permission: 'plataforma-planos:view',
      },
      {
        key: 'modulos',
        label: 'Módulos e funcionalidades',
        href: '/admin/modulos',
        icon: 'boxes',
        permission: 'plataforma-modulos:view',
      },
      {
        key: 'assinaturas',
        label: 'Assinaturas',
        href: '/admin/assinaturas',
        icon: 'file-badge',
        permission: 'plataforma-assinaturas:view',
      },
      {
        key: 'pagamentos',
        label: 'Pagamentos',
        href: '/admin/pagamentos',
        icon: 'wallet',
        permission: 'plataforma-pagamentos:view',
      },
      {
        key: 'relatorios',
        label: 'Relatórios',
        href: '/admin/relatorios',
        icon: 'chart-column',
        permission: 'plataforma-relatorios:view',
      },
      {
        key: 'configuracoes',
        label: 'Configurações',
        href: '/admin/configuracoes',
        icon: 'settings',
        permission: 'plataforma-configuracoes:view',
      },
    ],
  },
];

export const portalNav: NavGroup[] = [
  {
    label: 'Meu portal',
    items: [
      {
        key: 'inicio',
        label: 'Início',
        href: '/portal',
        icon: 'home',
        permission: 'portal:view',
      },
      {
        key: 'consultas',
        label: 'Minhas consultas',
        href: '/portal/consultas',
        icon: 'calendar-days',
        permission: 'portal:appointments',
      },
      {
        key: 'resultados',
        label: 'Resultados de exames',
        href: '/portal/resultados',
        icon: 'flask-conical',
        permission: 'portal:results',
      },
      {
        key: 'documentos',
        label: 'Documentos',
        href: '/portal/documentos',
        icon: 'file-text',
        permission: 'portal:documents',
      },
    ],
  },
];

export function filterNav(
  groups: NavGroup[],
  permissions: Set<string>,
): NavGroup[] {
  return groups
    .map((group) => ({
      label: group.label,
      items: group.items.filter((item) => permissions.has(item.permission)),
    }))
    .filter((group) => group.items.length > 0);
}

