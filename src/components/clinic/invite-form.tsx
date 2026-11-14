'use client';

import { useActionState, useState } from 'react';
import { LoaderCircle, Copy, Check, Link2 } from 'lucide-react';
import { createInviteAction } from '@/lib/clinic/actions/team';
import type { InviteCreatedState } from '@/lib/clinic/actions/team';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/input';

export function InviteForm({ units: _units }: { units: Array<{ id: string; name: string }> }) {
  const [state, formAction, pending] = useActionState<InviteCreatedState, FormData>(
    createInviteAction,
    {},
  );
  const [copied, setCopied] = useState(false);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <div className="rounded-xl border border-red-200 bg-danger-soft/60 px-4 py-3 text-xs font-medium text-red-700" role="alert">
          {state.error}
        </div>
      ) : null}
      {state.success ? (
        <div className="rounded-xl border border-emerald-200 bg-success-soft/60 px-4 py-3 text-xs font-medium text-emerald-700" role="status">
          {state.success}
        </div>
      ) : null}
      {state.inviteLink ? (
        <div className="rounded-xl border border-sky-200 bg-info-soft/60 px-4 py-3 text-xs">
          <p className="mb-2 font-bold text-sky-800">Link do convite (compartilhe uma única vez):</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-white px-3 py-2 font-mono text-[11px] text-ink-700">
              {origin}
              {state.inviteLink}
            </code>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(`${origin}${state.inviteLink}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  // noop
                }
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-white px-3 text-xs font-semibold text-ink-700 transition hover:bg-sky-100"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-sky-700">
            O link expira em 7 dias e só pode ser usado uma vez.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="E-mail *" htmlFor="email">
          <Input id="email" name="email" type="email" required placeholder="novo@clinica.com" />
        </Field>
        <Field label="Nome completo *" htmlFor="fullName">
          <Input id="fullName" name="fullName" required minLength={3} placeholder="Nome do convidado" />
        </Field>
        <Field label="Perfil *" htmlFor="role">
          <Select id="role" name="role" required defaultValue="receptionist">
            <option value="clinic_admin">Administrador da clínica</option>
            <option value="doctor">Médico / profissional</option>
            <option value="receptionist">Recepcionista</option>
            <option value="finance">Financeiro</option>
          </Select>
        </Field>
      </div>

      <div className="flex items-center justify-end">
        <Button type="submit" disabled={pending} size="md">
          {pending ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2} />
              Criando…
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4" strokeWidth={2} />
              Criar convite
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
