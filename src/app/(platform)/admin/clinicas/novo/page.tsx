import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { requirePlatformAdmin } from '@/lib/auth/guards';
import { getPlatformPermissions } from '@/lib/permissions';
import { listPlans } from '@/lib/platform/admin-queries';
import { PageHeader } from '@/components/ui/page-header';
import { ClinicWizard } from '@/components/platform/clinic-wizard';

export const metadata = { title: 'Nova clínica' };

export default async function NewClinicPage() {
  const user = await requirePlatformAdmin();
  const permissions = await getPlatformPermissions(user.id);

  if (!permissions.has('plataforma-clinicas:create')) notFound();

  const plans = await listPlans(user.id);

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Administração da plataforma"
        title="Nova clínica"
        description="Assistente de 5 etapas: clínica, unidade matriz, administrador, plano e revisão. Tudo é provisionado em uma única transação."
        actions={
          <Link
            href="/admin/clinicas"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink-700 transition hover:bg-sky-50"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Voltar
          </Link>
        }
      />

      <ClinicWizard plans={plans.filter((plan) => plan.is_active)} />
    </div>
  );
}
