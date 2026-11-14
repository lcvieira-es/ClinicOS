import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/current-user';

export default async function RootPage() {
  const user = await getCurrentUser();

  if (!user) redirect('/login');
  if (user.isPlatformAdmin) redirect('/admin');
  if (user.activeMembership) redirect('/app/painel');
  if (user.portalAccess.length > 0) redirect('/portal');
  redirect('/login?erro=sem-acesso');
}
