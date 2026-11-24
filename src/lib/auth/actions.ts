'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { trustedQuery } from '@/lib/db';
import { verifyPassword } from './password';
import { clearSession, writeSession, readSession } from './session';
import { getCurrentUser } from './current-user';

export interface LoginState {
  error?: string;
  email?: string;
}

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Informe o e-mail.')
    .email('Informe um e-mail válido.')
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, 'Informe a senha.'),
});

interface LoginUserRow {
  id: string;
  email: string;
  password_hash: string | null;
  full_name: string;
  status: string;
  is_platform_admin: boolean;
}

interface AccessRow {
  clinic_id: string;
}

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
      email: String(formData.get('email') ?? ''),
    };
  }

  const { email, password } = parsed.data;

  const user = (
    await trustedQuery<LoginUserRow>(
      `select u.id, u.email, u.password_hash, u.full_name, u.status,
              exists (
                select 1 from platform_admins pa
                where pa.user_id = u.id and pa.status = 'ativo'
              ) as is_platform_admin
         from users u
        where lower(u.email) = $1
        limit 1`,
      [email],
    )
  )[0];

  const valid = await verifyPassword(user?.password_hash, password);

  if (!user || !valid) {
    return { error: 'E-mail ou senha inválidos.', email };
  }

  if (user.status !== 'ativo') {
    return {
      error: 'Esta conta está inativa. Procure o administrador da clínica.',
      email,
    };
  }

  const [memberships, portalAccess] = await Promise.all([
    trustedQuery<AccessRow>(
      `select clinic_id
         from clinic_memberships
        where user_id = $1 and status = 'ativo'
        order by created_at
        limit 1`,
      [user.id],
    ),
    trustedQuery<AccessRow>(
      `select clinic_id
         from patient_portal_access
        where user_id = $1 and status = 'ativo'
        order by granted_at
        limit 1`,
      [user.id],
    ),
  ]);

  const clinicId =
    memberships[0]?.clinic_id ?? portalAccess[0]?.clinic_id ?? null;

  if (!user.is_platform_admin && !clinicId && portalAccess.length === 0) {
    return {
      error:
        'Sua conta não possui vínculo ativo com uma clínica. Procure o administrador.',
      email,
    };
  }

  await trustedQuery(
    `update users set last_login_at = now(), updated_at = now() where id = $1`,
    [user.id],
  );

  await writeSession({ userId: user.id, clinicId });

  // Password change is no longer forced on first login; available at /alterar-senha.

  if (user.is_platform_admin) {
    redirect('/admin');
  }
  if (clinicId) {
    redirect('/app/painel');
  }
  redirect('/portal');
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect('/login');
}

export async function switchClinicAction(formData: FormData): Promise<void> {
  const clinicId = String(formData.get('clinicId') ?? '');
  const user = await getCurrentUser();

  if (!user) redirect('/login');

  const membership = user.memberships.find((item) => item.clinicId === clinicId);
  if (!membership) redirect('/app/painel');

  await writeSession({ userId: user.id, clinicId: membership.clinicId });
  redirect('/app/painel');
}
