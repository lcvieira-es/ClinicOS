'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createHash, randomBytes } from 'node:crypto';
import { guardAction, requireModulePermission } from '@/lib/clinic/module-guard';
import { withTenant } from '@/lib/db';
import type { ClinicFormState } from '@/lib/clinic/form-state';
import {
  ActionError,
  errorMessage,
  isRedirectError,
  isUuid,
} from '@/lib/clinic/validation';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_OPT = z
  .string()
  .trim()
  .regex(UUID_RE, 'Identificador inválido.')
  .or(z.literal(''))
  .optional();

const recordSchema = z.object({
  patientId: z.string().trim().regex(UUID_RE, 'Paciente inválido.'),
  professionalId: z.string().trim().regex(UUID_RE, 'Profissional inválido.'),
  appointmentId: UUID_OPT,
  recordDate: z.string().trim().optional(),
  chiefComplaint: z.string().trim().optional(),
  historyPresentIllness: z.string().trim().optional(),
  physicalExam: z.string().trim().optional(),
  assessment: z.string().trim().optional(),
  plan: z.string().trim().optional(),
  icd10Codes: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

function clean(value: string | undefined | null): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed ? trimmed : null;
}

function parseIcd10(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[,\s]+/)
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

function computeContentHash(record: {
  chiefComplaint: string | null;
  historyPresentIllness: string | null;
  physicalExam: string | null;
  assessment: string | null;
  plan: string | null;
  icd10Codes: string[];
  notes: string | null;
}): string {
  const canonical = JSON.stringify(record, Object.keys(record).sort());
  return createHash('sha256').update(canonical).digest('hex');
}

function generateVerificationCode(): string {
  return randomBytes(6).toString('hex').toUpperCase();
}

export async function createMedicalRecordAction(
  _previous: ClinicFormState,
  formData: FormData,
): Promise<ClinicFormState> {
  let userId: string;
  let clinicId: string;
  try {
    const access = await requireModulePermission('prontuarios', 'prontuarios:create');
    userId = access.user.id;
    clinicId = access.user.activeClinicId;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }

  const parsed = recordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const data = parsed.data;

  try {
    const id = await withTenant({ userId, clinicId }, async (tx) => {
      const rows = await tx.query<{ id: string }>(
        `insert into medical_records (
           clinic_id, patient_id, professional_id, appointment_id, record_date,
           chief_complaint, history_present_illness, physical_exam, assessment,
           plan, icd10_codes, notes, status, version, created_by
         ) values (
           $1, $2::uuid, $3::uuid, $4::uuid, coalesce($5::timestamptz, now()),
           $6, $7, $8, $9,
           $10, $11::text[], $12, 'rascunho', 1, $13::uuid
         )
         returning id`,
        [
          clinicId,
          data.patientId,
          data.professionalId,
          clean(data.appointmentId) || null,
          clean(data.recordDate) || null,
          clean(data.chiefComplaint),
          clean(data.historyPresentIllness),
          clean(data.physicalExam),
          clean(data.assessment),
          clean(data.plan),
          parseIcd10(data.icd10Codes),
          clean(data.notes),
          userId,
        ],
      );

      const recordId = rows[0]?.id;
      if (!recordId) throw new ActionError('Não foi possível criar o prontuário.');
      return recordId;
    });

    revalidatePath('/app/prontuarios');
    revalidatePath(`/app/prontuarios/${id}`);
    return { success: 'Prontuário criado como rascunho.', id };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }
}

export async function updateMedicalRecordAction(
  _previous: ClinicFormState,
  formData: FormData,
): Promise<ClinicFormState> {
  let userId: string;
  let clinicId: string;
  try {
    const access = await requireModulePermission('prontuarios', 'prontuarios:edit');
    userId = access.user.id;
    clinicId = access.user.activeClinicId;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }

  const recordId = String(formData.get('recordId') ?? '');
  if (!isUuid(recordId)) return { error: 'Prontuário inválido.' };

  const parsed = recordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const data = parsed.data;

  try {
    await withTenant({ userId, clinicId }, async (tx) => {
      const rows = await tx.query<{ status: string; professional_id: string }>(
        `select status::text as status, professional_id::text as professional_id
           from medical_records where id = $1`,
        [recordId],
      );
      if (rows.length === 0) {
        throw new ActionError('Prontuário não encontrado.');
      }
      if (rows[0].status !== 'rascunho') {
        throw new ActionError(
          'Apenas rascunhos podem ser editados. Use retificação para alterar um documento assinado.',
        );
      }

      const icd10 = parseIcd10(data.icd10Codes);

      await tx.query(
        `update medical_records set
           patient_id = $2::uuid,
           professional_id = $3::uuid,
           appointment_id = $4::uuid,
           record_date = coalesce($5::timestamptz, record_date),
           chief_complaint = $6,
           history_present_illness = $7,
           physical_exam = $8,
           assessment = $9,
           plan = $10,
           icd10_codes = $11::text[],
           notes = $12,
           updated_at = now()
         where id = $1`,
        [
          recordId,
          data.patientId,
          data.professionalId,
          clean(data.appointmentId) || null,
          clean(data.recordDate) || null,
          clean(data.chiefComplaint),
          clean(data.historyPresentIllness),
          clean(data.physicalExam),
          clean(data.assessment),
          clean(data.plan),
          icd10,
          clean(data.notes),
        ],
      );
    });

    revalidatePath('/app/prontuarios');
    revalidatePath(`/app/prontuarios/${recordId}`);
    return { success: 'Prontuário atualizado.', id: recordId };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }
}

export async function signMedicalRecordAction(formData: FormData) {
  const recordId = String(formData.get('recordId') ?? '');
  const back = `/app/prontuarios/${recordId}`;
  const access = await guardAction('prontuarios', 'prontuarios:sign', '/app/prontuarios');

  if (!isUuid(recordId)) {
    redirect(`/app/prontuarios?erro=${encodeURIComponent('Prontuário inválido.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      async (tx) => {
        const rows = await tx.query<{
          status: string;
          professional_id: string;
          chief_complaint: string | null;
          history_present_illness: string | null;
          physical_exam: string | null;
          assessment: string | null;
          plan: string | null;
          icd10_codes: string[] | null;
          notes: string | null;
        }>(
          `select status::text as status,
                  professional_id::text as professional_id,
                  chief_complaint,
                  history_present_illness,
                  physical_exam,
                  assessment,
                  plan,
                  icd10_codes,
                  notes
             from medical_records where id = $1`,
          [recordId],
        );
        if (rows.length === 0) {
          throw new ActionError('Prontuário não encontrado.');
        }
        const record = rows[0];
        if (record.status !== 'rascunho') {
          throw new ActionError('Apenas rascunhos podem ser assinados.');
        }

        // Propriedade do profissional: apenas o dono (ou admin) assina.
        const isOwner =
          record.professional_id === (await tx.query<{ id: string }>(
            `select app_professional_id($1) as id`,
            [access.user.activeClinicId],
          ))[0]?.id;
        const isAdmin = access.user.activeMembership.role === 'clinic_admin';
        if (!isAdmin && !isOwner) {
          throw new ActionError(
            'Apenas o profissional responsável pode assinar este prontuário.',
          );
        }

        const icd10 = record.icd10_codes ?? [];
        const contentHash = computeContentHash({
          chiefComplaint: record.chief_complaint,
          historyPresentIllness: record.history_present_illness,
          physicalExam: record.physical_exam,
          assessment: record.assessment,
          plan: record.plan,
          icd10Codes: icd10,
          notes: record.notes,
        });

        const verificationCode = generateVerificationCode();
        const signedAt = new Date().toISOString();
        const signatureHash = createHash('sha256')
          .update(`${contentHash}|${access.user.id}|${signedAt}`)
          .digest('hex');

        await tx.query(
          `update medical_records set
             status = 'assinado',
             signed_at = $2::timestamptz,
             signed_by = $3::uuid,
             content_hash = $4,
             signature_hash = $5,
             signature_method = 'interno_hash',
             verification_code = $6,
             updated_at = now()
           where id = $1`,
          [recordId, signedAt, access.user.id, contentHash, signatureHash, verificationCode],
        );

        await tx.query(
          `insert into record_access_logs (clinic_id, medical_record_id, user_id, action)
           values ($1, $2::uuid, $3::uuid, 'sign')`,
          [access.user.activeClinicId, recordId, access.user.id],
        );
      },
    );

    revalidatePath('/app/prontuarios');
    revalidatePath(back);
    redirect(`${back}?msg=${encodeURIComponent('Prontuário assinado com sucesso.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`${back}?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}

export async function rectifyMedicalRecordAction(formData: FormData) {
  const recordId = String(formData.get('recordId') ?? '');
  const back = `/app/prontuarios/${recordId}`;
  const access = await guardAction('prontuarios', 'prontuarios:edit', '/app/prontuarios');

  if (!isUuid(recordId)) {
    redirect(`/app/prontuarios?erro=${encodeURIComponent('Prontuário inválido.')}`);
  }

  try {
    const newId = await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      async (tx) => {
        const rows = await tx.query<{
          patient_id: string;
          professional_id: string;
          appointment_id: string | null;
          status: string;
          version: number;
          chief_complaint: string | null;
          history_present_illness: string | null;
          physical_exam: string | null;
          assessment: string | null;
          plan: string | null;
          icd10_codes: string[] | null;
          notes: string | null;
        }>(
          `select patient_id::text as patient_id,
                  professional_id::text as professional_id,
                  appointment_id::text as appointment_id,
                  status::text as status,
                  version,
                  chief_complaint,
                  history_present_illness,
                  physical_exam,
                  assessment,
                  plan,
                  icd10_codes,
                  notes
             from medical_records where id = $1`,
          [recordId],
        );
        if (rows.length === 0) {
          throw new ActionError('Prontuário não encontrado.');
        }
        const record = rows[0];
        if (record.status !== 'assinado') {
          throw new ActionError(
            'Apenas documentos assinados podem ser retificados.',
          );
        }

        // Marca o original como retificado.
        await tx.query(
          `update medical_records set status = 'retificado', updated_at = now() where id = $1`,
          [recordId],
        );

        const newRows = await tx.query<{ id: string }>(
          `insert into medical_records (
             clinic_id, patient_id, professional_id, appointment_id, record_date,
             chief_complaint, history_present_illness, physical_exam, assessment,
             plan, icd10_codes, notes, status, version, parent_id, created_by
           ) values (
             $1, $2::uuid, $3::uuid, $4::uuid, now(),
             $5, $6, $7, $8,
             $9, $10::text[], $11, 'rascunho', $12, $13::uuid, $14::uuid
           )
           returning id`,
          [
            access.user.activeClinicId,
            record.patient_id,
            record.professional_id,
            record.appointment_id,
            record.chief_complaint,
            record.history_present_illness,
            record.physical_exam,
            record.assessment,
            record.plan,
            record.icd10_codes ?? [],
            record.notes,
            record.version + 1,
            recordId,
            access.user.id,
          ],
        );

        const newId = newRows[0]?.id;
        if (!newId) throw new ActionError('Não foi possível criar a retificação.');
        return newId;
      },
    );

    revalidatePath('/app/prontuarios');
    redirect(`/app/prontuarios/${newId}?msg=${encodeURIComponent('Retificação criada como novo rascunho.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`${back}?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}

export async function addClinicalNoteAction(formData: FormData) {
  const recordId = String(formData.get('recordId') ?? '');
  const noteType = String(formData.get('noteType') ?? 'evolucao');
  const content = String(formData.get('content') ?? '').trim();
  const access = await guardAction('prontuarios', 'prontuarios:create', '/app/prontuarios');

  if (!isUuid(recordId) || !content) {
    redirect(`/app/prontuarios?erro=${encodeURIComponent('Dados inválidos.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      async (tx) => {
        const rows = await tx.query<{ patient_id: string }>(
          `select patient_id::text as patient_id from medical_records where id = $1`,
          [recordId],
        );
        if (rows.length === 0) throw new ActionError('Prontuário não encontrado.');

        await tx.query(
          `insert into clinical_notes
             (clinic_id, medical_record_id, patient_id, professional_id, note_type, content, status, created_by)
           values ($1, $2::uuid, $3::uuid, $4::uuid, $5::clinical_note_type, $6, 'rascunho', $7::uuid)`,
          [
            access.user.activeClinicId,
            recordId,
            rows[0].patient_id,
            (await tx.query<{ id: string }>(
              `select app_professional_id($1) as id`,
              [access.user.activeClinicId],
            ))[0]?.id ?? null,
            noteType,
            content,
            access.user.id,
          ],
        );
      },
    );
    revalidatePath(`/app/prontuarios/${recordId}`);
    redirect(`/app/prontuarios/${recordId}?msg=${encodeURIComponent('Nota adicionada.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`/app/prontuarios/${recordId}?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}

export async function addAllergyAction(formData: FormData) {
  const patientId = String(formData.get('patientId') ?? '');
  const substance = String(formData.get('substance') ?? '').trim();
  const reaction = String(formData.get('reaction') ?? '').trim();
  const severity = String(formData.get('severity') ?? 'moderada');
  const notes = String(formData.get('notes') ?? '').trim();
  const access = await guardAction('prontuarios', 'prontuarios:edit', '/app/prontuarios');

  if (!isUuid(patientId) || !substance) {
    redirect(`/app/prontuarios?erro=${encodeURIComponent('Dados inválidos.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      (tx) =>
        tx.query(
          `insert into allergies (clinic_id, patient_id, substance, reaction, severity, notes, status, noted_by)
           values ($1, $2::uuid, $3, $4, $5::allergy_severity, $6, 'ativo', $7::uuid)`,
          [
            access.user.activeClinicId,
            patientId,
            substance,
            reaction || null,
            severity,
            notes || null,
            access.user.id,
          ],
        ),
    );
    revalidatePath(`/app/pacientes/${patientId}`);
    redirect(`/app/pacientes/${patientId}?msg=${encodeURIComponent('Alergia registrada.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`/app/pacientes/${patientId}?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}

export async function deleteAllergyAction(formData: FormData) {
  const allergyId = String(formData.get('allergyId') ?? '');
  const patientId = String(formData.get('patientId') ?? '');
  const access = await guardAction('prontuarios', 'prontuarios:edit', '/app/prontuarios');

  if (!isUuid(allergyId)) {
    redirect(`/app/pacientes/${patientId}?erro=${encodeURIComponent('Alergia inválida.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      (tx) => tx.query(`delete from allergies where id = $1`, [allergyId]),
    );
    revalidatePath(`/app/pacientes/${patientId}`);
    redirect(`/app/pacientes/${patientId}?msg=${encodeURIComponent('Alergia removida.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`/app/pacientes/${patientId}?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}
