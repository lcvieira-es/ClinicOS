import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  CircleCheck,
  Clock,
  FileText,
  FlaskConical,
  MapPin,
  Pill,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { requirePortalUser } from '@/lib/auth/guards';
import { getPortalOverview } from '@/lib/portal/queries';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { StatusBadge, Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableEmpty, TableShell, Td, Th } from '@/components/ui/table';
import {
  firstName,
  formatDate,
  formatDateTime,
  formatTime,
  formatCurrency,
} from '@/lib/format';

export default async function PortalHomePage() {
  const user = await requirePortalUser();
  const access =
    user.portalAccess.find((item) => item.clinicId === user.activeClinicId) ??
    user.portalAccess[0];

  const data = await getPortalOverview(user.id, access.clinicId, access.patientId);
  const profile = data.profile;

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow={access.clinicName}
        title={`Olá, ${firstName(access.patientName)}`}
        description="Acompanhe suas consultas, resultados e documentos em um só lugar."
        actions={
          <Badge tone="mint">Acesso somente aos seus dados</Badge>
        }
      />

      {data.nextAppointment ? (
        <div className="mb-5 overflow-hidden rounded-card bg-gradient-to-br from-navy-900 to-navy-950 p-5 text-white shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-mint-400">
                <Clock className="h-3.5 w-3.5" />
                Próxima consulta
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight">
                {formatDate(data.nextAppointment.scheduled_start)}
              </p>
              <p className="mt-0.5 text-sm text-white/70">
                {formatTime(data.nextAppointment.scheduled_start)} ·{' '}
                {data.nextAppointment.professional_name}
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-white/55">
                <MapPin className="h-3.5 w-3.5" />
                {data.nextAppointment.unit_name}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={data.nextAppointment.status} />
              <Badge tone="navy" className="bg-white/10 text-white ring-white/15">
                {data.nextAppointment.type}
              </Badge>
              <ButtonLink
                href="/portal/nova-consulta"
                variant="mint"
                size="sm"
                className="mt-1"
              >
                + Nova consulta
              </ButtonLink>
            </div>
          </div>
        </div>
      ) : (
        <Card className="mb-5">
          <EmptyState
            icon={CalendarDays}
            title="Nenhuma consulta agendada"
            description="Solicite um novo agendamento quando precisar."
            action={
              <div className="flex items-center gap-2">
                <ButtonLink href="/portal/nova-consulta" size="sm">
                  + Nova consulta
                </ButtonLink>
                <ButtonLink href="/portal/consultas" variant="outline" size="sm">
                  Ver histórico
                </ButtonLink>
              </div>
            }
          />
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Consultas realizadas"
          value={data.completedAppointments}
          hint="Histórico na clínica"
          icon={Stethoscope}
          tone="navy"
        />
        <StatCard
          label="Exames pendentes"
          value={data.pendingExams}
          hint="Aguardando resultado"
          icon={FlaskConical}
          tone="warning"
        />
        <StatCard
          label="Resultados liberados"
          value={data.releasedResults}
          hint="Disponíveis para consulta"
          icon={CircleCheck}
          tone="success"
        />
        <StatCard
          label="Documentos"
          value={data.documents.length + data.prescriptions.length}
          hint="Receitas e documentos"
          icon={FileText}
          tone="mint"
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            title="Últimas consultas"
            description="Seu histórico de atendimentos."
            action={
              <ButtonLink href="/portal/consultas" variant="ghost" size="sm">
                Ver todas
                <ArrowRight className="h-3.5 w-3.5" />
              </ButtonLink>
            }
          />
          <TableShell className="rounded-none border-0 shadow-none">
            <Table>
              <thead>
                <tr>
                  <Th>Data</Th>
                  <Th>Profissional</Th>
                  <Th>Situação</Th>
                  <Th className="hidden sm:table-cell">Unidade</Th>
                </tr>
              </thead>
              <tbody>
                {data.appointments.length === 0 ? (
                  <TableEmpty colSpan={4}>
                    Nenhuma consulta registrada até o momento.
                  </TableEmpty>
                ) : (
                  data.appointments.slice(0, 5).map((appointment) => (
                    <tr key={appointment.id}>
                      <Td>
                        <p className="text-xs font-semibold text-navy-900">
                          {formatDate(appointment.scheduled_start)}
                        </p>
                        <p className="text-[10px] text-ink-400">
                          {formatTime(appointment.scheduled_start)}
                        </p>
                      </Td>
                      <Td>
                        <p className="text-xs text-ink-700">
                          {appointment.professional_name}
                        </p>
                        <p className="text-[10px] capitalize text-ink-400">
                          {appointment.type}
                        </p>
                      </Td>
                      <Td>
                        <StatusBadge status={appointment.status} />
                      </Td>
                      <Td className="hidden sm:table-cell">
                        <span className="text-[11px] text-ink-500">
                          {appointment.unit_name}
                        </span>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableShell>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Resultados recentes"
              description="Liberados pelo profissional."
              action={
                <ButtonLink href="/portal/resultados" variant="ghost" size="sm">
                  Ver
                </ButtonLink>
              }
            />
            <CardBody className="space-y-3">
              {data.latestResults.length === 0 ? (
                <EmptyState
                  icon={FlaskConical}
                  title="Nenhum resultado liberado"
                  description="Os resultados aparecem aqui após a liberação do profissional."
                  className="py-6"
                />
              ) : (
                data.latestResults.slice(0, 3).map((result) => (
                  <div
                    key={result.id}
                    className="rounded-xl border border-line bg-sky-25 px-3 py-2.5"
                  >
                    <p className="text-xs font-semibold text-navy-900">
                      {result.exam_names ?? 'Exame'}
                    </p>
                    <p className="mt-0.5 text-[10px] text-ink-400">
                      Liberado em {formatDate(result.released_at)} ·{' '}
                      {result.professional_name}
                    </p>
                    {result.result_summary ? (
                      <p className="mt-1 line-clamp-2 text-[11px] text-ink-600">
                        {result.result_summary}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Seus dados e privacidade" />
            <CardBody className="space-y-3">
              <div className="rounded-xl border border-line bg-white px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                  Titular
                </p>
                <p className="text-xs font-bold text-navy-900">{profile?.full_name}</p>
                <p className="text-[10px] text-ink-400">{profile?.email ?? '—'}</p>
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-[11px] text-emerald-800">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  {profile?.lgpd_consent_at
                    ? `Consentimento LGPD registrado em ${formatDate(profile.lgpd_consent_at)}.`
                    : 'Consentimento LGPD ainda não registrado. Fale com a clínica.'}
                </span>
              </div>
              <Link
                href="/portal/documentos"
                className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5 text-[11px] font-semibold text-navy-900 transition hover:bg-sky-25"
              >
                <span className="flex items-center gap-2">
                  <Pill className="h-3.5 w-3.5 text-ink-400" />
                  Receitas e documentos
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-ink-400" />
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>

      <p className="mt-5 text-center text-[10px] text-ink-400">
        Último acesso em {formatDateTime(new Date())} · dados exibidos somente para{' '}
        {access.patientName}
      </p>
    </div>
  );
}
