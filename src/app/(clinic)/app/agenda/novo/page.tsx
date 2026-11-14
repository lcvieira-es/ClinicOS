import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { listPatientOptions } from '@/lib/clinic/patients';
import { listProfessionals } from '@/lib/clinic/professionals';
import { listUnits } from '@/lib/clinic/units';
import { listSchedulesForClinic, listBusySlotsForProfessionals } from '@/lib/clinic/disponibilidade';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { AppointmentForm } from '@/components/clinic/appointment-form';

export const metadata = { title: 'Novo agendamento' };

export default async function NewAppointmentPage() {
  const access = await requireModule('agenda');
  if (!access.allowed || !access.permissions.has('agenda:create')) {
    return <AccessRestricted homeHref="/app/agenda" homeLabel="Voltar" />;
  }

  const user = access.user;
  const [patients, professionals, units, schedules] = await Promise.all([
    listPatientOptions(user.id, user.activeClinicId),
    listProfessionals(user.id, user.activeClinicId),
    listUnits(user.id, user.activeClinicId),
    listSchedulesForClinic(user.id, user.activeClinicId),
  ]);
  const busySlots = await listBusySlotsForProfessionals(
    user.id,
    user.activeClinicId,
    professionals.map((p) => p.id),
  );

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Operação"
        title="Novo agendamento"
        description="Agende uma consulta verificando conflitos de horário."
        actions={
          <ButtonLink href="/app/agenda" variant="outline" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </ButtonLink>
        }
      />
      <Card>
        <CardBody>
          <AppointmentForm
            patients={patients}
            professionals={professionals.map((p) => ({
              id: p.id,
              name: p.full_name,
              specialties: p.specialties ?? [],
            }))}
            units={units.map((u) => ({ id: u.id, name: u.name }))}
            schedules={schedules}
            busySlots={busySlots}
          />
        </CardBody>
      </Card>
    </div>
  );
}
