'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { guardAction, requireModulePermission } from '@/lib/clinic/module-guard';
import { withTenant } from '@/lib/db';
import { getUsage, limitError, readPlanLimits } from '@/lib/clinic/limits';
import type { ClinicFormState } from '@/lib/clinic/form-state';
import { hashPassword } from '@/lib/auth/password';
import {
  ActionError,
  errorMessage,
  isRedirectError,
  isUuid,
} from '@/lib/clinic/validation';

const professionalSchema = z.object({
  fullName: z.string().trim().min(3, 'Nome do profissional obrigatório.'),
  council: z.string().trim().optional(),
  councilNumber: z.string().trim().optional(),
  councilState: z
    .string()
    .trim()
    .regex(/^[A-Z]{2}$/, 'UF do conselho inválida.')
    .or(z.literal(''))
    .optional(),
  specialties: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email('E-mail inválido.').or(z.literal('')).optional(),
  consultationPrice: z.string().trim().optional(),
  defaultDurationMin: z.string().trim().optional(),
  commissionPercent: z.string().trim().optional(),
  calendarColor: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  userId: z.string().trim().optional(),
});

function clean(value: string | undefined | null): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed ? trimmed : null;
}

function parseMoney(value: string | undefined, fallback: number): number {
  const raw = (value ?? '').trim();
  if (!raw) return fallback;
  const normalized = raw.replace(/\./g, '').replace(',', '.');
  const number = Number(normalized);
  if (Number.isNaN(number) || number < 0) {
    throw new ActionError('Valor de consulta inválido.');
  }
  return number;
}

function parseIntSafe(value: string | undefined, fallback: number): number {
  const raw = (value ?? '').trim();
  if (!raw) return fallback;
  const number = Number.parseInt(raw, 10);
  if (Number.isNaN(number) || number <= 0) {
    throw new ActionError('Duração padrão inválida.');
  }
  return number;
}

function parseCommission(value: string | undefined): number {
  const raw = (value ?? '').trim();
  if (!raw) return 0;
  const normalized = raw.replace(/\./g, '').replace(',', '.');
  const number = Number(normalized);
  if (Number.isNaN(number) || number < 0 || number > 100) {
    throw new ActionError('Comissão deve estar entre 0 e 100.');
  }
  return number;
}

