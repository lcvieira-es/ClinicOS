import Link from 'next/link';
import { ArrowLeft, LockKeyhole, FilePenLine, History } from 'lucide-react';
import { notFound } from 'next/navigation';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { getMedicalRecord, listClinicalNotes, listAllergies } from '@/lib/clinic/prontuarios';
import { listPatientOptions } from '@/lib/clinic/patients';
import { listProfessionals } from '@/lib/clinic/professionals';
import { listAppointmentsForPatient } from '@/lib/clinic/agenda';
import {
  signMedicalRecordAction,
  rectifyMedicalRecordAction,
  addClinicalNoteAction,
  addAllergyAction,
} from '@/lib/clinic/actions/prontuarios';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert } from '@/components/ui/alert';
import { ProntuarioForm } from '@/components/clinic/prontuario-form';
import { formatDateTime } from '@/lib/format';

export const metadata = { title: 'Prontuário' };

export default async function ProntuarioDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string; erro?: string }>;
}) {
  const access = await requireModule('prontuarios');
  if (!access.allowed) {
    return <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />;
  }

  const { id } = await params;
  const sp = await searchParams;
  const user = access.user;
  const canEdit = access.permissions.has('prontuarios:edit');
  const canSign = access.permissions.has('prontuarios:sign');

  // Log de acesso (visualização).
  await (async () => {
    try {
      const { logRecordAccess } = await import('@/lib/clinic/prontuarios');
      await logRecordAccess(user.id, user.activeClinicId, id, 'view');
    } catch {
      // ignore
    }
  })();

  const record = await getMedicalRecord(user.id, user.activeClinicId, id);
  if (!record) notFound();

  const [notes, allergies, patients, professionals, appointments] = await Promise.all([
    listClinicalNotes(user.id, user.activeClinicId, id),
    listAllergies(user.id, user.activeClinicId, record.patient_id),
    canEdit ? listPatientOptions(user.id, user.activeClinicId) : Promise.resolve([]),
    canEdit ? listProfessionals(user.id, user.activeClinicId) : Promise.resolve([]),
    canEdit
      ? listAppointmentsForPatient(user.id, user.activeClinicId, record.patient_id)
      : Promise.resolve([]),
  ]);

  const isDraft = record.status === 'rascunho';

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Clínico · Prontuário"
        title={record.patient_name}
        description={`Versão ${record.version} · ${formatDateTime(record.record_date)}`}
        actions={
          <ButtonLink href="/app/prontuarios" variant="outline" size="sm">
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
          <CardHeader
            title="Dados clínicos"
            description={
              isDraft
                ? 'Rascunho editável. Assine para finalizar.'
                : 'Documento finalizado. Retifique para alterar.'
            }
          />
          <CardBody>
            {canEdit && isDraft ? (
              <ProntuarioForm
                mode="edit"
                record={record}
                patients={patients.map((p) => ({ id: p.id, name: p.name }))}
                professionals={professionals.map((p) => ({ id: p.id, name: p.full_name }))}
                appointments={appointments.map((a) => ({
                  id: a.id,
                  name: `${a.scheduled_start.slice(0, 16).replace('T', ' ')} · ${a.type}`,
                }))}
              />
            ) : (
              <dl className="grid gap-3 text-[11px]">
                <div>
                  <dt className="text-ink-400">Queixa principal</dt>
                  <dd className="text-ink-700">{record.chief_complaint ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-ink-400">História da doença atual</dt>
                  <dd className="text-ink-700">{record.history_present_illness ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-ink-400">Exame físico</dt>
                  <dd className="text-ink-700">{record.physical_exam ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-ink-400">Avaliação / diagnóstico</dt>
                  <dd className="text-ink-700">{record.assessment ?? '—'}</dd>
                </div>
                {record.icd10_codes && record.icd10_codes.length > 0 ? (
                  <div>
                    <dt className="text-ink-400">CID-10</dt>
                    <dd className="flex flex-wrap gap-1">
                      {record.icd10_codes.map((code) => (
                        <Badge key={code} tone="neutral">
                          {code}
                        </Badge>
                      ))}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-ink-400">Plano / conduta</dt>
                  <dd className="text-ink-700">{record.plan ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-ink-400">Observações</dt>
                  <dd className="text-ink-700">{record.notes ?? '—'}</dd>
                </div>
              </dl>
            )}
          </CardBody>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Status do documento" description="Assinatura e verificação." />
            <CardBody className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={record.status} />
                {record.verification_code ? (
                  <Badge tone="mint" dot>
                    Código {record.verification_code}
                  </Badge>
                ) : null}
              </div>
              {record.signed_at ? (
                <p className="text-[11px] text-ink-600">
                  Assinado em {formatDateTime(record.signed_at)}
                  {record.signed_by ? ` por ${record.signed_by}` : ''}.
                </p>
              ) : null}
              {record.content_hash ? (
                <p className="font-mono text-[9px] leading-relaxed text-ink-400 break-all">
                  Hash: {record.content_hash}
                </p>
              ) : null}

              {canSign && isDraft ? (
                <form action={signMedicalRecordAction}>
                  <input type="hidden" name="recordId" value={record.id} />
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-navy-800"
                  >
                    <LockKeyhole className="h-3.5 w-3.5" strokeWidth={2} />
                    Assinar prontuário
                  </button>
                </form>
              ) : null}

              {!isDraft && record.status === 'assinado' && canEdit ? (
                <form action={rectifyMedicalRecordAction}>
                  <input type="hidden" name="recordId" value={record.id} />
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-warning-soft/40 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-warning-soft"
                  >
                    <FilePenLine className="h-3.5 w-3.5" strokeWidth={2} />
                    Criar retificação (nova versão)
                  </button>
                </form>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Alergias do paciente" description="Registros de alergia." />
            <CardBody className="space-y-2">
              {allergies.length === 0 ? (
                <p className="text-xs text-ink-500">Nenhuma alergia registrada.</p>
              ) : (
                allergies.map((allergy) => (
                  <div
                    key={allergy.id}
                    className="rounded-xl border border-line bg-sky-25 px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-bold text-ink-700">
                        {allergy.substance}
                      </p>
                      <Badge
                        tone={
                          allergy.severity === 'grave'
                            ? 'danger'
                            : allergy.severity === 'moderada'
                              ? 'warning'
                              : 'info'
                        }
                        dot
                      >
                        {allergy.severity}
                      </Badge>
                    </div>
                    {allergy.reaction ? (
                      <p className="text-[10px] text-ink-500">
                        Reação: {allergy.reaction}
                      </p>
                    ) : null}
                    {allergy.notes ? (
                      <p className="text-[10px] text-ink-400">{allergy.notes}</p>
                    ) : null}
                  </div>
                ))
              )}
              {access.permissions.has('prontuarios:edit') ? (
                <form action={addAllergyAction} className="mt-2 space-y-2">
                  <input type="hidden" name="patientId" value={record.patient_id} />
                  <input
                    name="substance"
                    placeholder="Substância (ex.: Penicilina)"
                    className="h-9 w-full rounded-xl border border-[#737373] bg-white px-3 text-xs outline-none transition focus:border-navy-600"
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      name="reaction"
                      placeholder="Reação"
                      className="h-9 rounded-xl border border-[#737373] bg-white px-3 text-xs outline-none transition focus:border-navy-600"
                    />
                    <select
                      name="severity"
                      defaultValue="moderada"
                      className="h-9 rounded-xl border border-[#737373] bg-white px-3 text-xs outline-none transition focus:border-navy-600"
                    >
                      <option value="leve">Leve</option>
                      <option value="moderada">Moderada</option>
                      <option value="grave">Grave</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-navy-800"
                  >
                    Registrar alergia
                  </button>
                </form>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Notas clínicas"
              description="Evoluções e adendos do registro."
            />
            <CardBody className="space-y-3">
              {notes.length === 0 ? (
                <p className="text-xs text-ink-500">Nenhuma nota registrada.</p>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-xl border border-line bg-sky-25 px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-bold text-ink-700">
                        {note.note_type}
                      </p>
                      <StatusBadge status={note.status} />
                    </div>
                    <p className="mt-1 text-xs text-ink-700">{note.content}</p>
                    <p className="mt-1 text-[10px] text-ink-400">
                      {formatDateTime(note.created_at)}
                    </p>
                  </div>
                ))
              )}
              {access.permissions.has('prontuarios:create') && record.status !== 'cancelado' ? (
                <form action={addClinicalNoteAction} className="space-y-2">
                  <input type="hidden" name="recordId" value={record.id} />
                  <select
                    name="noteType"
                    defaultValue="evolucao"
                    className="h-9 w-full rounded-xl border border-[#737373] bg-white px-3 text-xs outline-none transition focus:border-navy-600"
                  >
                    <option value="anamnese">Anamnese</option>
                    <option value="evolucao">Evolução</option>
                    <option value="procedimento">Procedimento</option>
                    <option value="adendo">Adendo</option>
                  </select>
                  <textarea
                    name="content"
                    required
                    rows={3}
                    placeholder="Conteúdo da nota clínica…"
                    className="w-full rounded-xl border border-[#737373] bg-white px-3 py-2 text-xs outline-none transition focus:border-navy-600"
                  />
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-navy-800"
                  >
                    Adicionar nota
                  </button>
                </form>
              ) : null}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
