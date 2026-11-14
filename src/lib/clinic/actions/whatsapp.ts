'use server';

import { revalidatePath } from 'next/cache';
import { requireModulePermission } from '@/lib/clinic/module-guard';
import { withTenant } from '@/lib/db';
import type { ClinicFormState } from '@/lib/clinic/form-state';
import {
  ActionError,
  errorMessage,
  isRedirectError,
  isUuid,
} from '@/lib/clinic/validation';

const UUID_OPT = (value: string) =>
  value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;

export async function sendWhatsappAction(
  _previous: ClinicFormState & { waLink?: string },
  formData: FormData,
): Promise<ClinicFormState & { waLink?: string }> {
  let userId: string;
  let clinicId: string;
  try {
    const access = await requireModulePermission('whatsapp', 'whatsapp:send');
    userId = access.user.id;
    clinicId = access.user.activeClinicId;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }

  const patientId = String(formData.get('patientId') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();
  const template = String(formData.get('template') ?? '').trim();

  if (!content) {
    return { error: 'Informe o conteúdo da mensagem.' };
  }

  const resolvedPhone = phone || null;

  try {
    await withTenant({ userId, clinicId }, async (tx) => {
      await tx.query(
        `insert into whatsapp_messages
           (clinic_id, patient_id, direction, template, content, status, created_by)
         values ($1, $2::uuid, 'enviada', $3, $4, 'pendente', $5::uuid)`,
        [clinicId, UUID_OPT(patientId), template || null, content, userId],
      );
    });

    revalidatePath('/app/whatsapp');

    const digits = (resolvedPhone ?? '').replace(/\D/g, '');
    const waLink = digits
      ? `https://wa.me/55${digits}?text=${encodeURIComponent(content)}`
      : undefined;

    return {
      success: 'Mensagem registrada. Abra o link para enviar pelo WhatsApp.',
      waLink,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }
}
