import Link from 'next/link';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { notFound } from 'next/navigation';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { getAppointment, getAppointmentStatusHistory } from '@/lib/clinic/agenda';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';

export const metadata = { title: 'Consulta' };

export default async function ConsultaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  const access = await requireModule('consultas');
  if (!access.allowed) {
    return <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />;
  }

  const { id } = await params;
  const sp = await searchParams;
  const user = access.user;

  const [appointment, history] = await Promise.all([
    getAppointment(user.id, user.activeClinicId, id),
    getAppointmentStatusHistory(user.id, user.activeClinicId, id),
  ]);

  if (!appointment) notFound();

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Operação · Consulta"
        title={appointment.patient_name}
        description={`${formatDateTime(appointment.scheduled_start)} · ${appointment.professional_name}`}
        actions={
          <ButtonLink href="/app/consultas" variant="outline" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Lista
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

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Dados do atendimento" />
          <CardBody>
            <dl className="grid gap-3 text-[11px] sm:grid-cols-2">
              <div>
                <dt className="text-ink-400">Paciente</dt>
                <dd className="font-semibold text-ink-700">
                  {appointment.patient_name}
                </dd>
              </div>
              <div>
                <dt className="text-ink-400">Profissional</dt>
                <dd className="font-semibold text-ink-700">
                  {appointment.professional_name}
                </dd>
              </div>
              <div>
                <dt className="text-ink-400">Unidade</dt>
                <dd className="font-semibold text-ink-700">
                  {appointment.unit_name}
                </dd>
              </div>
              <div>
                <dt className="text-ink-400">Tipo</dt>
                <dd className="font-semibold text-ink-700 capitalize">
                  {appointment.type}
                </dd>
              </div>
              <div>
                <dt className="text-ink-400">Início</dt>
                <dd className="font-semibold text-ink-700">
                  {formatDateTime(appointment.scheduled_start)}
                </dd>
              </div>
              <div>
                <dt className="text-ink-400">Fim</dt>
                <dd className="font-semibold text-ink-700">
                  {formatDateTime(appointment.scheduled_end)}
                </dd>
              </div>
              <div>
                <dt className="text-ink-400">Status</dt>
                <dd>
                  <StatusBadge status={appointment.status} />
                </dd>
              </div>
              <div>
                <dt className="text-ink-400">Forma de pagamento</dt>
                <dd className="font-semibold text-ink-700">
                  {appointment.payment_method}
                </dd>
              </div>
              <div>
                <dt className="text-ink-400">Valor</dt>
                <dd className="font-semibold text-navy-900">
                  {formatCurrency(appointment.amount)}
                </dd>
              </div>
              {appointment.checked_in_at ? (
                <div>
                  <dt className="text-ink-400">Check-in</dt>
                  <dd className="font-semibold text-ink-700">
                    {formatDateTime(appointment.checked_in_at)}
                  </dd>
                </div>
              ) : null}
              {appointment.started_at ? (
                <div>
                  <dt className="text-ink-400">Início do atendimento</dt>
                  <dd className="font-semibold text-ink-700">
                    {formatDateTime(appointment.started_at)}
                  </dd>
                </div>
              ) : null}
              {appointment.finished_at ? (
                <div>
                  <dt className="text-ink-400">Conclusão</dt>
                  <dd className="font-semibold text-ink-700">
                    {formatDateTime(appointment.finished_at)}
                  </dd>
                </div>
              ) : null}
              {appointment.cancellation_reason ? (
                <div className="sm:col-span-2">
                  <dt className="text-ink-400">Motivo do cancelamento</dt>
                  <dd className="font-semibold text-red-600">
                    {appointment.cancellation_reason}
                  </dd>
                </div>
              ) : null}
              {appointment.notes ? (
                <div className="sm:col-span-2">
                  <dt className="text-ink-400">Observações</dt>
                  <dd className="text-ink-700">{appointment.notes}</dd>
                </div>
              ) : null}
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Histórico de status" description="Trilha de mudanças." />
          <CardBody className="space-y-3">
            {history.length === 0 ? (
              <p className="text-xs text-ink-500">Sem histórico registrado.</p>
            ) : (
              <ol className="space-y-3">
                {history.map((entry) => (
                  <li key={entry.id} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-mint-400" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-ink-700">
                        {entry.from_status ? `${entry.from_status} → ` : ''}
                        {entry.to_status}
                      </p>
                      <p className="text-[10px] text-ink-400">
                        {formatDateTime(entry.created_at)}
                      </p>
                      {entry.notes ? (
                        <p className="text-[10px] text-ink-500">
                          {entry.notes}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
