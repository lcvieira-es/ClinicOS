import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { listPatientOptions } from '@/lib/clinic/patients';
import { listProfessionals } from '@/lib/clinic/professionals';
import { listAppointmentsForPatient } from '@/lib/clinic/agenda';
import { listExamCatalog } from '@/lib/clinic/exames';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { ExamOrderForm } from '@/components/clinic/exam-order-form';

export const metadata = { title: 'Nova solicitação de exames' };

export default async function NewExamOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ paciente?: string; consulta?: string }>;
}) {
  const access = await requireModule('exames');
  if (!access.allowed || !access.permissions.has('exames:create')) {
    return <AccessRestricted homeHref="/app/exames" homeLabel="Voltar" />;
  }

  const sp = await searchParams;
  const user = access.user;

  const [patients, professionals, catalog] = await Promise.all([
    listPatientOptions(user.id, user.activeClinicId),
    listProfessionals(user.id, user.activeClinicId),
    listExamCatalog(user.id, user.activeClinicId),
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
        title="Nova solicitação de exames"
        description="Solicite exames para um paciente."
        actions={
          <ButtonLink href="/app/exames" variant="outline" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </ButtonLink>
        }
      />
      <Card>
        <CardBody>
          <ExamOrderForm
            patients={patients}
            professionals={professionals.map((p) => ({ id: p.id, name: p.full_name }))}
            appointments={appointments}
            catalog={catalog}
          />
        </CardBody>
      </Card>
    </div>
  );
}
