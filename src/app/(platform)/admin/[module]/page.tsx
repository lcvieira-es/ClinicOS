import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { requirePlatformAdmin } from '@/lib/auth/guards';
import { getPlatformPermissions } from '@/lib/permissions';
import { platformModulePages } from '@/lib/platform/modules';
import { PlatformModulePlaceholder } from '@/components/platform/module-placeholder';
import { AccessRestricted } from '@/components/feedback/access-restricted';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ module: string }>;
}): Promise<Metadata> {
  const { module: slug } = await params;
  const config = platformModulePages[slug];
  return { title: config ? 'Plataforma' : 'Não encontrado' };
}

export default async function PlatformModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: slug } = await params;
  const config = platformModulePages[slug];
  if (!config) notFound();

  const user = await requirePlatformAdmin();
  const permissions = await getPlatformPermissions(user.id);

  if (!permissions.has(config.permission)) {
    return <AccessRestricted homeHref="/admin" homeLabel="Voltar ao dashboard" />;
  }

  return <PlatformModulePlaceholder config={config} />;
}
