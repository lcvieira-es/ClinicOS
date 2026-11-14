'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { guardAction, requireModulePermission } from '@/lib/clinic/module-guard';
import { withTenant } from '@/lib/db';
import {
  ActionError,
  errorMessage,
  isRedirectError,
} from '@/lib/clinic/validation';

const settingsSchema = z.object({
  displayName: z.string().trim().min(2, 'Nome de exibição obrigatório.'),
  tradeName: z.string().trim().optional(),
  email: z.string().trim().email('E-mail inválido.').or(z.literal('')).optional(),
  phone: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
  cep: z.string().trim().optional(),
  address: z.string().trim().optional(),
  addressNumber: z.string().trim().optional(),
  complement: z.string().trim().optional(),
  neighborhood: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z
    .string()
    .trim()
    .regex(/^[A-Z]{2}$/, 'UF inválida.')
    .or(z.literal(''))
    .optional(),
  notes: z.string().trim().optional(),
});

function clean(value: string | undefined | null): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed ? trimmed : null;
}

export async function updateClinicSettingsAction(formData: FormData) {
  const access = await (async () => {
    try {
      return await requireModulePermission('configuracoes', 'configuracoes:edit');
    } catch (error) {
      if (isRedirectError(error)) throw error;
      redirect(`/app/configuracoes?erro=${encodeURIComponent(errorMessage(error))}`);
    }
  })();

  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/app/configuracoes?erro=${encodeURIComponent(parsed.error.issues[0]?.message ?? 'Dados inválidos.')}`);
  }
  const data = parsed.data;

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      (tx) =>
        tx.query(
          `update clinics set
             display_name = $2,
             trade_name = $3,
             email = $4,
             phone = $5,
             whatsapp = $6,
             cep = $7,
             address = $8,
             address_number = $9,
             complement = $10,
             neighborhood = $11,
             city = $12,
             state = $13::char(2),
             notes = $14,
             updated_at = now()
           where id = $1`,
          [
            access.user.activeClinicId,
            data.displayName,
            clean(data.tradeName),
            clean(data.email),
            clean(data.phone),
            clean(data.whatsapp),
            clean(data.cep),
            clean(data.address),
            clean(data.addressNumber),
            clean(data.complement),
            clean(data.neighborhood),
            clean(data.city),
            clean(data.state),
            clean(data.notes),
          ],
        ),
    );
    revalidatePath('/app/configuracoes');
    redirect(`/app/configuracoes?msg=${encodeURIComponent('Configurações salvas.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`/app/configuracoes?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}
