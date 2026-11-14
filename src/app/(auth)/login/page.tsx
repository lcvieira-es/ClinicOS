import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/current-user';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Entrar',
};

const demoAccounts = [
  { label: 'Administração da plataforma', email: 'super@clinicos.dev', role: 'platform_admin' },
  { label: 'Administradora da clínica', email: 'admin@clinicos.dev', role: 'clinic_admin' },
  { label: 'Médica', email: 'medico@clinicos.dev', role: 'doctor' },
  { label: 'Recepção', email: 'recepcao@clinicos.dev', role: 'receptionist' },
  { label: 'Financeiro', email: 'financeiro@clinicos.dev', role: 'finance' },
  { label: 'Portal do paciente', email: 'paciente@clinicos.dev', role: 'patient' },
];

const errorMessages: Record<string, string> = {
  'sem-acesso':
    'Sua conta não possui vínculo ativo. Procure o administrador da clínica.',
  'sessao-expirada': 'Sua sessão expirou. Entre novamente para continuar.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    if (user.isPlatformAdmin) redirect('/admin');
    if (user.activeMembership) redirect('/app/painel');
    if (user.portalAccess.length > 0) redirect('/portal');
  }

  const params = await searchParams;
  const initialError = params.erro ? errorMessages[params.erro] : undefined;
  const showDemo = process.env.NODE_ENV !== 'production';

  return (
    <LoginForm
      initialError={initialError}
      demoAccounts={showDemo ? demoAccounts : []}
    />
  );
}
