import { CalendarDays } from 'lucide-react';
import { requirePortalUser } from '@/lib/auth/guards';
import { getPortalOverview } from '@/lib/portal/queries';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { StatusBadge, Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableEmpty, TableShell, Td, Th } from '@/components/ui/table';
import { ButtonLink } from '@/components/ui/button';
import { formatCurrency, formatDate, formatTime } from '@/lib/format';

export default async function PortalAppointmentsPage() {
  const user = await requirePortalUser();
  const access =
    user.portalAccess.find((item) => item.clinicId === user.activeClinicId) ??
    user.portalAccess[0];

  const data = await getPortalOverview(user.id, access.clinicId, access.patientId);

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow={access.clinicName}
        title="Minhas consultas"
        description="Histórico e próximos atendimentos registrados pela clínica."
        actions={
          <div className="flex items-center gap-2">
            <ButtonLink href="/portal/nova-consulta" size="md">
              + Nova consulta
            </ButtonLink>
            <Badge tone="navy">{data.appointments.length} registros</Badge>
          </div>
        }
      />

      {data.nextAppointment ? (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          <strong className="font-bold">Próxima consulta:</strong>{' '}
          {formatDate(data.nextAppointment.scheduled_start)} às{' '}
          {formatTime(data.nextAppointment.scheduled_start)} com{' '}
          {data.nextAppointment.professional_name} · {data.nextAppointment.unit_name}
        </div>
      ) : null}

      <Card>
        <TableShell className="rounded-none border-0 shadow-none">
          <Table>
            <thead>
              <tr>
                <Th>Data e hora</Th>
                <Th>Professional</Th>
                <Th className="hidden md:table-cell">Unidade</Th>
                <Th>Tipo</Th>
                <Th>Situação</Th>
                <Th className="text-right">Valor</Th>
              </tr>
            </thead>
            <tbody>
              {data.appointments.length === 0 ? (
                <TableEmpty colSpan={6}>
                  Nenhuma consulta registrada até o momento.
                </TableEmpty>
              ) : (
                data.appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <Td>
                      <p className="text-xs font-semibold text-navy-900">
                        {formatDate(appointment.scheduled_start)}
                      </p>
                      <p className="text-[10px] text-ink-400">
                        {formatTime(appointment.scheduled_start)} —{' '}
                        {formatTime(appointment.scheduled_end)}
                      </p>
                    </Td>
                    <Td>
                      <span className="text-xs text-ink-700">
                        {appointment.professional_name}
                      </span>
                    </Td>
                    <Td className="hidden md:table-cell">
                      <span className="text-[11px] text-ink-500">
                        {appointment.unit_name}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-[11px] capitalize text-ink-600">
                        {appointment.type}
                      </span>
                    </Td>
                    <Td>
                      <StatusBadge status={appointment.status} />
                    </Td>
                    <Td className="text-right text-xs font-semibold text-navy-900">
                      {formatCurrency(appointment.amount)}
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </TableShell>
      </Card>

      {data.appointments.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={CalendarDays}
            title="Sem histórico de consultas"
            description="Agendamentos realizados pela clínica aparecerão nesta lista."
          />
        </div>
      ) : null}
    </div>
  );
}
