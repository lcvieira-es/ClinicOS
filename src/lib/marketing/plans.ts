export interface Plan {
  slug: string;
  name: string;
  tagline: string;
  monthly: string;
  yearly: string;
  users: string;
  professionals: string;
  units: string;
  patients: string;
  storage: string;
  messages: string;
  aiInteractions: string;
  trial: string;
  modules: string;
  highlighted?: boolean;
  benefits: string[];
}

export const plans: Plan[] = [
  {
    slug: 'essential',
    name: 'Essencial',
    tagline: 'Para consultórios que estão organizando a operação.',
    monthly: 'R$ 189,00',
    yearly: 'R$ 1.890,00/ano',
    users: '3',
    professionals: '2',
    units: '1',
    patients: '500',
    storage: '5 GB',
    messages: '200',
    aiInteractions: '100',
    trial: '14 dias',
    modules: '4 módulos',
    benefits: [
      'Agenda inteligente com confirmação automática',
      'Cadastro de pacientes e histórico básico',
      'Lembretes de consulta via WhatsApp',
      'Relatórios essenciais de atendimento',
      'Suporte por e-mail em horário comercial',
    ],
  },
  {
    slug: 'professional',
    name: 'Profissional',
    tagline: 'Para clínicas com equipe, prontuário e convênios.',
    monthly: 'R$ 349,00',
    yearly: 'R$ 3.490,00/ano',
    users: '10',
    professionals: '5',
    units: '2',
    patients: '2.000',
    storage: '20 GB',
    messages: '1.000',
    aiInteractions: '500',
    trial: '14 dias',
    modules: '10 módulos',
    highlighted: true,
    benefits: [
      'Tudo do plano Essencial',
      'Prontuário eletrônico completo e prescrição digital',
      'Gestão de convênios e faturamento',
      'Automações avançadas de WhatsApp',
      'Controle de estoque com alertas de reposição',
      'Suporte prioritário via WhatsApp',
    ],
  },
  {
    slug: 'enterprise',
    name: 'Empresarial',
    tagline: 'Para redes com várias unidades e alto volume.',
    monthly: 'R$ 690,00',
    yearly: 'R$ 6.900,00/ano',
    users: '30',
    professionals: '15',
    units: '5',
    patients: '10.000',
    storage: '100 GB',
    messages: '5.000',
    aiInteractions: '2.000',
    trial: '14 dias',
    modules: '12 módulos',
    benefits: [
      'Tudo do plano Profissional',
      'Gestão centralizada de múltiplas unidades',
      'Painéis gerenciais e indicadores em tempo real',
      'Interações de IA em escala para atendimento',
      'Gerente de conta dedicado',
      'Onboarding personalizado para a equipe',
    ],
  },
];

export function getPlan(slug: string) {
  return plans.find((p) => p.slug === slug);
}

export const WHATSAPP_URL =
  'https://wa.me/5527997139806?text=Ol%C3%A1!%20Gostaria%20de%20agendar%20uma%20consulta.';

export function whatsappPlanUrl(planName: string): string {
  const text = encodeURIComponent(
    `Olá! Tenho interesse no plano ${planName} do ClinicOS. Gostaria de mais informações.`,
  );
  return `https://wa.me/5527997139806?text=${text}`;
}

export const freeTrial = {
  days: 14,
  price: 0,
  contactUrl: `https://wa.me/5527997139806?text=${encodeURIComponent('Olá! Gostaria de solicitar a avaliação gratuita por 14 dias do ClinicOS.')}`,
};
