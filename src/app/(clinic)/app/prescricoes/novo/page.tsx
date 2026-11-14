import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { listPatientOptions } from '@/lib/clinic/patients';
import { listProfessionals } from '@/lib/clinic/professionals';
import { listAppointmentsForPatient } from '@/lib/clinic/agenda';
import { listMedications } from '@/lib/clinic/prescricoes';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { PrescriptionForm } from '@/components/clinic/prescription-form';

export const metadata = { title: 'Nova prescrição' };

export default async function NewPrescriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ paciente?: string; consulta?: string }>;
}) {
  const access = await requireModule('prescricoes');
  if (!access.allowed || !access.permissions.has('prescricoes:create')) {
    return <AccessRestricted homeHref="/app/prescricoes" homeLabel="Voltar" />;
  }

  const sp = await searchParams;
  const user = access.user;

  const [patients, professionals, medications] = await Promise.all([
    listPatientOptions(user.id, user.activeClinicId),
    listProfessionals(user.id, user.activeClinicId),
    listMedications(user.id, user.activeClinicId),
  ]);

  let appointments: Array<{ id: string; name: string }> = [];
  if (sp.paciente) {
    const appts = await listAppointmentsForPatient(user.id, user.activeClinicId, sp.paciente);
    appointments = appts.map((a) => ({
      id: a.id,
      name: `${a.scheduled_start.slice(0, 16).replace('T', ' ')} · ${a.type}`,
    }));
  }

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Clínico"
        title="Nova prescrição"
        description="Cria um rascunho. A assinatura emite a receita."
        actions={
          <ButtonLink href="/app/prescricoes" variant="outline" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </ButtonLink>
        }
      />
      <Card>
        <CardBody>
          <PrescriptionForm
            patients={patients}
            professionals={professionals.map((p) => ({ id: p.id, name: p.full_name }))}
            appointments={appointments}
            medications={medications}
          />
        </CardBody>
      </Card>
    </div>
  );
}
