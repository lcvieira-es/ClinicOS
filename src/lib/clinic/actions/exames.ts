'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
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

const examOrderSchema = z.object({
  patientId: z.string().trim().regex(UUID_RE, 'Paciente inválido.'),
  professionalId: z.string().trim().regex(UUID_RE, 'Profissional inválido.'),
  appointmentId: UUID_OPT,
  priority: z.enum(['rotina', 'urgente', 'emergencia']),
  laboratory: z.string().trim().optional(),
  clinicalIndication: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

function clean(value: string | undefined | null): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed ? trimmed : null;
}

export async function createExamOrderAction(
  _previous: ClinicFormState,
  formData: FormData,
): Promise<ClinicFormState> {
  let userId: string;
  let clinicId: string;
  try {
    const access = await requireModulePermission('exames', 'exames:create');
    userId = access.user.id;
    clinicId = access.user.activeClinicId;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }

  const parsed = examOrderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const data = parsed.data;

  const examNames = formData.getAll('examName').map((v) => String(v).trim());
  const tussCodes = formData.getAll('tussCode').map((v) => String(v).trim());

  const items = examNames
    .map((name, index) => ({ name, tuss: tussCodes[index] ?? '' }))
    .filter((item) => item.name.length > 0);

  if (items.length === 0) {
    return { error: 'Adicione ao menos um exame.' };
  }

  try {
    const id = await withTenant({ userId, clinicId }, async (tx) => {
      const rows = await tx.query<{ id: string }>(
        `insert into exam_orders
           (clinic_id, patient_id, professional_id, appointment_id, priority,
            laboratory, clinical_indication, notes, status, created_by)
         values
           ($1, $2::uuid, $3::uuid, $4::uuid, $5::exam_priority,
            $6, $7, $8, 'solicitado', $9::uuid)
         returning id`,
        [
          clinicId,
          data.patientId,
          data.professionalId,
          clean(data.appointmentId) || null,
          data.priority,
          clean(data.laboratory),
          clean(data.clinicalIndication),
          clean(data.notes),
          userId,
        ],
      );

      const orderId = rows[0]?.id;
      if (!orderId) throw new ActionError('Não foi possível criar a solicitação.');

      let sort = 0;
      for (const item of items) {
        await tx.query(
          `insert into exam_order_items
             (clinic_id, exam_order_id, exam_name, tuss_code, status, sort_order)
           values ($1, $2::uuid, $3, $4, 'solicitado', $5)`,
          [clinicId, orderId, item.name, clean(item.tuss), sort++],
        );
      }

      return orderId;
    });

    revalidatePath('/app/exames');
    revalidatePath(`/app/exames/${id}`);
    return { success: 'Solicitação de exames criada.', id };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }
}

export async function releaseExamResultAction(formData: FormData) {
  const orderId = String(formData.get('orderId') ?? '');
  const itemId = String(formData.get('itemId') ?? '');
  const resultSummary = String(formData.get('resultSummary') ?? '').trim();
  const resultText = String(formData.get('resultText') ?? '').trim();
  const referenceRange = String(formData.get('referenceRange') ?? '').trim();
  const access = await guardAction('exames', 'exames:result', '/app/exames');

  if (!isUuid(orderId) || !isUuid(itemId)) {
    redirect(`/app/exames?erro=${encodeURIComponent('Dados inválidos.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      async (tx) => {
        await tx.query(
          `insert into exam_results
             (clinic_id, exam_order_id, exam_order_item_id, result_summary, result_text, reference_range, released_by, released_at, status)
           values ($1, $2::uuid, $3::uuid, $4, $5, $6, $7::uuid, now(), 'liberado')`,
          [
            access.user.activeClinicId,
            orderId,
            itemId,
            resultSummary || null,
            resultText || null,
            referenceRange || null,
            access.user.id,
          ],
        );
        await tx.query(
          `update exam_order_items set status = 'resultado_disponivel' where id = $1`,
          [itemId],
        );
        await tx.query(
          `update exam_orders set status = 'resultado_disponivel', updated_at = now()
            where id = $1
              and not exists (select 1 from exam_order_items where exam_order_id = $1 and status <> 'resultado_disponivel')`,
          [orderId],
        );
      },
    );
    revalidatePath(`/app/exames/${orderId}`);
    redirect(`/app/exames/${orderId}?msg=${encodeURIComponent('Resultado liberado.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`/app/exames/${orderId}?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}

export async function cancelExamOrderAction(formData: FormData) {
  const orderId = String(formData.get('orderId') ?? '');
  const access = await guardAction('exames', 'exames:delete', '/app/exames');

  if (!isUuid(orderId)) {
    redirect(`/app/exames?erro=${encodeURIComponent('Solicitação inválida.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      (tx) =>
        tx.query(
          `update exam_orders set status = 'cancelado', updated_at = now() where id = $1`,
          [orderId],
        ),
    );
    revalidatePath('/app/exames');
    redirect(`/app/exames?msg=${encodeURIComponent('Solicitação cancelada.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`/app/exames?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}
