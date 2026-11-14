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

const transactionSchema = z.object({
  type: z.enum(['receita', 'despesa']),
  description: z.string().trim().min(2, 'Descrição obrigatória.'),
  amount: z.string().trim().min(1, 'Valor obrigatório.'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de vencimento inválida.'),
  categoryId: UUID_OPT,
  paymentMethod: z
    .enum([
      'particular',
      'pix',
      'dinheiro',
      'cartao_credito',
      'cartao_debito',
      'boleto',
      'convenio',
      'transferencia',
      'outro',
    ])
    .optional(),
  patientId: UUID_OPT,
  professionalId: UUID_OPT,
  unitId: UUID_OPT,
  notes: z.string().trim().optional(),
});

function clean(value: string | undefined | null): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed ? trimmed : null;
}

function parseMoney(value: string): number {
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const number = Number(normalized);
  if (Number.isNaN(number) || number <= 0) {
    throw new ActionError('Valor inválido.');
  }
  return number;
}

export async function createTransactionAction(formData: FormData) {
  const access = await (async () => {
    try {
      return await requireModulePermission('financeiro', 'financeiro:create');
    } catch (error) {
      if (isRedirectError(error)) throw error;
      redirect(`/app/financeiro?erro=${encodeURIComponent(errorMessage(error))}`);
    }
  })();

  const parsed = transactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/app/financeiro?erro=${encodeURIComponent(parsed.error.issues[0]?.message ?? 'Dados inválidos.')}`);
  }
  const data = parsed.data;

  let amount: number;
  try {
    amount = parseMoney(data.amount);
  } catch (error) {
    redirect(`/app/financeiro?erro=${encodeURIComponent(errorMessage(error))}`);
  }

  try {
    await withTenant({ userId: access.user.id, clinicId: access.user.activeClinicId }, async (tx) => {
      await tx.query(
        `insert into financial_transactions
           (clinic_id, unit_id, category_id, type, description, amount, due_date,
            status, payment_method, patient_id, professional_id, notes, created_by)
         values
           ($1, $2::uuid, $3::uuid, $4::transaction_type, $5, $6, $7::date,
            'pendente', $8::payment_method, $9::uuid, $10::uuid, $11, $12::uuid)`,
        [
          access.user.activeClinicId,
          clean(data.unitId) || null,
          clean(data.categoryId) || null,
          data.type,
          data.description,
          amount,
          data.dueDate,
          data.paymentMethod || null,
          clean(data.patientId) || null,
          clean(data.professionalId) || null,
          clean(data.notes),
          access.user.id,
        ],
      );
    });
    revalidatePath('/app/financeiro');
    redirect(`/app/financeiro?msg=${encodeURIComponent('Lançamento criado.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`/app/financeiro?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}

export async function settleTransactionAction(formData: FormData) {
  const transactionId = String(formData.get('transactionId') ?? '');
  const paidAt = String(formData.get('paidAt') ?? '').trim();
  const back = '/app/financeiro';
  const access = await guardAction('financeiro', 'financeiro:edit', back);

  if (!isUuid(transactionId)) {
    redirect(`${back}?erro=${encodeURIComponent('Lançamento inválido.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      (tx) =>
        tx.query(
          `update financial_transactions
              set status = 'pago',
                  paid_at = coalesce($2::date, current_date),
                  updated_at = now()
            where id = $1`,
          [transactionId, paidAt || null],
        ),
    );
    revalidatePath('/app/financeiro');
    redirect(`${back}?msg=${encodeURIComponent('Lançamento baixado.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`${back}?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}

export async function deleteTransactionAction(formData: FormData) {
  const transactionId = String(formData.get('transactionId') ?? '');
  const access = await guardAction('financeiro', 'financeiro:delete', '/app/financeiro');

  if (!isUuid(transactionId)) {
    redirect(`/app/financeiro?erro=${encodeURIComponent('Lançamento inválido.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      (tx) => tx.query(`delete from financial_transactions where id = $1`, [transactionId]),
    );
    revalidatePath('/app/financeiro');
    redirect(`/app/financeiro?msg=${encodeURIComponent('Lançamento excluído.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`/app/financeiro?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}
