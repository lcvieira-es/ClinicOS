'use server';

import { redirect } from 'next/navigation';
import { createHash } from 'node:crypto';
import { withTenant } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import type { ClinicFormState } from '@/lib/clinic/form-state';
import { errorMessage, isRedirectError } from '@/lib/clinic/validation';

export async function acceptInviteAction(formData: FormData): Promise<void> {
  const token = String(formData.get('token') ?? '').trim();
  const fullName = String(formData.get('fullName') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (!token) {
    redirect(`/login?erro=${encodeURIComponent('Convite inválido.')}`);
  }
  if (fullName.length < 3) {
    redirect(`/convite/${token}?erro=${encodeURIComponent('Informe seu nome completo.')}`);
  }
  if (password.length < 8) {
    redirect(`/convite/${token}?erro=${encodeURIComponent('A senha deve ter ao menos 8 caracteres.')}`);
  }
  if (password !== confirm) {
    redirect(`/convite/${token}?erro=${encodeURIComponent('As senhas não conferem.')}`);
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const passwordHash = await hashPassword(password);

  try {
    const result = await withTenant({ userId: '', clinicId: '' }, async (tx) => {
      const rows = await tx.query<{ result: unknown }>(
        `select app_accept_invite($1, $2, $3) as result`,
        [tokenHash, fullName, passwordHash],
      );
      return (rows[0]?.result ?? null) as {
        ok: boolean;
        error?: string;
      } | null;
    });

    if (!result?.ok) {
      const map: Record<string, string> = {
        invalido: 'Convite inválido ou inexistente.',
        utilizado: 'Este convite já foi utilizado.',
        expirado: 'Este convite expirou.',
        nome: 'Informe um nome válido.',
        senha: 'Senha inválida.',
      };
      redirect(
        `/convite/${token}?erro=${encodeURIComponent(
          map[result?.error ?? ''] ?? 'Não foi possível aceitar o convite.',
        )}`,
      );
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect(`/convite/${token}?erro=${encodeURIComponent(errorMessage(error))}`);
  }

  redirect(`/login?msg=${encodeURIComponent('Convite aceito. Faça login com seu e-mail e senha.')}`);
}

export async function getInviteStatus(token: string): Promise<{
  found: boolean;
  valid: boolean;
  email: string | null;
  fullName: string | null;
}> {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  try {
    const result = await withTenant({ userId: '', clinicId: '' }, async (tx) => {
      const rows = await tx.query<{ result: unknown }>(
        `select app_invite_status($1) as result`,
        [tokenHash],
      );
      return (rows[0]?.result ?? null) as {
        found: boolean;
        valid: boolean;
        email: string | null;
        fullName: string | null;
      } | null;
    });
    if (!result) return { found: false, valid: false, email: null, fullName: null };
    return {
      found: Boolean(result.found),
      valid: Boolean(result.valid),
      email: result.email ?? null,
      fullName: result.fullName ?? null,
    };
  } catch {
    return { found: false, valid: false, email: null, fullName: null };
  }
}
