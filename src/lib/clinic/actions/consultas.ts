'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { guardAction, requireModulePermission } from '@/lib/clinic/module-guard';
import { withTenant } from '@/lib/db';
import type { ClinicFormState } from '@/lib/clinic/form-state';
import {
  ActionError,
  errorMessage,
  isRedirectError,
  isUuid,
} from '@/lib/clinic/validation';

const VALID_STATUSES = new Set([
  'agendada',
  'confirmada',
  'aguardando',
  'em_atendimento',
  'realizada',
  'cancelada',
  'faltou',
]);

const TRANSITIONS: Record<string, string[]> = {
  agendada: ['confirmada', 'aguardando', 'cancelada', 'faltou'],
  confirmada: ['aguardando', 'cancelada', 'faltou'],
  aguardando: ['em_atendimento', 'cancelada', 'faltou'],
  em_atendimento: ['realizada', 'cancelada'],
  realizada: [],
  cancelada: [],
  faltou: [],
};

export async function transitionAppointmentAction(formData: FormData) {
  const appointmentId = String(formData.get('appointmentId') ?? '');
  const toStatus = String(formData.get('toStatus') ?? '');
  const notes = String(formData.get('notes') ?? '').trim();
  const reason = String(formData.get('reason') ?? '').trim();
  const back = `/app/consultas`;

  const needsCancelPermission = toStatus === 'cancelada';
  const access = await guardAction(
    'consultas',
    needsCancelPermission ? 'agenda:delete' : 'consultas:create',
    back,
  );

  if (!isUuid(appointmentId) || !VALID_STATUSES.has(toStatus)) {
    redirect(`${back}?erro=${encodeURIComponent('Dados inválidos.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      async (tx) => {
        const rows = await tx.query<{ status: string }>(
          `select status::text as status from appointments where id = $1`,
          [appointmentId],
        );
        if (rows.length === 0) {
          throw new ActionError('Consulta não encontrada.');
        }
        const fromStatus = rows[0].status;
        if (!TRANSITIONS[fromStatus]?.includes(toStatus)) {
          throw new ActionError(
            `Transição de "${fromStatus}" para "${toStatus}" não permitida.`,
          );
        }

        const updates: string[] = ['status = $2::appointment_status', 'updated_at = now()'];
        const params: unknown[] = [appointmentId, toStatus];

        if (toStatus === 'aguardando') {
          updates.push('checked_in_at = coalesce(checked_in_at, now())');
        } else if (toStatus === 'em_atendimento') {
          updates.push('started_at = coalesce(started_at, now())');
        } else if (toStatus === 'realizada') {
          updates.push('finished_at = coalesce(finished_at, now())');
        } else if (toStatus === 'cancelada') {
          updates.push('cancelled_by = $3::uuid');
          params.push(access.user.id);
          if (reason) {
            updates.push(`cancellation_reason = $${params.length + 1}`);
            params.push(reason);
          }
        }

        await tx.query(
          `update appointments set ${updates.join(', ')} where id = $1`,
          params,
        );

        await tx.query(
          `insert into appointment_status_history
             (clinic_id, appointment_id, from_status, to_status, changed_by, notes)
           values ($1, $2, $3::appointment_status, $4::appointment_status, $5, $6)`,
          [
            access.user.activeClinicId,
            appointmentId,
            fromStatus,
            toStatus,
            access.user.id,
            notes || reason || `Status alterado para ${toStatus}.`,
          ],
        );
      },
    );

    revalidatePath('/app/agenda');
    revalidatePath('/app/consultas');
    redirect(`/app/consultas?msg=${encodeURIComponent('Status atualizado.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`/app/consultas?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}

export async function saveAppointmentNotesAction(formData: FormData) {
  const appointmentId = String(formData.get('appointmentId') ?? '');
  const notes = String(formData.get('notes') ?? '').trim();
  const access = await guardAction('consultas', 'consultas:edit', '/app/consultas');

  if (!isUuid(appointmentId)) {
    redirect(`/app/consultas?erro=${encodeURIComponent('Consulta inválida.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      (tx) =>
        tx.query(`update appointments set notes = $2, updated_at = now() where id = $1`, [
          appointmentId,
          notes || null,
        ]),
    );
    revalidatePath('/app/consultas');
    redirect(`/app/consultas?msg=${encodeURIComponent('Observações salvas.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`/app/consultas?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}
