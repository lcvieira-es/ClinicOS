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

const claimSchema = z.object({
  patientId: z.string().trim().regex(UUID_RE, 'Paciente inválido.'),
  providerId: z.string().trim().regex(UUID_RE, 'Operadora inválida.'),
  guideNumber: z.string().trim().min(1, 'Número da guia obrigatório.'),
  tussCode: z.string().trim().optional(),
  procedureName: z.string().trim().optional(),
  presentedAmount: z.string().trim().min(1, 'Valor apresentado obrigatório.'),
  notes: z.string().trim().optional(),
});

function clean(value: string | undefined | null): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed ? trimmed : null;
}

function parseMoney(value: string): number {
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const number = Number(normalized);
  if (Number.isNaN(number) || number < 0) throw new ActionError('Valor inválido.');
  return number;
}

export async function createClaimAction(formData: FormData) {
  const access = await (async () => {
    try {
      return await requireModulePermission('convenios', 'convenios:create');
    } catch (error) {
      if (isRedirectError(error)) throw error;
      redirect(`/app/convenios?erro=${encodeURIComponent(errorMessage(error))}`);
    }
  })();

  const parsed = claimSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/app/convenios?erro=${encodeURIComponent(parsed.error.issues[0]?.message ?? 'Dados inválidos.')}`);
  }
  const data = parsed.data;

  let presentedAmount: number;
  try {
    presentedAmount = parseMoney(data.presentedAmount);
  } catch (error) {
    redirect(`/app/convenios?erro=${encodeURIComponent(errorMessage(error))}`);
  }

  try {
    await withTenant({ userId: access.user.id, clinicId: access.user.activeClinicId }, async (tx) => {
      await tx.query(
        `insert into insurance_claims
           (clinic_id, patient_id, provider_id, guide_number, tuss_code, procedure_name, presented_amount, status, notes, created_by)
         values
           ($1, $2::uuid, $3::uuid, $4, $5, $6, $7, 'rascunho', $8, $9::uuid)`,
        [
          access.user.activeClinicId,
          data.patientId,
          data.providerId,
          data.guideNumber,
          clean(data.tussCode),
          clean(data.procedureName),
          presentedAmount,
          clean(data.notes),
          access.user.id,
        ],
      );
    });
    revalidatePath('/app/convenios');
    redirect(`/app/convenios?msg=${encodeURIComponent('Guia criada.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`/app/convenios?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}

export async function setClaimStatusAction(formData: FormData) {
  const claimId = String(formData.get('claimId') ?? '');
  const status = String(formData.get('status') ?? '');
  const approvedAmount = String(formData.get('approvedAmount') ?? '').trim();
  const back = '/app/convenios';
  const access = await guardAction('convenios', 'convenios:edit', back);

  if (!isUuid(claimId)) {
    redirect(`${back}?erro=${encodeURIComponent('Guia inválida.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      async (tx) => {
        const updates = ['status = $2::claim_status', 'updated_at = now()'];
        const params: unknown[] = [claimId, status];

        if (status === 'enviada') {
          updates.push('sent_at = coalesce(sent_at, current_date)');
        }
        if (status === 'aprovada' || status === 'glosada') {
          updates.push('approved_at = coalesce(approved_at, current_date)');
          if (approvedAmount) {
            const normalized = approvedAmount.replace(/\./g, '').replace(',', '.');
            params.push(Number(normalized));
            updates.push(`approved_amount = $${params.length}`);
          }
        }
        if (status === 'paga') {
          updates.push('paid_at = coalesce(paid_at, current_date)');
        }

        await tx.query(
          `update insurance_claims set ${updates.join(', ')} where id = $1`,
          params,
        );
      },
    );
    revalidatePath('/app/convenios');
    redirect(`${back}?msg=${encodeURIComponent('Status da guia atualizado.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`${back}?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}

export async function createInsuranceContractAction(formData: FormData) {
  const access = await (async () => {
    try {
      return await requireModulePermission('convenios', 'convenios:create');
    } catch (error) {
      if (isRedirectError(error)) throw error;
      redirect('/app/convenios?erro=' + encodeURIComponent(errorMessage(error)));
    }
  })();

  const providerId = String(formData.get('providerId') ?? '').trim();
  const paymentTermDays = String(formData.get('paymentTermDays') ?? '30').trim();
  const defaultTable = String(formData.get('defaultTable') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(providerId)) {
    redirect('/app/convenios?erro=' + encodeURIComponent('Operadora invalida.'));
  }

  try {
    await withTenant({ userId: access.user.id, clinicId: access.user.activeClinicId }, async (tx) => {
      await tx.query(
        "insert into clinic_insurance_contracts (clinic_id, provider_id, status, payment_term_days, default_table, notes) values ($1, $2::uuid, 'ativo', $3, $4, $5)",
        [
          access.user.activeClinicId,
          providerId,
          Number(paymentTermDays) || 30,
          defaultTable || null,
          notes || null,
        ],
      );
    });
    revalidatePath('/app/convenios');
    redirect('/app/convenios?msg=' + encodeURIComponent('Convenio cadastrado.'));
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect('/app/convenios?erro=' + encodeURIComponent(errorMessage(error)));
  }
}
