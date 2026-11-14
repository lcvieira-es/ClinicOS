import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { listUnits } from '@/lib/clinic/units';
import { getClinicEntitlements } from '@/lib/tenant/entitlements';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { ProfessionalForm } from '@/components/clinic/professional-form';

export const metadata = { title: 'Novo profissional' };

export default async function NewProfessionalPage() {
  const access = await requireModule('profissionais');
  if (!access.allowed || !access.permissions.has('medicos:create')) {
    return <AccessRestricted homeHref="/app/profissionais" homeLabel="Voltar" />;
  }

  const user = access.user;
  const [units, entitlements] = await Promise.all([
    listUnits(user.id, user.activeClinicId),
    getClinicEntitlements(user.id, user.activeClinicId),
  ]);

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Cadastros"
        title="Novo profissional"
        description="Dados do conselho, especialidades e unidades de atuação."
        actions={
          <ButtonLink href="/app/profissionais" variant="outline" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </ButtonLink>
        }
      />
      <Card>
        <CardBody>
          <ProfessionalForm
            mode="create"
            units={units.map((unit) => ({ id: unit.id, name: unit.name }))}
            canLinkUser={access.permissions.has('usuarios:edit')}
            modules={entitlements.map((m) => ({ key: m.key, name: m.name }))}
          />
        </CardBody>
      </Card>
    </div>
  );
}
