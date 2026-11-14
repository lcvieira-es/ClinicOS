'use server';

import { revalidatePath } from 'next/cache';
import { requireModulePermission } from '@/lib/clinic/module-guard';
import { withTenant } from '@/lib/db';
import type { ClinicFormState } from '@/lib/clinic/form-state';
import { errorMessage, isRedirectError } from '@/lib/clinic/validation';

const BLOCKED_KEYWORDS = [
  'diagnóstico',
  'diagnostico',
  'prescrever',
  'prescrição',
  'prescricao',
  'medicamento',
  'dose',
  'posologia',
  'tratamento para',
  'qual doença',
  'qual doenca',
];

export async function askAiAction(
  _previous: ClinicFormState & { response?: string; status?: string },
  formData: FormData,
): Promise<ClinicFormState & { response?: string; status?: string }> {
  let userId: string;
  let clinicId: string;
  try {
    const access = await requireModulePermission('ia', 'ia:use');
    userId = access.user.id;
    clinicId = access.user.activeClinicId;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }

  const prompt = String(formData.get('prompt') ?? '').trim();
  if (prompt.length < 3) {
    return { error: 'Descreva sua solicitação com mais detalhes.' };
  }

  const lower = prompt.toLowerCase();
  const blocked = BLOCKED_KEYWORDS.some((keyword) => lower.includes(keyword));

  let status = 'concluida';
  let response: string;

  if (blocked) {
    status = 'bloqueada';
    response =
      'Não posso fornecer diagnósticos, prescrições ou orientações de tratamento. ' +
      'A decisão clínica é exclusiva do profissional de saúde. Posso ajudar com ' +
      'organização de documentos, resumos para revisão humana ou busca de informações.';
  } else {
    response =
      'Apoio à documentação: organize a anamnese, liste os achados e registre a conduta ' +
      'para revisão do profissional. Toda informação clínica deve ser validada por um ' +
      'médico antes de ser finalizada.';
  }

  try {
    await withTenant({ userId, clinicId }, async (tx) => {
      await tx.query(
        `insert into ai_interactions (clinic_id, user_id, feature, prompt, response, status)
         values ($1, $2::uuid, 'apoio_documentacao', $3, $4, $5::ai_status)`,
        [clinicId, userId, prompt, response, status],
      );
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }

  revalidatePath('/app/ia');
  return { success: 'Resposta gerada.', response, status };
}