export async function createProfessionalAction(
  _previous: ClinicFormState,
  formData: FormData,
): Promise<ClinicFormState> {
  let userId: string;
  let clinicId: string;
  try {
    const access = await requireModulePermission('profissionais', 'medicos:create');
    userId = access.user.id;
    clinicId = access.user.activeClinicId;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }

  const parsed = professionalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const data = parsed.data;

  const unitIds = formData
    .getAll('unitIds')
    .map((value) => String(value))
    .filter((value) => isUuid(value));

  let consultationPrice: number;
  let defaultDuration: number;
  let commissionPercent: number;
  try {
    consultationPrice = parseMoney(data.consultationPrice, 0);
    defaultDuration = parseIntSafe(data.defaultDurationMin, 30);
    commissionPercent = parseCommission(data.commissionPercent);
  } catch (error) {
    return { error: errorMessage(error) };
  }

  try {
    const id = await withTenant({ userId, clinicId }, async (tx) => {
      const [limits, usage] = await Promise.all([
        readPlanLimits(tx, clinicId),
        getUsage(tx),
      ]);
      const blocked = limitError('professional', limits, usage);
      if (blocked) throw new ActionError(blocked);

      const councilNumber = clean(data.councilNumber);
      const councilState = clean(data.councilState);
      if (data.council && councilNumber && councilState) {
        const duplicate = await tx.query<{ id: string }>(
          `select id from professionals
            where council = $1 and council_number = $2 and council_state = $3::char(2)
            limit 1`,
          [data.council, councilNumber, councilState],
        );
        if (duplicate.length > 0) {
          throw new ActionError(
            'Já existe um profissional com este conselho e número.',
          );
        }
      }

      const specialties = data.specialties
        ? data.specialties
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

      const rows = await tx.query<{ id: string }>(
        `insert into professionals (
           clinic_id, user_id, full_name, council, council_number, council_state,
           specialties, phone, email, consultation_price, default_duration_min,
           commission_percent, calendar_color, status, notes
         ) values (
           $1, $2::uuid, $3, $4, $5, $6::char(2),
           $7::text[], $8, $9, $10, $11,
           $12, $13, 'ativo', $14
         )
         returning id`,
        [
          clinicId,
          clean(data.userId),
          data.fullName,
          clean(data.council),
          councilNumber,
          councilState,
          specialties,
          clean(data.phone),
          clean(data.email),
          consultationPrice,
          defaultDuration,
          commissionPercent,
          clean(data.calendarColor) || '#0EA5E9',
          clean(data.notes),
        ],
      );

      const professionalId = rows[0]?.id;
      if (!professionalId) {
        throw new ActionError('Não foi possível salvar o profissional.');
      }

      for (const unitId of unitIds) {
        await tx.query(
          `insert into professional_units (professional_id, unit_id, clinic_id)
           values ($1, $2, $3)
           on conflict do nothing`,
          [professionalId, unitId, clinicId],
        );
      }

      // Cria conta de acesso ao sistema, se informada.
      const accessEmail = clean(String(formData.get('accessEmail') ?? ''));
      const accessPassword = String(formData.get('accessPassword') ?? '').trim();
      if (accessEmail && accessPassword.length >= 8 && accessPassword.length <= 25) {
        const existing = await tx.query<{ id: string }>(
          `select id from users where lower(email) = lower($1) limit 1`,
          [accessEmail],
        );
        let accessUserId: string;
        if (existing.length > 0) {
          accessUserId = existing[0].id;
        } else {
          const hash = await hashPassword(accessPassword);
          const userRows = await tx.query<{ id: string }>(
            `insert into users (email, password_hash, full_name, status, email_verified_at)
             values ($1, $2, $3, 'ativo', now())
             returning id`,
            [accessEmail.toLowerCase(), hash, data.fullName],
          );
          accessUserId = userRows[0]?.id;
          if (!accessUserId) throw new ActionError('Não foi possível criar o usuário.');
        }

        await tx.query(
          `insert into clinic_memberships (clinic_id, user_id, role, status, job_title, hired_at)
           values ($1, $2::uuid, 'doctor', 'ativo', $3, current_date)
           on conflict (clinic_id, user_id) do update
             set role = 'doctor', status = 'ativo', updated_at = now()`,
          [clinicId, accessUserId, data.fullName],
        );

        const membershipRows = await tx.query<{ id: string }>(
          `select id from clinic_memberships where clinic_id = $1 and user_id = $2`,
          [clinicId, accessUserId],
        );
        const membershipId = membershipRows[0]?.id;
        if (membershipId) {
          for (const unitId of unitIds.length > 0 ? unitIds : []) {
            await tx.query(
              `insert into membership_units (membership_id, unit_id, clinic_id)
               values ($1, $2::uuid, $3)
               on conflict do nothing`,
              [membershipId, unitId, clinicId],
            );
          }
        }

        await tx.query(
          `update professionals set user_id = $2::uuid, updated_at = now() where id = $1`,
          [professionalId, accessUserId],
        );
      }

      return professionalId;
    });

    revalidatePath('/app/profissionais');
    revalidatePath(`/app/profissionais/${id}`);
    return { success: 'Profissional cadastrado com sucesso.', id };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }
}

