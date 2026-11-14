'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  guardAction,
  requireModulePermission,
} from '@/lib/clinic/module-guard';
import { withTenant, type Queryable } from '@/lib/db';
import { getUsage, limitError, readPlanLimits } from '@/lib/clinic/limits';
import type { ClinicFormState } from '@/lib/clinic/form-state';
import {
  ActionError,
  errorMessage,
  isRedirectError,
  isUuid,
  normalizeCpf,
} from '@/lib/clinic/validation';

const UUID_OPTIONAL = z
  .string()
  .trim()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    'Identificador inválido.',
  )
  .or(z.literal(''))
  .optional();

const patientSchema = z.object({
  fullName: z.string().trim().min(3, 'Informe o nome completo do paciente.'),
  socialName: z.string().trim().optional(),
  cpf: z.string().trim().optional(),
  birthDate: z.string().trim().optional(),
  sex: z.enum(['feminino', 'masculino', 'intersexo', 'nao_informado']),
  gender: z.string().trim().optional(),
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
    .regex(/^[A-Z]{2}$/, 'UF deve ter 2 letras.')
    .or(z.literal(''))
    .optional(),
  insuranceProviderId: UUID_OPTIONAL,
  insuranceMemberNumber: z.string().trim().optional(),
  emergencyContactName: z.string().trim().optional(),
  emergencyContactPhone: z.string().trim().optional(),
  preferredUnitId: UUID_OPTIONAL,
  notes: z.string().trim().optional(),
  lgpdConsent: z.string().optional(),
});

type PatientInput = z.infer<typeof patientSchema>;

function clean(value: string | undefined | null): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed ? trimmed : null;
}

function birthDateValue(value: string | undefined): string | null {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new ActionError('Data de nascimento inválida.');
  }
  const today = new Date();
  const iso =
    `${today.getFullYear()}-` +
    `${String(today.getMonth() + 1).padStart(2, '0')}-` +
    `${String(today.getDate()).padStart(2, '0')}`;
  if (trimmed > iso) {
    throw new ActionError('Data de nascimento não pode ser no futuro.');
  }
  return trimmed;
}

async function recordConsent(
  tx: Parameters<Parameters<typeof withTenant>[1]>[0],
  clinicId: string,
  patientId: string,
  userId: string,
  granted: boolean,
): Promise<void> {
  await tx.query(
    `insert into patient_consents
       (clinic_id, patient_id, type, granted, granted_at, revoked_at,
        evidence, document_version, created_by)
     values ($1, $2, 'tratamento_dados', $3,
             case when $3 then now() else null end,
             case when $3 then null else now() end,
             $4::jsonb, 'v1', $5)`,
    [
      clinicId,
      patientId,
      granted,
      JSON.stringify({
        origem: 'formulario_clinico',
        registrado_em: new Date().toISOString(),
        responsavel: userId,
      }),
      userId,
    ],
  );
}

export async function createPatientAction(
  _previous: ClinicFormState,
  formData: FormData,
): Promise<ClinicFormState> {
  let userId: string;
  let clinicId: string;
  try {
    const access = await requireModulePermission('pacientes', 'pacientes:create');
    userId = access.user.id;
    clinicId = access.user.activeClinicId;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }

  const parsed = patientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  const data: PatientInput = parsed.data;
  const { cpf, invalid } = normalizeCpf(data.cpf);
  if (invalid) return { error: 'CPF deve conter exatamente 11 dígitos.' };

  let birthDate: string | null;
  try {
    birthDate = birthDateValue(data.birthDate);
  } catch (error) {
    return { error: errorMessage(error) };
  }

  try {
    const id = await withTenant({ userId, clinicId }, async (tx) => {
      const [limits, usage] = await Promise.all([
        readPlanLimits(tx, clinicId),
        getUsage(tx),
      ]);
      const blocked = limitError('patient', limits, usage);
      if (blocked) throw new ActionError(blocked);

      if (cpf) {
        const duplicate = await tx.query<{ id: string }>(
          `select id from patients where cpf = $1 limit 1`,
          [cpf],
        );
        if (duplicate.length > 0) {
          throw new ActionError(
            'Já existe um paciente com este CPF nesta clínica.',
          );
        }
      }

      const rows = await tx.query<{ id: string }>(
        `insert into patients (
           clinic_id, full_name, social_name, cpf, birth_date, sex, gender,
           email, phone, whatsapp, cep, address, address_number, complement,
           neighborhood, city, state, insurance_provider_id,
           insurance_member_number, emergency_contact_name,
           emergency_contact_phone, preferred_unit_id, notes, status,
           lgpd_consent_at, lgpd_consent_by, created_by
         ) values (
           $1, $2, $3, $4, $5::date, $6::sex_type, $7,
           $8, $9, $10, $11, $12, $13, $14,
           $15, $16, $17::char(2), $18::uuid,
           $19, $20,
           $21, $22::uuid, $23, 'ativo',
           $24::timestamptz, $25::uuid, $25::uuid
         )
         returning id`,
        [
          clinicId,
          data.fullName,
          clean(data.socialName),
          cpf,
          birthDate,
          data.sex,
          clean(data.gender),
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
          clean(data.insuranceProviderId) || null,
          clean(data.insuranceMemberNumber),
          clean(data.emergencyContactName),
          clean(data.emergencyContactPhone),
          clean(data.preferredUnitId) || null,
          clean(data.notes),
          data.lgpdConsent ? new Date().toISOString() : null,
          data.lgpdConsent ? userId : null,
        ],
      );

      const patientId = rows[0]?.id;
      if (!patientId) throw new ActionError('Não foi possível salvar o paciente.');

      if (data.lgpdConsent) {
        await recordConsent(tx, clinicId, patientId, userId, true);
      }

      return patientId;
    });

    revalidatePath('/app/pacientes');
    revalidatePath(`/app/pacientes/${id}`);
    return { success: 'Paciente cadastrado com sucesso.', id };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }
}

