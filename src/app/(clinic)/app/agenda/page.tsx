import Link from 'next/link';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  UserCheck,
} from 'lucide-react';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { getDayAgenda, getWeekAgenda, listBlocks, listWaitingList } from '@/lib/clinic/agenda';
import { listProfessionals } from '@/lib/clinic/professionals';
import { listUnits } from '@/lib/clinic/units';
import { cancelAppointmentAction } from '@/lib/clinic/actions/agenda';
import { transitionAppointmentAction } from '@/lib/clinic/actions/consultas';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Table, TableShell, Td, Th } from '@/components/ui/table';
import { formatCurrency, formatDate, formatDateTime, formatTime } from '@/lib/format';

export const metadata = { title: 'Agenda' };

function isoToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

function shiftDate(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{
    data?: string;
    view?: string;
    profissional?: string;
    unidade?: string;
    msg?: string;
    erro?: string;
  }>;
}) {
  const access = await requireModule('agenda');
  if (!access.allowed) {
    return <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />;
  }

  const sp = await searchParams;
  const user = access.user;
  const canCreate = access.permissions.has('agenda:create');
  const canEdit = access.permissions.has('agenda:edit');
  const canDelete = access.permissions.has('agenda:delete');
  const canConsultas = access.permissions.has('consultas:create');

  const date = sp.data && /^\d{4}-\d{2}-\d{2}$/.test(sp.data) ? sp.data : isoToday();
  const view = sp.view === 'semana' ? 'semana' : 'dia';
  const professionalId = sp.profissional || '';
  const unitId = sp.unidade || '';

  const [professionals, units, appointments, blocks, waiting] = await Promise.all([
    listProfessionals(user.id, user.activeClinicId),
    listUnits(user.id, user.activeClinicId),
    view === 'semana'
      ? getWeekAgenda(user.id, user.activeClinicId, {
          date,
          professionalId: professionalId || undefined,
          unitId: unitId || undefined,
        })
      : getDayAgenda(user.id, user.activeClinicId, {
          date,
          professionalId: professionalId || undefined,
          unitId: unitId || undefined,
        }),
    listBlocks(user.id, user.activeClinicId, professionalId || undefined),
    listWaitingList(user.id, user.activeClinicId),
  ]);

  const buildHref = (overrides: Record<string, string>) => {
    const query = new URLSearchParams();
    query.set('data', overrides.data ?? date);
    query.set('view', overrides.view ?? view);
    if (overrides.profissional ?? professionalId) {
      query.set('profissional', overrides.profissional ?? professionalId);
    }
    if (overrides.unidade ?? unitId) {
      query.set('unidade', overrides.unidade ?? unitId);
    }
    return `/app/agenda?${query.toString()}`;
  };

  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const d = new Date(`${date}T12:00:00`);
    const dayOfWeek = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
    const day = new Date(monday.getTime() + index * 86400000);
    const y = day.getFullYear();
    const m = String(day.getMonth() + 1).padStart(2, '0');
    const dd = String(day.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  });

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Operação"
        title="Agenda"
        description={
          view === 'dia'
            ? `Consultas de ${formatDate(date)}`
            : `Semana de ${formatDate(weekDays[0])} a ${formatDate(weekDays[6])}`
        }
        actions={
          <>
            {canCreate ? (
              <ButtonLink href="/app/agenda/novo" size="md">
                <Plus className="h-4 w-4" />
                Novo agendamento
              </ButtonLink>
            ) : null}
            <ButtonLink href="/app/agenda/bloqueios" variant="outline" size="md">
              Bloqueios
            </ButtonLink>
            <ButtonLink href="/app/agenda/lista-espera" variant="outline" size="md">
              Lista de espera
            </ButtonLink>
          </>
        }
      />

      {sp.erro ? (
        <Alert variant="danger" className="mb-4">
          {decodeURIComponent(sp.erro)}
        </Alert>
      ) : null}
      {sp.msg ? (
        <Alert variant="success" className="mb-4">
          {decodeURIComponent(sp.msg)}
        </Alert>
      ) : null}

      <Card className="mb-4">
        <CardBody className="!p-4">
          <form
            method="get"
            action="/app/agenda"
            className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:overflow-x-auto"
          >
            <input type="hidden" name="view" value={view} />
            <div className="flex items-center gap-1">
              <a
                href={buildHref({ data: shiftDate(date, view === 'semana' ? -7 : -1) })}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-ink-600 transition hover:bg-sky-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </a>
              <a
                href={buildHref({ data: isoToday() })}
                className="flex h-9 items-center justify-center rounded-xl border border-line bg-white px-3 text-xs font-semibold text-ink-700 transition hover:bg-sky-100"
              >
                Hoje
              </a>
              <a
                href={buildHref({ data: shiftDate(date, view === 'semana' ? 7 : 1) })}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-ink-600 transition hover:bg-sky-100"
              >
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-line bg-sky-25 p-1">
              <a
                href={buildHref({ view: 'dia' })}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  view === 'dia'
                    ? 'bg-navy-900 text-white'
                    : 'text-ink-600 hover:text-navy-900'
                }`}
              >
                Dia
              </a>
              <a
                href={buildHref({ view: 'semana' })}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  view === 'semana'
                    ? 'bg-navy-900 text-white'
                    : 'text-ink-600 hover:text-navy-900'
                }`}
              >
                Semana
              </a>
            </div>
            <Select
              name="profissional"
              defaultValue={professionalId}
              aria-label="Profissional"
              className="w-full sm:min-w-[100px] sm:max-w-[180px]"
            >
              <option value="">Todos os profissionais</option>
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.full_name}
                </option>
              ))}
            </Select>
            <Select
              name="unidade"
              defaultValue={unitId}
              aria-label="Unidade"
              className="w-full sm:min-w-[110px] sm:max-w-[180px]"
            >
              <option value="">Todas as unidades</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </Select>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 text-xs font-semibold text-white transition hover:bg-navy-800"
            >
              Filtrar
            </button>
          </form>
        </CardBody>
      </Card>

      {view === 'dia' ? (
        <DayView
          appointments={appointments}
          canConsultas={canConsultas}
          canDelete={canDelete}
        />
      ) : (
        <WeekView appointments={appointments} weekDays={weekDays} />
      )}

      {blocks.length > 0 ? (
        <Card className="mt-5">
          <CardHeader
            title="Bloqueios do período"
            description={`${blocks.length} bloqueio(s)`}
            action={
              <ButtonLink href="/app/agenda/bloqueios" variant="ghost" size="sm">
                Gerenciar
              </ButtonLink>
            }
          />
          <CardBody className="space-y-2">
            {blocks.slice(0, 5).map((block) => (
              <div
                key={block.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-sky-25 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-ink-700">
                    {block.professional_name}
                  </p>
                  <p className="text-[10px] text-ink-400">
                    {formatDateTime(block.starts_at)} → {formatTime(block.ends_at)}
                    {block.reason ? ` · ${block.reason}` : ''}
                  </p>
                </div>
                <Badge tone="warning">Bloqueio</Badge>
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}

      {waiting.length > 0 ? (
        <Card className="mt-5">
          <CardHeader
            title="Lista de espera"
            description={`${waiting.length} paciente(s) aguardando`}
            action={
              <ButtonLink href="/app/agenda/lista-espera" variant="ghost" size="sm">
                Gerenciar
              </ButtonLink>
            }
          />
          <CardBody className="space-y-2">
            {waiting.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-sky-25 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-ink-700">
                    {item.patient_name}
                  </p>
                  <p className="text-[10px] text-ink-400">
                    {item.professional_name ?? 'Qualquer profissional'} · prioridade{' '}
                    {item.priority}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}

function DayView({
  appointments,
  canConsultas,
  canDelete,
}: {
  appointments: Awaited<ReturnType<typeof getDayAgenda>>;
  canConsultas: boolean;
  canDelete: boolean;
}) {
  if (appointments.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={CalendarDays}
          title="Agenda livre neste dia"
          description="Nenhuma consulta agendada. Crie um novo agendamento."
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Consultas do dia"
        description={`${appointments.length} agendamento(s)`}
      />
      <CardBody className="p-0">
        <TableShell className="rounded-none border-0 shadow-none">
          <Table>
            <thead>
              <tr>
                <Th>Horário</Th>
                <Th>Paciente</Th>
                <Th className="hidden md:table-cell">Profissional</Th>
                <Th className="hidden lg:table-cell">Unidade</Th>
                <Th>Tipo</Th>
                <Th>Status</Th>
                <Th className="hidden sm:table-cell">Valor</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <Td>
                    <span className="inline-flex items-center gap-1.5 font-semibold text-navy-900">
                      <Clock className="h-3.5 w-3.5 text-ink-400" />
                      {formatTime(appointment.scheduled_start)}
                      <span className="text-[10px] text-ink-400">
                        – {formatTime(appointment.scheduled_end)}
                      </span>
                    </span>
                  </Td>
                  <Td>
                    <p className="truncate text-xs font-bold text-ink-900">
                      {appointment.patient_name}
                    </p>
                  </Td>
                  <Td className="hidden md:table-cell">
                    <span className="text-xs text-ink-600">
                      {appointment.professional_name}
                    </span>
                  </Td>
                  <Td className="hidden lg:table-cell">
                    <span className="text-xs text-ink-600">
                      {appointment.unit_name}
                    </span>
                  </Td>
                  <Td className="capitalize text-xs">{appointment.type}</Td>
                  <Td>
                    <StatusBadge status={appointment.status} />
                  </Td>
                  <Td className="hidden sm:table-cell text-xs font-semibold text-navy-900">
                    {formatCurrency(appointment.amount)}
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canConsultas &&
                      (appointment.status === 'agendada' ||
                        appointment.status === 'confirmada') ? (
                        <form action={transitionAppointmentAction}>
                          <input
                            type="hidden"
                            name="appointmentId"
                            value={appointment.id}
                          />
                          <input type="hidden" name="toStatus" value="aguardando" />
                          <button
                            type="submit"
                            className="rounded-lg bg-navy-900 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-navy-800"
                          >
                            Check-in
                          </button>
                        </form>
                      ) : null}
                      {canConsultas && appointment.status === 'aguardando' ? (
                        <form action={transitionAppointmentAction}>
                          <input
                            type="hidden"
                            name="appointmentId"
                            value={appointment.id}
                          />
                          <input
                            type="hidden"
                            name="toStatus"
                            value="em_atendimento"
                          />
                          <button
                            type="submit"
                            className="rounded-lg bg-mint-400 px-2 py-1 text-[10px] font-semibold text-navy-950 transition hover:bg-mint-300"
                          >
                            Iniciar
                          </button>
                        </form>
                      ) : null}
                      {canConsultas && appointment.status === 'em_atendimento' ? (
                        <form action={transitionAppointmentAction}>
                          <input
                            type="hidden"
                            name="appointmentId"
                            value={appointment.id}
                          />
                          <input type="hidden" name="toStatus" value="realizada" />
                          <button
                            type="submit"
                            className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-emerald-700"
                          >
                            Concluir
                          </button>
                        </form>
                      ) : null}
                      {canDelete && appointment.status !== 'cancelada' ? (
                        <form action={cancelAppointmentAction}>
                          <input
                            type="hidden"
                            name="appointmentId"
                            value={appointment.id}
                          />
                          <button
                            type="submit"
                            className="rounded-lg border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-600 transition hover:bg-danger-soft"
                          >
                            Cancelar
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableShell>
      </CardBody>
      </Card>
    );
  }

function WeekView({
  appointments,
  weekDays,
}: {
  appointments: Awaited<ReturnType<typeof getWeekAgenda>>;
  weekDays: string[];
}) {
  const byDay = new Map<string, typeof appointments>();
  for (const day of weekDays) byDay.set(day, []);
  for (const appointment of appointments) {
    const day = new Date(String(appointment.scheduled_start).replace(' ', 'T')).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    if (byDay.has(day)) byDay.get(day)!.push(appointment);
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      {weekDays.map((day) => {
        const dayAppointments = byDay.get(day) ?? [];
        return (
          <Card key={day}>
            <CardHeader
              title={`${WEEKDAY_LABELS[new Date(`${day}T12:00:00`).getDay()]} ${formatDate(day).slice(0, 5)}`}
              description={`${dayAppointments.length} consulta(s)`}
            />
            <CardBody className="space-y-2 p-3">
              {dayAppointments.length === 0 ? (
                <p className="text-[10px] text-ink-400">Livre</p>
              ) : (
                dayAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="rounded-lg border border-line bg-sky-25 px-2.5 py-2"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold text-navy-900">
                        {formatTime(appointment.scheduled_start)}
                      </span>
                      <StatusBadge status={appointment.status} />
                    </div>
                    <p className="mt-0.5 truncate text-[10px] font-semibold text-ink-700">
                      {appointment.patient_name}
                    </p>
                    <p className="truncate text-[10px] text-ink-400">
                      {appointment.professional_name}
                    </p>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
