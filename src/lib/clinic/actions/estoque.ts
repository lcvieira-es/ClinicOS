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

const itemSchema = z.object({
  name: z.string().trim().min(2, 'Nome do item obrigatório.'),
  category: z.string().trim().optional(),
  sku: z.string().trim().optional(),
  quantity: z.string().trim().optional(),
  minimumQuantity: z.string().trim().optional(),
  unitOfMeasure: z.string().trim().min(1, 'Unidade de medida obrigatória.'),
  unitCost: z.string().trim().optional(),
  salePrice: z.string().trim().optional(),
  supplier: z.string().trim().optional(),
  batch: z.string().trim().optional(),
  expiresAt: z.string().trim().optional(),
  location: z.string().trim().optional(),
  unitId: UUID_OPT,
});

const movementSchema = z.object({
  itemId: z.string().trim().regex(UUID_RE, 'Item inválido.'),
  type: z.enum(['entrada', 'saida', 'ajuste', 'perda']),
  quantity: z.string().trim().min(1, 'Quantidade obrigatória.'),
  unitCost: z.string().trim().optional(),
  reason: z.string().trim().optional(),
  reference: z.string().trim().optional(),
});

function clean(value: string | undefined | null): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed ? trimmed : null;
}

function parseNumber(value: string | undefined, fallback = 0): number {
  const raw = (value ?? '').trim();
  if (!raw) return fallback;
  const normalized = raw.replace(/\./g, '').replace(',', '.');
  const number = Number(normalized);
  if (Number.isNaN(number) || number < 0) throw new ActionError('Valor numérico inválido.');
  return number;
}

export async function createInventoryItemAction(formData: FormData) {
  const access = await (async () => {
    try {
      return await requireModulePermission('estoque', 'estoque:create');
    } catch (error) {
      if (isRedirectError(error)) throw error;
      redirect(`/app/estoque?erro=${encodeURIComponent(errorMessage(error))}`);
    }
  })();

  const parsed = itemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/app/estoque?erro=${encodeURIComponent(parsed.error.issues[0]?.message ?? 'Dados inválidos.')}`);
  }
  const data = parsed.data;

  let quantity: number;
  let minimumQuantity: number;
  let unitCost: number;
  let salePrice: number | null;
  try {
    quantity = parseNumber(data.quantity, 0);
    minimumQuantity = parseNumber(data.minimumQuantity, 0);
    unitCost = parseNumber(data.unitCost, 0);
    salePrice = data.salePrice ? parseNumber(data.salePrice, 0) : null;
  } catch (error) {
    redirect(`/app/estoque?erro=${encodeURIComponent(errorMessage(error))}`);
  }

  try {
    await withTenant({ userId: access.user.id, clinicId: access.user.activeClinicId }, async (tx) => {
      await tx.query(
        `insert into inventory_items
           (clinic_id, unit_id, name, category, sku, quantity, minimum_quantity,
            unit_of_measure, unit_cost, sale_price, supplier, batch, expires_at,
            location, status)
         values
           ($1, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::date, $14, 'ativo')`,
        [
          access.user.activeClinicId,
          clean(data.unitId) || null,
          data.name,
          clean(data.category),
          clean(data.sku),
          quantity,
          minimumQuantity,
          data.unitOfMeasure,
          unitCost,
          salePrice,
          clean(data.supplier),
          clean(data.batch),
          clean(data.expiresAt) || null,
          clean(data.location),
        ],
      );
    });
    revalidatePath('/app/estoque');
    redirect(`/app/estoque?msg=${encodeURIComponent('Item cadastrado.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`/app/estoque?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}

export async function addInventoryMovementAction(formData: FormData) {
  const access = await (async () => {
    try {
      return await requireModulePermission('estoque', 'estoque:edit');
    } catch (error) {
      if (isRedirectError(error)) throw error;
      redirect(`/app/estoque?erro=${encodeURIComponent(errorMessage(error))}`);
    }
  })();

  const parsed = movementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/app/estoque?erro=${encodeURIComponent(parsed.error.issues[0]?.message ?? 'Dados inválidos.')}`);
  }
  const data = parsed.data;

  let quantity: number;
  let unitCost: number | null;
  try {
    quantity = parseNumber(data.quantity, 0);
    if (quantity <= 0) throw new ActionError('Quantidade deve ser maior que zero.');
    unitCost = data.unitCost ? parseNumber(data.unitCost, 0) : null;
  } catch (error) {
    redirect(`/app/estoque?erro=${encodeURIComponent(errorMessage(error))}`);
  }

  try {
    await withTenant({ userId: access.user.id, clinicId: access.user.activeClinicId }, async (tx) => {
      const rows = await tx.query<{ quantity: string }>(
        `select quantity::text as quantity from inventory_items where id = $1`,
        [data.itemId],
      );
      if (rows.length === 0) throw new ActionError('Item não encontrado.');

      const current = Number(rows[0].quantity);
      let delta = quantity;
      if (data.type === 'saida' || data.type === 'perda') {
        if (quantity > current) {
          throw new ActionError('Quantidade insuficiente em estoque.');
        }
        delta = -quantity;
      } else if (data.type === 'ajuste') {
        delta = quantity - current;
      }

      await tx.query(
        `insert into inventory_movements
           (clinic_id, item_id, type, quantity, unit_cost, reason, reference, performed_by)
         values ($1, $2::uuid, $3::inventory_movement_type, $4, $5, $6, $7, $8::uuid)`,
        [
          access.user.activeClinicId,
          data.itemId,
          data.type,
          quantity,
          unitCost,
          clean(data.reason),
          clean(data.reference),
          access.user.id,
        ],
      );

      await tx.query(
        `update inventory_items
            set quantity = quantity + $2,
                updated_at = now()
          where id = $1`,
        [data.itemId, delta],
      );
    });
    revalidatePath('/app/estoque');
    redirect(`/app/estoque?msg=${encodeURIComponent('Movimentação registrada.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`/app/estoque?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}
