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

const prescriptionSchema = z.object({
  patientId: z.string().trim().regex(UUID_RE, 'Paciente inválido.'),
  professionalId: z.string().trim().regex(UUID_RE, 'Profissional inválido.'),
  appointmentId: UUID_OPT,
  type: z.enum(['simples', 'controle_especial', 'antimicrobiano', 'notificacao_a']),
  notes: z.string().trim().optional(),
});

function clean(value: string | undefined | null): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed ? trimmed : null;
}

export async function createPrescriptionAction(
  _previous: ClinicFormState,
  formData: FormData,
): Promise<ClinicFormState> {
  let userId: string;
  let clinicId: string;
  try {
    const access = await requireModulePermission('prescricoes', 'prescricoes:create');
    userId = access.user.id;
    clinicId = access.user.activeClinicId;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }

  const parsed = prescriptionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const data = parsed.data;

  const names = formData.getAll('medicationName').map((v) => String(v).trim());
  const doses = formData.getAll('dose').map((v) => String(v).trim());
  const frequencies = formData.getAll('frequency').map((v) => String(v).trim());
  const durations = formData.getAll('duration').map((v) => String(v).trim());
  const routes = formData.getAll('route').map((v) => String(v).trim());
  const quantities = formData.getAll('quantity').map((v) => String(v).trim());
  const instructions = formData.getAll('instructions').map((v) => String(v).trim());

  const items = names
    .map((name, index) => ({
      name,
      dose: doses[index] ?? '',
      frequency: frequencies[index] ?? '',
      duration: durations[index] ?? '',
      route: routes[index] ?? '',
      quantity: quantities[index] ?? '',
      instructions: instructions[index] ?? '',
    }))
    .filter((item) => item.name.length > 0);

  if (items.length === 0) {
    return { error: 'Adicione ao menos um medicamento.' };
  }

  try {
    const id = await withTenant({ userId, clinicId }, async (tx) => {
      const rows = await tx.query<{ id: string }>(
        `insert into prescriptions
           (clinic_id, patient_id, professional_id, appointment_id, type, status, notes, created_by)
         values
           ($1, $2::uuid, $3::uuid, $4::uuid, $5::prescription_type, 'rascunho', $6, $7::uuid)
         returning id`,
        [
          clinicId,
          data.patientId,
          data.professionalId,
          clean(data.appointmentId) || null,
          data.type,
          clean(data.notes),
          userId,
        ],
      );

      const prescriptionId = rows[0]?.id;
      if (!prescriptionId) {
        throw new ActionError('Não foi possível criar a prescrição.');
      }

      let sort = 0;
      for (const item of items) {
        await tx.query(
          `insert into prescription_items
             (clinic_id, prescription_id, medication_name, dose, frequency, duration, route, quantity, instructions, sort_order)
           values ($1, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            clinicId,
            prescriptionId,
            item.name,
            clean(item.dose),
            clean(item.frequency),
            clean(item.duration),
            clean(item.route),
            item.quantity ? Number(item.quantity.replace(',', '.')) : null,
            clean(item.instructions),
            sort++,
          ],
        );
      }

      return prescriptionId;
    });

    revalidatePath('/app/prescricoes');
    revalidatePath(`/app/prescricoes/${id}`);
    return { success: 'Prescrição criada como rascunho.', id };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }
}

export async function signPrescriptionAction(formData: FormData) {
  const prescriptionId = String(formData.get('prescriptionId') ?? '');
  const back = `/app/prescricoes/${prescriptionId}`;
  const access = await guardAction('prescricoes', 'prescricoes:sign', '/app/prescricoes');

  if (!isUuid(prescriptionId)) {
    redirect(`/app/prescricoes?erro=${encodeURIComponent('Prescrição inválida.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      async (tx) => {
        const rows = await tx.query<{
          status: string;
          professional_id: string;
        }>(
          `select status::text as status, professional_id::text as professional_id
             from prescriptions where id = $1`,
          [prescriptionId],
        );
        if (rows.length === 0) {
          throw new ActionError('Prescrição não encontrada.');
        }
        if (rows[0].status !== 'rascunho') {
          throw new ActionError('Apenas rascunhos podem ser assinados.');
        }

        const isOwner =
          rows[0].professional_id ===
          (await tx.query<{ id: string }>(
            `select app_professional_id($1) as id`,
            [access.user.activeClinicId],
          ))[0]?.id;
        const isAdmin = access.user.activeMembership.role === 'clinic_admin';
        if (!isAdmin && !isOwner) {
          throw new ActionError(
            'Apenas o profissional responsável pode assinar esta prescrição.',
          );
        }

        const items = await tx.query<{
          medication_name: string;
          dose: string | null;
          frequency: string | null;
          duration: string | null;
          route: string | null;
          quantity: string | null;
          instructions: string | null;
        }>(
          `select medication_name, dose, frequency, duration, route, quantity::text as quantity, instructions
             from prescription_items where prescription_id = $1 order by sort_order`,
          [prescriptionId],
        );

        const canonical = JSON.stringify(items);
        const contentHash = createHash('sha256').update(canonical).digest('hex');
        const verificationCode = randomBytes(6).toString('hex').toUpperCase();
        const signedAt = new Date().toISOString();
        const signatureHash = createHash('sha256')
          .update(`${contentHash}|${access.user.id}|${signedAt}`)
          .digest('hex');

        await tx.query(
          `update prescriptions set
             status = 'emitida',
             issued_at = $2::timestamptz,
             signed_at = $2::timestamptz,
             signed_by = $3::uuid,
             content_hash = $4,
             signature_hash = $5,
             signature_method = 'interno_hash',
             verification_code = $6,
             updated_at = now()
           where id = $1`,
          [prescriptionId, signedAt, access.user.id, contentHash, signatureHash, verificationCode],
        );
      },
    );

    revalidatePath('/app/prescricoes');
    revalidatePath(back);
    redirect(`${back}?msg=${encodeURIComponent('Prescrição assinada e emitida.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`${back}?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}

export async function cancelPrescriptionAction(formData: FormData) {
  const prescriptionId = String(formData.get('prescriptionId') ?? '');
  const back = `/app/prescricoes/${prescriptionId}`;
  const access = await guardAction('prescricoes', 'prescricoes:cancel', '/app/prescricoes');

  if (!isUuid(prescriptionId)) {
    redirect(`/app/prescricoes?erro=${encodeURIComponent('Prescrição inválida.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      (tx) =>
        tx.query(
          `update prescriptions set status = 'cancelada', updated_at = now() where id = $1 and status = 'rascunho'`,
          [prescriptionId],
        ),
    );
    revalidatePath('/app/prescricoes');
    revalidatePath(back);
    redirect(`${back}?msg=${encodeURIComponent('Prescrição cancelada.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`${back}?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}