export async function updateProfessionalAction(
  _previous: ClinicFormState,
  formData: FormData,
): Promise<ClinicFormState> {
  let userId: string;
  let clinicId: string;
  try {
    const access = await requireModulePermission('profissionais', 'medicos:edit');
    userId = access.user.id;
    clinicId = access.user.activeClinicId;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }

  const professionalId = String(formData.get('professionalId') ?? '');
  if (!isUuid(professionalId)) return { error: 'Profissional inválido.' };

  const parsed = professionalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const data = parsed.data;

  const unitIds = formData
    .getAll('unitIds')
    .map((value) => String(value))
    .filter((value) => isUuid(value));

  let consultationPrice: number;
  let defaultDuration: number;
  let commissionPercent: number;
  try {
    consultationPrice = parseMoney(data.consultationPrice, 0);
    defaultDuration = parseIntSafe(data.defaultDurationMin, 30);
    commissionPercent = parseCommission(data.commissionPercent);
  } catch (error) {
    return { error: errorMessage(error) };
  }

  try {
    await withTenant({ userId, clinicId }, async (tx) => {
      const current = await tx.query<{ id: string }>(
        `select id from professionals where id = $1`,
        [professionalId],
      );
      if (current.length === 0) {
        throw new ActionError('Profissional não encontrado.');
      }

      const specialties = data.specialties
        ? data.specialties
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

      await tx.query(
        `update professionals set
           full_name = $2,
           council = $3,
           council_number = $4,
           council_state = $5::char(2),
           specialties = $6::text[],
           phone = $7,
           email = $8,
           consultation_price = $9,
           default_duration_min = $10,
           commission_percent = $11,
           calendar_color = $12,
           user_id = $13::uuid,
           notes = $14,
           updated_at = now()
         where id = $1`,
        [
          professionalId,
          data.fullName,
          clean(data.council),
          clean(data.councilNumber),
          clean(data.councilState),
          specialties,
          clean(data.phone),
          clean(data.email),
          consultationPrice,
          defaultDuration,
          commissionPercent,
          clean(data.calendarColor) || '#0EA5E9',
          clean(data.userId),
          clean(data.notes),
        ],
      );

      await tx.query(
        `delete from professional_units where professional_id = $1`,
        [professionalId],
      );
      for (const unitId of unitIds) {
        await tx.query(
          `insert into professional_units (professional_id, unit_id, clinic_id)
           values ($1, $2, $3)
           on conflict do nothing`,
          [professionalId, unitId, clinicId],
        );
      }
    });

    revalidatePath('/app/profissionais');
    revalidatePath(`/app/profissionais/${professionalId}`);
    return { success: 'Profissional atualizado.', id: professionalId };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }
}

export async function setProfessionalStatusAction(formData: FormData) {
  const professionalId = String(formData.get('professionalId') ?? '');
  const status = String(formData.get('status') ?? '');
  const back = `/app/profissionais/${professionalId}`;
  const access = await guardAction(
    'profissionais',
    'medicos:edit',
    '/app/profissionais',
  );

  if (!isUuid(professionalId) || !['ativo', 'inativo'].includes(status)) {
    redirect(`/app/profissionais?erro=${encodeURIComponent('Situação inválida.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      (tx) =>
        tx.query(
          `update professionals set status = $2, updated_at = now() where id = $1`,
          [professionalId, status],
        ),
    );
    revalidatePath('/app/profissionais');
    revalidatePath(back);
    redirect(`${back}?msg=${encodeURIComponent('Situação atualizada.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`${back}?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}

export async function deleteProfessionalAction(formData: FormData) {
  const professionalId = String(formData.get('professionalId') ?? '');
  const access = await guardAction(
    'profissionais',
    'medicos:delete',
    '/app/profissionais',
  );

  if (!isUuid(professionalId)) {
    redirect(`/app/profissionais?erro=${encodeURIComponent('Profissional inválido.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      async (tx) => {
        const appointments = await tx.query<{ total: number }>(
          `select count(*)::int as total from appointments where professional_id = $1`,
          [professionalId],
        );
        if ((appointments[0]?.total ?? 0) > 0) {
          throw new ActionError(
            'Profissional possui consultas na agenda. Inative o cadastro em vez de excluí-lo.',
          );
        }
        await tx.query(`delete from professionals where id = $1`, [professionalId]);
      },
    );
    revalidatePath('/app/profissionais');
    redirect(`/app/profissionais?msg=${encodeURIComponent('Profissional excluído.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(
      `/app/profissionais?erro=${encodeURIComponent(errorMessage(error))}`,
    );
  }
}
