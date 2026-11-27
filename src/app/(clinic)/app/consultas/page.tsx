import Link from 'next/link';
import {
  Stethoscope,
  CalendarDays,
} from 'lucide-react';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { getRangeAgenda } from '@/lib/clinic/agenda';
import { listProfessionals } from '@/lib/clinic/professionals';
import { transitionAppointmentAction } from '@/lib/clinic/actions/consultas';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ConsultasFilter } from '@/components/clinic/consultas-filter';
import { Alert } from '@/components/ui/alert';
import { formatCurrency, formatDate, formatTime } from '@/lib/format';

export const metadata = { title: 'Consultas' };

function isoToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

export default async function ConsultasPage({
  searchParams,
}: {
  searchParams: Promise<{
    de?: string;
    ate?: string;
    situacao?: string;
    profissional?: string;
    msg?: string;
    erro?: string;
  }>;
}) {
  const access = await requireModule('consultas');
  if (!access.allowed) {
    return <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />;
  }

  const sp = await searchParams;
  const user = access.user;
  const canConsultas = access.permissions.has('consultas:create');
  const canCancel = access.permissions.has('agenda:delete');

  const from = sp.de && /^\d{4}-\d{2}-\d{2}$/.test(sp.de) ? sp.de : isoToday();
  const to = sp.ate && /^\d{4}-\d{2}-\d{2}$/.test(sp.ate) ? sp.ate : from;
  const situacao = sp.situacao || '';
  const professionalId = sp.profissional || '';

  const [professionals, appointments] = await Promise.all([
    listProfessionals(user.id, user.activeClinicId),
    getRangeAgenda(user.id, user.activeClinicId, {
      from,
      to,
      professionalId: professionalId || undefined,
    }),
  ]);

  const filtered = situacao
    ? appointments.filter((a) => a.status === situacao)
    : appointments;

  const buildHref = (overrides: Record<string, string>) => {
    const query = new URLSearchParams();
    query.set('de', overrides.de ?? from);
    query.set('ate', overrides.ate ?? to);
    const prof = overrides.profissional ?? professionalId;
    const sit = overrides.situacao ?? situacao;
    if (prof) query.set('profissional', prof);
    if (sit) query.set('situacao', sit);
    return `/app/consultas?${query.toString()}`;
  };

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Operação"
        title="Consultas"
        description={`Atendimentos de ${formatDate(from)} a ${formatDate(to)}`}
        actions={
          <ButtonLink href="/app/agenda" variant="outline" size="md">
            <CalendarDays className="h-4 w-4" />
            Agenda
          </ButtonLink>
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
          <ConsultasFilter professionals={professionals.map((p) => ({ id: p.id, name: p.full_name }))} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Consultas"
          description={`${filtered.length} atendimento(s)`}
        />
        <CardBody className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Stethoscope}
              title="Nenhuma consulta encontrada"
              description="Ajuste os filtros ou navegue para outro período."
              className="py-8"
            />
          ) : (
            <div className="divide-y divide-line">
              {filtered.map((appointment) => (
                <div key={appointment.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-navy-900">
                          {formatDate(appointment.scheduled_start)} · {formatTime(appointment.scheduled_start)}
                        </span>
                        <StatusBadge status={appointment.status} />
                        <Badge tone="neutral">{appointment.type}</Badge>
                      </div>
                      <p className="mt-1 text-[15px] font-semibold text-ink-700">
                        {appointment.patient_name}
                      </p>
                      <p className="text-[15px] text-ink-400">
                        {appointment.professional_name} · {appointment.unit_name} ·{' '}
                        {formatCurrency(appointment.amount)}
                      </p>
                      {appointment.notes ? (
                        <p className="mt-1 text-[15px] text-ink-500">
                          {appointment.notes}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <Link
                        href={`/app/consultas/${appointment.id}`}
                        className="rounded-lg border border-line px-2 py-1 text-[15px] font-semibold text-ink-700 transition hover:bg-sky-25"
                      >
                        Detalhes
                      </Link>
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
                            className="rounded-lg bg-navy-900 px-2 py-1 text-[15px] font-semibold text-white transition hover:bg-navy-800"
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
                            className="rounded-lg bg-mint-400 px-2 py-1 text-[15px] font-semibold text-navy-950 transition hover:bg-mint-300"
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
                          <input
                            type="hidden"
                            name="toStatus"
                            value="realizada"
                          />
                          <button
                            type="submit"
                            className="rounded-lg bg-emerald-600 px-2 py-1 text-[15px] font-semibold text-white transition hover:bg-emerald-700"
                          >
                            Concluir
                          </button>
                        </form>
                      ) : null}
                      {canConsultas &&
                      appointment.status !== 'realizada' &&
                      appointment.status !== 'cancelada' &&
                      appointment.status !== 'faltou' ? (
                        <form action={transitionAppointmentAction}>
                          <input
                            type="hidden"
                            name="appointmentId"
                            value={appointment.id}
                          />
                          <input type="hidden" name="toStatus" value="faltou" />
                          <button
                            type="submit"
                            className="rounded-lg border border-amber-200 px-2 py-1 text-[15px] font-semibold text-amber-700 transition hover:bg-warning-soft"
                          >
                            Faltou
                          </button>
                        </form>
                      ) : null}
                      {canCancel && appointment.status !== 'cancelada' ? (
                        <form action={transitionAppointmentAction}>
                          <input
                            type="hidden"
                            name="appointmentId"
                            value={appointment.id}
                          />
                          <input type="hidden" name="toStatus" value="cancelada" />
                          <button
                            type="submit"
                            className="rounded-lg border border-red-200 px-2 py-1 text-[15px] font-semibold text-red-600 transition hover:bg-danger-soft"
                          >
                            Cancelar
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}