export async function updatePatientAction(
  _previous: ClinicFormState,
  formData: FormData,
): Promise<ClinicFormState> {
  let userId: string;
  let clinicId: string;
  let canSeeSensitive: boolean;
  try {
    const access = await requireModulePermission('pacientes', 'pacientes:edit');
    userId = access.user.id;
    clinicId = access.user.activeClinicId;
    canSeeSensitive = access.permissions.has('pacientes:view_sensitive');
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }

  const patientId = String(formData.get('patientId') ?? '');
  if (!isUuid(patientId)) return { error: 'Paciente inválido.' };

  const parsed = patientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  const data: PatientInput = parsed.data;
  const { cpf, invalid } = normalizeCpf(data.cpf);
  if (invalid) return { error: 'CPF deve conter exatamente 11 dígitos.' };

  let birthDate: string | null;
  try {
    birthDate = birthDateValue(data.birthDate);
  } catch (error) {
    return { error: errorMessage(error) };
  }

  try {
    await withTenant({ userId, clinicId }, async (tx) => {
      const current = await tx.query<{ id: string }>(
        `select id from patients where id = $1`,
        [patientId],
      );
      if (current.length === 0) {
        throw new ActionError('Paciente não encontrado.');
      }

      // Só quem enxerga dado sensível pode alterar o CPF.
      const nextCpf = canSeeSensitive ? cpf : undefined;
      if (nextCpf) {
        const duplicate = await tx.query<{ id: string }>(
          `select id from patients where cpf = $1 and id <> $2 limit 1`,
          [nextCpf, patientId],
        );
        if (duplicate.length > 0) {
          throw new ActionError(
            'Já existe um paciente com este CPF nesta clínica.',
          );
        }
      }

      const params: unknown[] = [patientId];
      const push = (value: unknown, cast = '') => {
        params.push(value);
        return `$${params.length}${cast}`;
      };

      const assignments = [
        `full_name = ${push(data.fullName)}`,
        `social_name = ${push(clean(data.socialName))}`,
      ];

      if (nextCpf !== undefined) {
        assignments.push(`cpf = ${push(nextCpf)}`);
      }

      assignments.push(
        `birth_date = ${push(birthDate, '::date')}`,
        `sex = ${push(data.sex, '::sex_type')}`,
        `gender = ${push(clean(data.gender))}`,
        `email = ${push(clean(data.email))}`,
        `phone = ${push(clean(data.phone))}`,
        `whatsapp = ${push(clean(data.whatsapp))}`,
        `cep = ${push(clean(data.cep))}`,
        `address = ${push(clean(data.address))}`,
        `address_number = ${push(clean(data.addressNumber))}`,
        `complement = ${push(clean(data.complement))}`,
        `neighborhood = ${push(clean(data.neighborhood))}`,
        `city = ${push(clean(data.city))}`,
        `state = ${push(clean(data.state), '::char(2)')}`,
        `insurance_provider_id = ${push(
          clean(data.insuranceProviderId) || null,
          '::uuid',
        )}`,
        `insurance_member_number = ${push(clean(data.insuranceMemberNumber))}`,
        `emergency_contact_name = ${push(clean(data.emergencyContactName))}`,
        `emergency_contact_phone = ${push(clean(data.emergencyContactPhone))}`,
        `preferred_unit_id = ${push(
          clean(data.preferredUnitId) || null,
          '::uuid',
        )}`,
        `notes = ${push(clean(data.notes))}`,
        'updated_at = now()',
      );

      await tx.query(
        `update patients set ${assignments.join(', ')} where id = $1`,
        params,
      );
    });

    revalidatePath('/app/pacientes');
    revalidatePath(`/app/pacientes/${patientId}`);
    return { success: 'Cadastro atualizado com sucesso.', id: patientId };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }
}

