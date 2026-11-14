import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  ShieldCheck,
  Trash2,
  UserX,
  RotateCcw,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import {
  getPatient,
  getPatientAppointments,
  getPatientConsents,
} from '@/lib/clinic/patients';
import { listUnits } from '@/lib/clinic/units';
import { listInsuranceOptions } from '@/lib/clinic/patients';
import {
  setPatientStatusAction,
  deletePatientAction,
  grantPatientConsentAction,
  revokePatientConsentAction,
} from '@/lib/clinic/actions/patients';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableShell, Td, Th } from '@/components/ui/table';
import { Alert } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/avatar';
import { PatientForm } from '@/components/clinic/patient-form';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';

export const metadata = { title: 'Paciente' };

export default async function PatientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  const access = await requireModule('pacientes');
  if (!access.allowed) {
    return <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />;
  }

  const { id } = await params;
  const sp = await searchParams;
  const user = access.user;
  const canEdit = access.permissions.has('pacientes:edit');
  const canDelete = access.permissions.has('pacientes:delete');
  const canSeeSensitive = access.permissions.has('pacientes:view_sensitive');

  const [patient, consents, appointments, units, insurances] = await Promise.all([
    getPatient(user.id, user.activeClinicId, id),
    getPatientConsents(user.id, user.activeClinicId, id),
    getPatientAppointments(user.id, user.activeClinicId, id),
    canEdit ? listUnits(user.id, user.activeClinicId) : Promise.resolve([]),
    canEdit
      ? listInsuranceOptions(user.id, user.activeClinicId)
      : Promise.resolve([]),
  ]);

  if (!patient) notFound();

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Cadastros · Paciente"
        title={patient.full_name}
        description={
          patient.social_name ? `Nome social: ${patient.social_name}` : undefined
        }
        actions={
          <ButtonLink href="/app/pacientes" variant="outline" size="sm">
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
          <CardHeader title="Dados cadastrais" description="Edição inline." />
          <CardBody>
            {canEdit ? (
              <PatientForm
                mode="edit"
                patient={patient}
                units={units.map((unit) => ({ id: unit.id, name: unit.name }))}
                insurances={insurances}
                canSeeSensitive={canSeeSensitive}
              />
            ) : (
              <p className="text-xs text-ink-500">
                Seu perfil permite apenas visualizar o cadastro. Peça ao
                administrador para alterar os dados.
              </p>
            )}
          </CardBody>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Situação do cadastro"
              description="Status e consentimento LGPD."
            />
            <CardBody className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={patient.status} />
                {patient.lgpd_consent_at ? (
                  <Badge tone="success" dot>
                    LGPD consentido em {formatDate(patient.lgpd_consent_at)}
                  </Badge>
                ) : (
                  <Badge tone="warning" dot>
                    Consentimento pendente
                  </Badge>
                )}
              </div>

              <dl className="grid gap-2 text-[11px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-400">CPF</dt>
                  <dd className="font-mono font-semibold text-ink-700">
                    {patient.cpf ?? '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-400">Nascimento</dt>
                  <dd className="font-semibold text-ink-700">
                    {formatDate(patient.birth_date)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-400">Sexo</dt>
                  <dd className="font-semibold text-ink-700">
                    {patient.sex ?? '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-400">Cidade/UF</dt>
                  <dd className="font-semibold text-ink-700">
                    {[patient.city, patient.state].filter(Boolean).join(' / ') ||
                      '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-400">Convênio</dt>
                  <dd className="font-semibold text-ink-700">
                    {patient.insurance_provider_name ?? 'Particular'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-400">Unidade preferencial</dt>
                  <dd className="font-semibold text-ink-700">
                    {patient.preferred_unit_id ? 'Definida' : '—'}
                  </dd>
                </div>
              </dl>

              {canEdit ? (
                <div className="space-y-2">
                  {patient.status === 'ativo' ? (
                    <form action={setPatientStatusAction}>
                      <input type="hidden" name="patientId" value={patient.id} />
                      <input type="hidden" name="status" value="inativo" />
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-sky-25"
                      >
                        <UserX className="h-3.5 w-3.5" strokeWidth={2} />
                        Inativar cadastro
                      </button>
                    </form>
                  ) : (
                    <form action={setPatientStatusAction}>
                      <input type="hidden" name="patientId" value={patient.id} />
                      <input type="hidden" name="status" value="ativo" />
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-sky-25"
                      >
                        <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
                        Reativar cadastro
                      </button>
                    </form>
                  )}
                  {patient.status !== 'arquivado' ? (
                    <form action={setPatientStatusAction}>
                      <input type="hidden" name="patientId" value={patient.id} />
                      <input type="hidden" name="status" value="arquivado" />
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-warning-soft/40 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-warning-soft"
                      >
                        Arquivar cadastro
                      </button>
                    </form>
                  ) : null}
                </div>
              ) : null}

              {canEdit ? (
                <div className="flex gap-2">
                  {patient.lgpd_consent_at ? (
                    <form
                      action={revokePatientConsentAction}
                      className="flex-1"
                    >
                      <input type="hidden" name="patientId" value={patient.id} />
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-sky-25"
                      >
                        Revogar LGPD
                      </button>
                    </form>
                  ) : (
                    <form
                      action={grantPatientConsentAction}
                      className="flex-1"
                    >
                      <input type="hidden" name="patientId" value={patient.id} />
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-navy-800"
                      >
                        Registrar LGPD
                      </button>
                    </form>
                  )}
                </div>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Consentimentos LGPD"
              description="Histórico de aceites e revogações."
            />
            <CardBody className="space-y-2">
              {consents.length === 0 ? (
                <p className="text-xs text-ink-500">
                  Nenhum registro de consentimento.
                </p>
              ) : (
                consents.map((consent) => (
                  <div
                    key={consent.id}
                    className="rounded-xl border border-line bg-sky-25 px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-bold text-ink-700">
                        {consent.granted
                          ? 'Consentimento concedido'
                          : 'Consentimento revogado'}
                      </p>
                      <Badge tone={consent.granted ? 'success' : 'danger'} dot>
                        {consent.granted ? 'Concedido' : 'Revogado'}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[10px] text-ink-400">
                      {formatDateTime(consent.granted_at ?? consent.revoked_at)}
                    </p>
                    {consent.document_version ? (
                      <p className="text-[10px] text-ink-400">
                        Versão {consent.document_version}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          {canDelete ? (
            <Card>
              <CardHeader
                title="Zona de perigo"
                description="Exclusão definitiva, apenas sem consultas vinculadas."
              />
              <CardBody>
                <form action={deletePatientAction}>
                  <input type="hidden" name="patientId" value={patient.id} />
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-danger px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                    Excluir paciente
                  </button>
                </form>
                <p className="mt-2 text-[10px] leading-relaxed text-ink-400">
                  A exclusão é bloqueada se houver consultas na agenda.
                </p>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>

      <Card className="mt-5">
        <CardHeader
          title="Histórico de consultas"
          description="Atendimentos vinculados a este paciente."
          action={<Badge tone="neutral">{appointments.length}</Badge>}
        />
        <CardBody className="p-0">
          {appointments.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nenhuma consulta registrada"
              description="As consultas aparecerão aqui conforme forem agendadas."
              className="py-8"
            />
          ) : (
            <TableShell className="rounded-none border-0 shadow-none">
              <Table>
                <thead>
                  <tr>
                    <Th>Data</Th>
                    <Th>Profissional</Th>
                    <Th className="hidden sm:table-cell">Unidade</Th>
                    <Th>Tipo</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Valor</Th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <Td>{formatDateTime(appointment.scheduled_start)}</Td>
                      <Td>{appointment.professional_name}</Td>
                      <Td className="hidden sm:table-cell">
                        {appointment.unit_name}
                      </Td>
                      <Td className="capitalize">{appointment.type}</Td>
                      <Td>
                        <StatusBadge status={appointment.status} />
                      </Td>
                      <Td className="text-right font-semibold text-navy-900">
                        {formatCurrency(appointment.amount)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableShell>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
