import Link from 'next/link';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { listInsuranceOptions } from '@/lib/clinic/patients';
import { listUnits } from '@/lib/clinic/units';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { PatientForm } from '@/components/clinic/patient-form';

export const metadata = { title: 'Novo paciente' };

export default async function NewPatientPage() {
  const access = await requireModule('pacientes');
  if (!access.allowed || !access.permissions.has('pacientes:create')) {
    return <AccessRestricted homeHref="/app/pacientes" homeLabel="Voltar" />;
  }

  const user = access.user;
  const [insurances, units] = await Promise.all([
    listInsuranceOptions(user.id, user.activeClinicId),
    listUnits(user.id, user.activeClinicId),
  ]);

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Cadastros"
        title="Novo paciente"
        description="Preencha os dados cadastrais. O CPF não pode se repetir na clínica."
        actions={
          <ButtonLink href="/app/pacientes" variant="outline" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </ButtonLink>
        }
      />
      <Card>
        <CardBody>
          <PatientForm
            mode="create"
            units={units.map((unit) => ({ id: unit.id, name: unit.name }))}
            insurances={insurances}
            canSeeSensitive={access.permissions.has('pacientes:view_sensitive')}
          />
        </CardBody>
      </Card>
    </div>
  );
}
