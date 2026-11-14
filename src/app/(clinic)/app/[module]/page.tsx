import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requireClinicUser } from '@/lib/auth/guards';
import { loadClinicContext } from '@/lib/tenant/context';
import { modulePages } from '@/lib/modules';
import { ModulePlaceholder } from '@/components/clinic/module-placeholder';
import { AccessRestricted } from '@/components/feedback/access-restricted';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ module: string }>;
}): Promise<Metadata> {
  // Título genérico de propósito: não revela a existência do módulo para
  // usuários sem permissão.
  const { module: slug } = await params;
  const config = modulePages[slug];
  return { title: config ? 'Módulo' : 'Não encontrado' };
}

export default async function ClinicModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: slug } = await params;
  const config = modulePages[slug];
  if (!config) notFound();

  const user = await requireClinicUser();
  const { modules, permissions } = await loadClinicContext(
    user.id,
    user.activeClinicId,
    user.activeMembership.role,
  );

  if (!modules.has(config.moduleKey) || !permissions.has(config.permission)) {
    return <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />;
  }

  return (
    <ModulePlaceholder
      config={config}
      isDemo={user.activeClinicName.toLowerCase().includes('demonstra')}
      planLabel="Profissional"
    />
  );
}
