'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { guardAction, requireModulePermission } from '@/lib/clinic/module-guard';
import { withTenant } from '@/lib/db';
import { getUsage, limitError, readPlanLimits } from '@/lib/clinic/limits';
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

const appointmentSchema = z.object({
  patientId: z.string().trim().regex(UUID_RE, 'Paciente inválido.'),
  professionalId: z.string().trim().regex(UUID_RE, 'Profissional inválido.'),
  unitId: z.string().trim().regex(UUID_RE, 'Unidade inválida.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido.'),
  durationMin: z.string().trim().optional(),
  type: z.enum(['consulta', 'retorno', 'procedimento', 'teleconsulta', 'avaliacao']),
  paymentMethod: z.enum([
    'particular',
    'pix',
    'dinheiro',
    'cartao_credito',
    'cartao_debito',
    'boleto',
    'convenio',
    'transferencia',
    'outro',
  ]),
  amount: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

const blockSchema = z.object({
  professionalId: z.string().trim().regex(UUID_RE, 'Profissional inválido.'),
  unitId: UUID_OPT,
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Início inválido.'),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Fim inválido.'),
  reason: z.string().trim().optional(),
});

const waitingSchema = z.object({
  patientId: z.string().trim().regex(UUID_RE, 'Paciente inválido.'),
  unitId: z.string().trim().regex(UUID_RE, 'Unidade inválida.'),
  professionalId: UUID_OPT,
  priority: z.string().trim().optional(),
  desiredFrom: z.string().trim().optional(),
  desiredTo: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

function clean(value: string | undefined | null): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed ? trimmed : null;
}

function parseMoney(value: string | undefined): number {
  const raw = (value ?? '').trim();
  if (!raw) return 0;
  const normalized = raw.replace(/\./g, '').replace(',', '.');
  const number = Number(normalized);
  if (Number.isNaN(number) || number < 0) {
    throw new ActionError('Valor inválido.');
  }
  return number;
}

function parseIntSafe(value: string | undefined, fallback: number): number {
  const raw = (value ?? '').trim();
  if (!raw) return fallback;
  const number = Number.parseInt(raw, 10);
  if (Number.isNaN(number) || number <= 0) {
    throw new ActionError('Duração inválida.');
  }
  return number;
}

export async function createAppointmentAction(
  _previous: ClinicFormState,
  formData: FormData,
): Promise<ClinicFormState> {
  let userId: string;
  let clinicId: string;
  try {
    const access = await requireModulePermission('agenda', 'agenda:create');
    userId = access.user.id;
    clinicId = access.user.activeClinicId;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }

  const parsed = appointmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const data = parsed.data;

  let duration: number;
  let amount: number;
  try {
    duration = parseIntSafe(data.durationMin, 30);
    amount = parseMoney(data.amount);
  } catch (error) {
    return { error: errorMessage(error) };
  }

  const startIso = `${data.date}T${data.time}:00`;

  try {
    const id = await withTenant({ userId, clinicId }, async (tx) => {
      // Bloqueio de concorrência: serializa por profissional.
      await tx.query(`select pg_advisory_xact_lock(hashtext($1))`, [
        data.professionalId,
      ]);

      const start = new Date(startIso);
      const end = new Date(start.getTime() + duration * 60_000);
      const endIso = end.toISOString();

      const conflicts = await tx.query<{ id: string }>(
        `select id from appointments
          where professional_id = $1
            and status <> 'cancelada'
            and scheduled_start < $3::timestamptz
            and scheduled_end > $2::timestamptz
          limit 1`,
        [data.professionalId, startIso, endIso],
      );
      if (conflicts.length > 0) {
        throw new ActionError(
          'Já existe um agendamento neste horário para o profissional.',
        );
      }

      const blocks = await tx.query<{ id: string }>(
        `select id from schedule_blocks
          where professional_id = $1
            and starts_at < $3::timestamptz
            and ends_at > $2::timestamptz
          limit 1`,
        [data.professionalId, startIso, endIso],
      );
      if (blocks.length > 0) {
        throw new ActionError(
          'O profissional possui um bloqueio neste horário.',
        );
      }

      const rows = await tx.query<{ id: string }>(
        `insert into appointments (
           clinic_id, unit_id, patient_id, professional_id, type, status,
           scheduled_start, scheduled_end, payment_method, amount, notes,
           created_by
         ) values (
           $1, $2::uuid, $3::uuid, $4::uuid, $5::appointment_type, 'agendada',
           $6::timestamptz, $7::timestamptz, $8::payment_method, $9, $10, $11::uuid
         )
         returning id`,
        [
          clinicId,
          data.unitId,
          data.patientId,
          data.professionalId,
          data.type,
          startIso,
          endIso,
          data.paymentMethod,
          amount,
          clean(data.notes),
          userId,
        ],
      );

      const appointmentId = rows[0]?.id;
      if (!appointmentId) {
        throw new ActionError('Não foi possível criar o agendamento.');
      }

      await tx.query(
        `insert into appointment_status_history
           (clinic_id, appointment_id, from_status, to_status, changed_by, notes)
         values ($1, $2, null, 'agendada', $3, 'Agendamento criado.')`,
        [clinicId, appointmentId, userId],
      );

      return appointmentId;
    });

    revalidatePath('/app/agenda');
    revalidatePath('/app/consultas');
    return { success: 'Agendamento criado com sucesso.', id };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }
}

export async function cancelAppointmentAction(formData: FormData) {
  const appointmentId = String(formData.get('appointmentId') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  const back = `/app/agenda`;
  const access = await guardAction('agenda', 'agenda:delete', '/app/agenda');

  if (!isUuid(appointmentId)) {
    redirect(`/app/agenda?erro=${encodeURIComponent('Agendamento inválido.')}`);
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
          throw new ActionError('Agendamento não encontrado.');
        }
        const fromStatus = rows[0].status;
        if (fromStatus === 'cancelada') {
          throw new ActionError('Agendamento já cancelado.');
        }

        await tx.query(
          `update appointments
              set status = 'cancelada',
                  cancellation_reason = $2,
                  cancelled_by = $3,
                  updated_at = now()
            where id = $1`,
          [appointmentId, reason || null, access.user.id],
        );

        await tx.query(
          `insert into appointment_status_history
             (clinic_id, appointment_id, from_status, to_status, changed_by, notes)
           values ($1, $2, $3::appointment_status, 'cancelada', $4, $5)`,
          [
            access.user.activeClinicId,
            appointmentId,
            fromStatus,
            access.user.id,
            reason || 'Cancelado pelo usuário.',
          ],
        );
      },
    );

    revalidatePath('/app/agenda');
    revalidatePath('/app/consultas');
    redirect(`/app/agenda?msg=${encodeURIComponent('Agendamento cancelado.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`/app/agenda?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}

export async function createBlockAction(
  _previous: ClinicFormState,
  formData: FormData,
): Promise<ClinicFormState> {
  let userId: string;
  let clinicId: string;
  try {
    const access = await requireModulePermission('agenda', 'agenda:edit');
    userId = access.user.id;
    clinicId = access.user.activeClinicId;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }

  const parsed = blockSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const data = parsed.data;

  if (data.start >= data.end) {
    return { error: 'O fim deve ser posterior ao início.' };
  }

  try {
    const id = await withTenant({ userId, clinicId }, async (tx) => {
      const rows = await tx.query<{ id: string }>(
        `insert into schedule_blocks
           (clinic_id, professional_id, unit_id, starts_at, ends_at, reason, created_by)
         values
           ($1, $2::uuid, $3::uuid, $4::timestamptz, $5::timestamptz, $6, $7::uuid)
         returning id`,
        [
          clinicId,
          data.professionalId,
          clean(data.unitId) || null,
          data.start,
          data.end,
          clean(data.reason),
          userId,
        ],
      );
      const blockId = rows[0]?.id;
      if (!blockId) throw new ActionError('Não foi possível criar o bloqueio.');
      return blockId;
    });

    revalidatePath('/app/agenda/bloqueios');
    return { success: 'Bloqueio criado.', id };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }
}

export async function deleteBlockAction(formData: FormData) {
  const blockId = String(formData.get('blockId') ?? '');
  const access = await guardAction('agenda', 'agenda:edit', '/app/agenda/bloqueios');

  if (!isUuid(blockId)) {
    redirect(`/app/agenda/bloqueios?erro=${encodeURIComponent('Bloqueio inválido.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      (tx) => tx.query(`delete from schedule_blocks where id = $1`, [blockId]),
    );
    revalidatePath('/app/agenda/bloqueios');
    redirect(`/app/agenda/bloqueios?msg=${encodeURIComponent('Bloqueio removido.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`/app/agenda/bloqueios?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}

export async function addToWaitingListAction(
  _previous: ClinicFormState,
  formData: FormData,
): Promise<ClinicFormState> {
  let userId: string;
  let clinicId: string;
  try {
    const access = await requireModulePermission('agenda', 'agenda:create');
    userId = access.user.id;
    clinicId = access.user.activeClinicId;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }

  const parsed = waitingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const data = parsed.data;

  try {
    const id = await withTenant({ userId, clinicId }, async (tx) => {
      const rows = await tx.query<{ id: string }>(
        `insert into waiting_list
           (clinic_id, unit_id, patient_id, professional_id, priority,
            desired_from, desired_to, notes, status, created_by)
         values
           ($1, $2::uuid, $3::uuid, $4::uuid, $5, $6::timestamptz, $7::timestamptz, $8, 'aguardando', $9::uuid)
         returning id`,
        [
          clinicId,
          data.unitId,
          data.patientId,
          clean(data.professionalId) || null,
          Number(data.priority || 3),
          clean(data.desiredFrom) || null,
          clean(data.desiredTo) || null,
          clean(data.notes),
          userId,
        ],
      );
      const wlId = rows[0]?.id;
      if (!wlId) throw new ActionError('Não foi possível adicionar à lista.');
      return wlId;
    });

    revalidatePath('/app/agenda/lista-espera');
    return { success: 'Paciente adicionado à lista de espera.', id };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }
}

export async function updateWaitingListStatusAction(formData: FormData) {
  const id = String(formData.get('waitingId') ?? '');
  const status = String(formData.get('status') ?? '');
  const access = await guardAction(
    'agenda',
    'agenda:edit',
    '/app/agenda/lista-espera',
  );

  if (!isUuid(id) || !['aguardando', 'contatado', 'agendado', 'cancelado'].includes(status)) {
    redirect(`/app/agenda/lista-espera?erro=${encodeURIComponent('Dados inválidos.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      (tx) =>
        tx.query(`update waiting_list set status = $2 where id = $1`, [id, status]),
    );
    revalidatePath('/app/agenda/lista-espera');
    redirect(`/app/agenda/lista-espera?msg=${encodeURIComponent('Lista de espera atualizada.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`/app/agenda/lista-espera?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}

export async function deleteWaitingListItemAction(formData: FormData) {
  const id = String(formData.get('waitingId') ?? '');
  const access = await guardAction(
    'agenda',
    'agenda:delete',
    '/app/agenda/lista-espera',
  );

  if (!isUuid(id)) {
    redirect(`/app/agenda/lista-espera?erro=${encodeURIComponent('Item inválido.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      (tx) => tx.query(`delete from waiting_list where id = $1`, [id]),
    );
    revalidatePath('/app/agenda/lista-espera');
    redirect(`/app/agenda/lista-espera?msg=${encodeURIComponent('Item removido.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`/app/agenda/lista-espera?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}