/** Altera a situação do cadastro (ativo / inativo / arquivado). */
export async function setPatientStatusAction(formData: FormData) {
  const patientId = String(formData.get('patientId') ?? '');
  const status = String(formData.get('status') ?? '');
  const back = `/app/pacientes/${patientId}`;

  const access = await guardAction('pacientes', 'pacientes:edit', '/app/pacientes');
  if (!isUuid(patientId) || !['ativo', 'inativo', 'arquivado'].includes(status)) {
    redirect(`${back}?erro=${encodeURIComponent('Situação inválida.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      (tx) =>
        tx.query(`update patients set status = $2::patient_status where id = $1`, [
          patientId,
          status,
        ]),
    );
    revalidatePath('/app/pacientes');
    revalidatePath(back);
    redirect(
      `${back}?msg=${encodeURIComponent('Situação do paciente atualizada.')}`,
    );
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`${back}?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}

/**
 * Exclusão definitiva: apenas quando não há consultas vinculadas (a agenda é
 * preservada). O caminho recomendado é arquivar o cadastro.
 */
export async function deletePatientAction(formData: FormData) {
  const patientId = String(formData.get('patientId') ?? '');
  const access = await guardAction(
    'pacientes',
    'pacientes:delete',
    '/app/pacientes',
  );

  if (!isUuid(patientId)) {
    redirect(`/app/pacientes?erro=${encodeURIComponent('Paciente inválido.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      async (tx) => {
        const appointments = await tx.query<{ total: number }>(
          `select count(*)::int as total from appointments where patient_id = $1`,
          [patientId],
        );
        if ((appointments[0]?.total ?? 0) > 0) {
          throw new ActionError(
            'Paciente possui consultas na agenda. Arquive o cadastro em vez de excluí-lo.',
          );
        }
        await tx.query(`delete from patients where id = $1`, [patientId]);
      },
    );

    revalidatePath('/app/pacientes');
    redirect(`/app/pacientes?msg=${encodeURIComponent('Paciente excluído.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(
      `/app/pacientes?erro=${encodeURIComponent(
        errorMessage(error) ||
          'Não foi possível excluir o paciente.',
      )}`,
    );
  }
}

export async function grantPatientConsentAction(formData: FormData) {
  const patientId = String(formData.get('patientId') ?? '');
  const back = `/app/pacientes/${patientId}`;
  const access = await guardAction('pacientes', 'pacientes:edit', '/app/pacientes');

  if (!isUuid(patientId)) {
    redirect(`/app/pacientes?erro=${encodeURIComponent('Paciente inválido.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      async (tx) => {
        await tx.query(
          `update patients
              set lgpd_consent_at = now(), lgpd_consent_by = $2, updated_at = now()
            where id = $1`,
          [patientId, access.user.id],
        );
        await recordConsent(
          tx,
          access.user.activeClinicId,
          patientId,
          access.user.id,
          true,
        );
      },
    );

    revalidatePath(back);
    redirect(`${back}?msg=${encodeURIComponent('Consentimento LGPD registrado.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`${back}?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}

export async function revokePatientConsentAction(formData: FormData) {
  const patientId = String(formData.get('patientId') ?? '');
  const back = `/app/pacientes/${patientId}`;
  const access = await guardAction('pacientes', 'pacientes:edit', '/app/pacientes');

  if (!isUuid(patientId)) {
    redirect(`/app/pacientes?erro=${encodeURIComponent('Paciente inválido.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      async (tx) => {
        await tx.query(
          `update patients
              set lgpd_consent_at = null, lgpd_consent_by = null, updated_at = now()
            where id = $1`,
          [patientId],
        );
        await recordConsent(
          tx,
          access.user.activeClinicId,
          patientId,
          access.user.id,
          false,
        );
      },
    );

    revalidatePath(back);
    redirect(`${back}?msg=${encodeURIComponent('Consentimento LGPD revogado.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`${back}?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}
