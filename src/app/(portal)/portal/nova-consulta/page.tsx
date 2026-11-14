import { requirePortalUser } from '@/lib/auth/guards';
import { trustedQuery } from '@/lib/db';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { AppointmentForm } from '@/components/clinic/appointment-form';
import { requestAppointmentAction } from '@/lib/portal/actions';

export const metadata = { title: 'Nova consulta' };

export default async function PortalNewAppointmentPage() {
  const user = await requirePortalUser();
  const access =
    user.portalAccess.find((item) => item.clinicId === user.activeClinicId) ??
    user.portalAccess[0];

  const clinicId = access.clinicId;
  const patientId = access.patientId;

  const [professionals, units, patientRows, schedules, busySlots] = await Promise.all([
    trustedQuery<{ id: string; full_name: string; specialties: string[] | null }>(
      `select id, full_name, specialties from professionals where clinic_id = $1 and status = 'ativo' order by full_name`,
      [clinicId],
    ),
    trustedQuery<{ id: string; name: string }>(
      `select id, name from clinic_units where clinic_id = $1 and status = 'ativa' order by name`,
      [clinicId],
    ),
    trustedQuery<{ full_name: string }>(
      `select full_name from patients where id = $1`,
      [patientId],
    ),
    trustedQuery<{ professional_id: string; unit_id: string; weekday: number; start_time: string; end_time: string; slot_minutes: number }>(
      `select professional_id::text, unit_id::text, weekday::int, start_time::text, end_time::text, slot_minutes
         from professional_schedules where clinic_id = $1 and is_active = true`,
      [clinicId],
    ),
    trustedQuery<{ professional_id: string; scheduled_start: string; scheduled_end: string }>(
      `select professional_id::text, scheduled_start::text, scheduled_end::text
         from appointments
        where clinic_id = $1
          and status <> 'cancelada'
          and scheduled_start >= current_date`,
      [clinicId],
    ),
  ]);

  const patientName = patientRows[0]?.full_name ?? 'Paciente';

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow={access.clinicName}
        title="Nova consulta"
        description="Solicite um agendamento. A clínica confirmará o horário."
        actions={
          <ButtonLink href="/portal/consultas" variant="outline" size="sm">
            Voltar
          </ButtonLink>
        }
      />
      <Card>
        <CardBody>
          <AppointmentForm
            patients={[{ id: patientId, name: patientName }]}
            professionals={professionals.map((p) => ({
              id: p.id,
              name: p.full_name,
              specialties: p.specialties ?? [],
            }))}
            units={units.map((u) => ({ id: u.id, name: u.name }))}
            schedules={schedules.map((s) => ({
              professional_id: s.professional_id,
              unit_id: s.unit_id,
              weekday: s.weekday,
              start_time: s.start_time,
              end_time: s.end_time,
              slot_minutes: s.slot_minutes,
            }))}
            busySlots={busySlots}
            action={requestAppointmentAction}
            lockedPatient={{ id: patientId, name: patientName }}
          />
        </CardBody>
      </Card>
    </div>
  );
}
