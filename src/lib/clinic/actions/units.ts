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

const unitSchema = z.object({
  name: z.string().trim().min(2, 'Nome da unidade obrigatório.'),
  type: z.enum(['matriz', 'filial', 'consultorio']),
  internalCode: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email('E-mail inválido.').or(z.literal('')).optional(),
  cep: z.string().trim().optional(),
  address: z.string().trim().optional(),
  addressNumber: z.string().trim().optional(),
  complement: z.string().trim().optional(),
  neighborhood: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z
    .string()
    .trim()
    .regex(/^[A-Z]{2}$/, 'UF deve ter 2 letras.')
    .or(z.literal(''))
    .optional(),
  managerName: z.string().trim().optional(),
  openingHours: z.string().trim().optional(),
  isHeadquarters: z.string().optional(),
});

function clean(value: string | undefined | null): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed ? trimmed : null;
}

export async function createUnitAction(
  _previous: ClinicFormState,
  formData: FormData,
): Promise<ClinicFormState> {
  let userId: string;
  let clinicId: string;
  try {
    const access = await requireModulePermission('unidades', 'unidades:create');
    userId = access.user.id;
    clinicId = access.user.activeClinicId;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }

  const parsed = unitSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const data = parsed.data;

  try {
    const id = await withTenant({ userId, clinicId }, async (tx) => {
      const [limits, usage] = await Promise.all([
        readPlanLimits(tx, clinicId),
        getUsage(tx),
      ]);
      const blocked = limitError('unit', limits, usage);
      if (blocked) throw new ActionError(blocked);

      const internalCode = clean(data.internalCode);
      if (internalCode) {
        const duplicate = await tx.query<{ id: string }>(
          `select id from clinic_units where internal_code = $1 limit 1`,
          [internalCode],
        );
        if (duplicate.length > 0) {
          throw new ActionError(
            'Já existe uma unidade com este código interno.',
          );
        }
      }

      const rows = await tx.query<{ id: string }>(
        `insert into clinic_units (
           clinic_id, name, type, internal_code, phone, email, cep, address,
           address_number, complement, neighborhood, city, state, manager_name,
           opening_hours, is_headquarters, status
         ) values (
           $1, $2, $3::unit_type, $4, $5, $6, $7, $8,
           $9, $10, $11, $12, $13::char(2), $14, $15, $16, 'ativa'
         )
         returning id`,
        [
          clinicId,
          data.name,
          data.type,
          internalCode,
          clean(data.phone),
          clean(data.email),
          clean(data.cep),
          clean(data.address),
          clean(data.addressNumber),
          clean(data.complement),
          clean(data.neighborhood),
          clean(data.city),
          clean(data.state),
          clean(data.managerName),
          clean(data.openingHours),
          data.isHeadquarters === 'on',
        ],
      );

      const unitId = rows[0]?.id;
      if (!unitId) throw new ActionError('Não foi possível salvar a unidade.');
      return unitId;
    });

    revalidatePath('/app/unidades');
    revalidatePath(`/app/unidades/${id}`);
    return { success: 'Unidade cadastrada com sucesso.', id };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }
}

export async function updateUnitAction(
  _previous: ClinicFormState,
  formData: FormData,
): Promise<ClinicFormState> {
  let userId: string;
  let clinicId: string;
  try {
    const access = await requireModulePermission('unidades', 'unidades:edit');
    userId = access.user.id;
    clinicId = access.user.activeClinicId;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }

  const unitId = String(formData.get('unitId') ?? '');
  if (!isUuid(unitId)) return { error: 'Unidade inválida.' };

  const parsed = unitSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const data = parsed.data;

  try {
    await withTenant({ userId, clinicId }, async (tx) => {
      const current = await tx.query<{ id: string }>(
        `select id from clinic_units where id = $1`,
        [unitId],
      );
      if (current.length === 0) {
        throw new ActionError('Unidade não encontrada.');
      }

      await tx.query(
        `update clinic_units set
           name = $2,
           type = $3::unit_type,
           internal_code = $4,
           phone = $5,
           email = $6,
           cep = $7,
           address = $8,
           address_number = $9,
           complement = $10,
           neighborhood = $11,
           city = $12,
           state = $13::char(2),
           manager_name = $14,
           opening_hours = $15,
           is_headquarters = $16,
           updated_at = now()
         where id = $1`,
        [
          unitId,
          data.name,
          data.type,
          clean(data.internalCode),
          clean(data.phone),
          clean(data.email),
          clean(data.cep),
          clean(data.address),
          clean(data.addressNumber),
          clean(data.complement),
          clean(data.neighborhood),
          clean(data.city),
          clean(data.state),
          clean(data.managerName),
          clean(data.openingHours),
          data.isHeadquarters === 'on',
        ],
      );
    });

    revalidatePath('/app/unidades');
    revalidatePath(`/app/unidades/${unitId}`);
    return { success: 'Unidade atualizada.', id: unitId };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }
}

export async function setUnitStatusAction(formData: FormData) {
  const unitId = String(formData.get('unitId') ?? '');
  const status = String(formData.get('status') ?? '');
  const back = `/app/unidades/${unitId}`;
  const access = await guardAction('unidades', 'unidades:edit', '/app/unidades');

  if (!isUuid(unitId) || !['ativa', 'inativa'].includes(status)) {
    redirect(`/app/unidades?erro=${encodeURIComponent('Situação inválida.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      (tx) =>
        tx.query(
          `update clinic_units set status = $2, updated_at = now() where id = $1`,
          [unitId, status],
        ),
    );
    revalidatePath('/app/unidades');
    revalidatePath(back);
    redirect(`${back}?msg=${encodeURIComponent('Situação da unidade atualizada.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`${back}?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}

export async function deleteUnitAction(formData: FormData) {
  const unitId = String(formData.get('unitId') ?? '');
  const access = await guardAction('unidades', 'unidades:delete', '/app/unidades');

  if (!isUuid(unitId)) {
    redirect(`/app/unidades?erro=${encodeURIComponent('Unidade inválida.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      async (tx) => {
        const usage = await tx.query<{ total: number }>(
          `select (select count(*)::int from professionals p
                   join professional_units pu on pu.professional_id = p.id
                   where pu.unit_id = $1) +
                 (select count(*)::int from appointments where unit_id = $1) as total`,
          [unitId],
        );
        if ((usage[0]?.total ?? 0) > 0) {
          throw new ActionError(
            'Unidade possui profissionais ou consultas vinculadas.',
          );
        }
        await tx.query(`delete from clinic_units where id = $1`, [unitId]);
      },
    );
    revalidatePath('/app/unidades');
    redirect(
      `/app/unidades?msg=${encodeURIComponent('Unidade excluída.')}`,
    );
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(
      `/app/unidades?erro=${encodeURIComponent(errorMessage(error))}`,
    );
  }
}
