import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth/current-user';
import { redirect } from 'next/navigation';
import { LandingPage } from '@/components/marketing/landing-page';

export const metadata: Metadata = {
  title: 'ClinicOS — A evolução inteligente na gestão de clínicas',
  description: 'Agenda, prontuário, WhatsApp automático e estoque em uma única plataforma para clínicas modernas.',
};

export default async function RootPage() {
  const user = await getCurrentUser();
  if (user) {
    if (user.isPlatformAdmin) redirect('/admin');
    if (user.activeMembership) redirect('/app/painel');
    if (user.portalAccess.length > 0) redirect('/portal');
    redirect('/login?erro=sem-acesso');
  }
  return <LandingPage />;
}
