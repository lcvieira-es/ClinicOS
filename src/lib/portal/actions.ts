'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requirePortalUser } from '@/lib/auth/guards';
import { withTenant } from '@/lib/db';
import type { ClinicFormState } from '@/lib/clinic/form-state';
import { errorMessage, isRedirectError, isUuid } from '@/lib/clinic/validation';

export async function requestAppointmentAction(
  _previous: ClinicFormState,
  formData: FormData,
): Promise<ClinicFormState> {
  const user = await requirePortalUser();
  const access =
    user.portalAccess.find((item) => item.clinicId === user.activeClinicId) ??
    user.portalAccess[0];

  const patientId = access.patientId;
  const clinicId = access.clinicId;

  const professionalId = String(formData.get('professionalId') ?? '').trim();
  const unitId = String(formData.get('unitId') ?? '').trim();
  const date = String(formData.get('date') ?? '').trim();
  const time = String(formData.get('time') ?? '').trim();
  const type = String(formData.get('type') ?? 'consulta').trim();
  const notes = String(formData.get('notes') ?? '').trim();

  if (!isUuid(professionalId) || !isUuid(unitId)) {
    return { error: 'Selecione profissional e unidade.' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return { error: 'Data e horário inválidos.' };
  }

  try {
    await withTenant({ userId: user.id, clinicId }, async (tx) => {
      // conflito
      await tx.query(`select pg_advisory_xact_lock(hashtext($1))`, [professionalId]);
      const startIso = `${date}T${time}:00`;
      const durRows = await tx.query<{ default_duration_min: number }>(
        `select default_duration_min from professionals where id = $1`,
        [professionalId],
      );
      const duration = durRows[0]?.default_duration_min ?? 30;
      const endIso = new Date(new Date(startIso).getTime() + duration * 60_000).toISOString();

      const conflicts = await tx.query<{ id: string }>(
        `select id from appointments
          where professional_id = $1 and status <> 'cancelada'
            and scheduled_start < $3::timestamptz and scheduled_end > $2::timestamptz
          limit 1`,
        [professionalId, startIso, endIso],
      );
      if (conflicts.length > 0) {
        throw new Error('Horário indisponível para este profissional.');
      }

      const prof = await tx.query<{ consultation_price: string }>(
        `select consultation_price::text as consultation_price from professionals where id = $1`,
        [professionalId],
      );

      await tx.query(
        `insert into appointments
           (clinic_id, unit_id, patient_id, professional_id, type, status,
            scheduled_start, scheduled_end, payment_method, amount, notes, created_by)
         values
           ($1, $2::uuid, $3::uuid, $4::uuid, $5::appointment_type, 'agendada',
            $6::timestamptz, $7::timestamptz, 'particular', $8, $9, $3::uuid)`,
        [
          clinicId,
          unitId,
          patientId,
          professionalId,
          type,
          startIso,
          endIso,
          Number(prof[0]?.consultation_price ?? 0),
          notes || null,
        ],
      );
    });

    revalidatePath('/portal/consultas');
    redirect('/portal/consultas?msg=' + encodeURIComponent('Solicitação de consulta enviada.'));
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }
}
