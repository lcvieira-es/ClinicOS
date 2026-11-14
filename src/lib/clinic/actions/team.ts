'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { randomBytes, createHash } from 'node:crypto';
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

const inviteSchema = z.object({
  email: z.string().trim().email('E-mail inválido.'),
  fullName: z.string().trim().min(3, 'Informe o nome completo.'),
  role: z.enum(['clinic_admin', 'doctor', 'receptionist', 'finance']),
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface InviteCreatedState extends ClinicFormState {
  inviteLink?: string;
}

export async function createInviteAction(
  _previous: InviteCreatedState,
  formData: FormData,
): Promise<InviteCreatedState> {
  let userId: string;
  let clinicId: string;
  try {
    const access = await requireModulePermission('usuarios', 'usuarios:invite');
    userId = access.user.id;
    clinicId = access.user.activeClinicId;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }

  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const data = parsed.data;

  try {
    const inviteLink = await withTenant({ userId, clinicId }, async (tx) => {
      const [limits, usage] = await Promise.all([
        readPlanLimits(tx, clinicId),
        getUsage(tx),
      ]);
      const blocked = limitError('user', limits, usage);
      if (blocked) throw new ActionError(blocked);

      // Evita convite duplicado para o mesmo e-mail pendente.
      const existing = await tx.query<{ id: string }>(
        `select id from user_invites
          where clinic_id = $1 and lower(email) = lower($2) and status = 'pendente'
          limit 1`,
        [clinicId, data.email],
      );
      if (existing.length > 0) {
        throw new ActionError(
          'Já existe um convite pendente para este e-mail.',
        );
      }

      const token = randomBytes(32).toString('base64url');
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await tx.query(
        `insert into user_invites
           (clinic_id, email, full_name, role, token_hash, status, expires_at, invited_by)
         values
           ($1, $2, $3, $4::app_role, $5, 'pendente', $6::timestamptz, $7::uuid)`,
        [clinicId, data.email.toLowerCase(), data.fullName, data.role, tokenHash, expiresAt.toISOString(), userId],
      );

      return `/convite/${token}`;
    });

    revalidatePath('/app/usuarios');
    return {
      success: 'Convite criado. Compartilhe o link com o convidado.',
      inviteLink,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: errorMessage(error) };
  }
}

export async function revokeInviteAction(formData: FormData) {
  const inviteId = String(formData.get('inviteId') ?? '');
  const access = await guardAction('usuarios', 'usuarios:edit', '/app/usuarios');

  if (!isUuid(inviteId)) {
    redirect(`/app/usuarios?erro=${encodeURIComponent('Convite inválido.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      (tx) =>
        tx.query(
          `update user_invites set status = 'cancelado' where id = $1 and status = 'pendente'`,
          [inviteId],
        ),
    );
    revalidatePath('/app/usuarios');
    redirect(`/app/usuarios?msg=${encodeURIComponent('Convite cancelado.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`/app/usuarios?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}

export async function updateMemberRoleAction(formData: FormData) {
  const membershipId = String(formData.get('membershipId') ?? '');
  const role = String(formData.get('role') ?? '');
  const access = await guardAction('usuarios', 'usuarios:edit', '/app/usuarios');

  if (!isUuid(membershipId) || !['clinic_admin', 'doctor', 'receptionist', 'finance'].includes(role)) {
    redirect(`/app/usuarios?erro=${encodeURIComponent('Dados inválidos.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      (tx) =>
        tx.query(
          `update clinic_memberships set role = $2::app_role, updated_at = now() where id = $1`,
          [membershipId, role],
        ),
    );
    revalidatePath('/app/usuarios');
    redirect(`/app/usuarios?msg=${encodeURIComponent('Perfil atualizado.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`/app/usuarios?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}

export async function updateMemberUnitsAction(formData: FormData) {
  const membershipId = String(formData.get('membershipId') ?? '');
  const access = await guardAction('usuarios', 'usuarios:edit', '/app/usuarios');

  if (!isUuid(membershipId)) {
    redirect(`/app/usuarios?erro=${encodeURIComponent('Vínculo inválido.')}`);
  }

  const unitIds = formData
    .getAll('unitIds')
    .map((value) => String(value))
    .filter((value) => UUID_RE.test(value));

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      async (tx) => {
        await tx.query(
          `delete from membership_units where membership_id = $1`,
          [membershipId],
        );
        for (const unitId of unitIds) {
          await tx.query(
            `insert into membership_units (membership_id, unit_id, clinic_id)
             values ($1, $2::uuid, $3)
             on conflict do nothing`,
            [membershipId, unitId, access.user.activeClinicId],
          );
        }
      },
    );
    revalidatePath('/app/usuarios');
    redirect(`/app/usuarios?msg=${encodeURIComponent('Unidades atualizadas.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`/app/usuarios?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}

export async function setMemberStatusAction(formData: FormData) {
  const membershipId = String(formData.get('membershipId') ?? '');
  const status = String(formData.get('status') ?? '');
  const access = await guardAction('usuarios', 'usuarios:edit', '/app/usuarios');

  if (!isUuid(membershipId) || !['ativo', 'suspenso'].includes(status)) {
    redirect(`/app/usuarios?erro=${encodeURIComponent('Dados inválidos.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      async (tx) => {
        if (status === 'suspenso') {
          const target = await tx.query<{ role: string }>(
            `select role::text as role from clinic_memberships where id = $1`,
            [membershipId],
          );
          if (target[0]?.role === 'clinic_admin') {
            const admins = await tx.query<{ total: number }>(
              `select count(*)::int as total
                 from clinic_memberships
                where clinic_id = $1
                  and role = 'clinic_admin'
                  and status = 'ativo'`,
              [access.user.activeClinicId],
            );
            if ((admins[0]?.total ?? 0) <= 1) {
              throw new ActionError(
                'Não é possível suspender o último administrador da clínica. Cadastre outro administrador antes.',
              );
            }
          }
        }
        await tx.query(
          `update clinic_memberships set status = $2::membership_status, updated_at = now() where id = $1`,
          [membershipId, status],
        );
      },
    );
    revalidatePath('/app/usuarios');
    redirect(`/app/usuarios?msg=${encodeURIComponent('Situação atualizada.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`/app/usuarios?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}

export async function removeMemberAction(formData: FormData) {
  const membershipId = String(formData.get('membershipId') ?? '');
  const access = await guardAction('usuarios', 'usuarios:delete', '/app/usuarios');

  if (!isUuid(membershipId)) {
    redirect(`/app/usuarios?erro=${encodeURIComponent('Vínculo inválido.')}`);
  }

  try {
    await withTenant(
      { userId: access.user.id, clinicId: access.user.activeClinicId },
      async (tx) => {
        const target = await tx.query<{ role: string }>(
          `select role::text as role from clinic_memberships where id = $1`,
          [membershipId],
        );
        if (target[0]?.role === 'clinic_admin') {
          const admins = await tx.query<{ total: number }>(
            `select count(*)::int as total
               from clinic_memberships
              where clinic_id = $1
                and role = 'clinic_admin'
                and status = 'ativo'`,
            [access.user.activeClinicId],
          );
          if ((admins[0]?.total ?? 0) <= 1) {
            throw new ActionError(
              'Não é possível remover o último administrador da clínica. Cadastre outro administrador antes.',
            );
          }
        }
        await tx.query(
          `update clinic_memberships set status = 'removido', updated_at = now() where id = $1`,
          [membershipId],
        );
      },
    );
    revalidatePath('/app/usuarios');
    redirect(`/app/usuarios?msg=${encodeURIComponent('Usuário removido da clínica.')}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`/app/usuarios?erro=${encodeURIComponent(errorMessage(error))}`);
  }
}
