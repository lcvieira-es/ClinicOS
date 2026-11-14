'use client';

import { useActionState, useState } from 'react';
import {
  ArrowRight,
  CircleCheck,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import { loginAction, type LoginState } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/input';

const initialState: LoginState = {};

export function LoginForm({
  initialError,
  demoAccounts,
}: {
  initialError?: string;
  demoAccounts: Array<{ label: string; email: string; role: string }>;
}) {
  const [state, formAction, pending] = useActionState(loginAction, {
    ...initialState,
    error: initialError,
  });
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-end px-4 py-8 sm:px-8 lg:px-16 xl:px-24">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/30 bg-white/90 p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-9">
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 shadow-[0_8px_18px_-10px_rgba(9,61,105,0.9)] ring-1 ring-white/10">
                <ShieldCheck className="h-5 w-5 text-mint-400" strokeWidth={2} />
              </div>
              <span className="text-xl font-bold tracking-tight text-navy-900">
                Clinic<span className="text-mint-400">OS</span>
              </span>
            </div>
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-navy-700">
              <ShieldCheck className="h-3 w-3" strokeWidth={2.2} />
              Área restrita
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-navy-900">
              Acessar o ClinicOS
            </h1>
            <p className="mt-1.5 text-sm text-ink-500">
              Entre com suas credenciais para continuar.
            </p>
          </div>

          <form action={formAction} className="space-y-4" noValidate>
            <Field label="E-mail" htmlFor="email">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" strokeWidth={1.9} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  defaultValue={state.email}
                  placeholder="seu.email@clinica.com.br"
                  className="h-11 w-full rounded-xl border border-[#737373] bg-white pl-9 pr-3 text-sm text-ink-900 transition placeholder:text-ink-400 hover:border-[#737373] focus:border-navy-600 focus:outline-none focus:ring-4 focus:ring-mint-400/20"
                  required
                />
              </div>
            </Field>

            <Field label="Senha" htmlFor="password">
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" strokeWidth={1.9} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  className="h-11 w-full rounded-xl border border-[#737373] bg-white pl-9 pr-11 text-sm text-ink-900 transition placeholder:text-ink-400 hover:border-[#737373] focus:border-navy-600 focus:outline-none focus:ring-4 focus:ring-mint-400/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-400 transition hover:bg-sky-100 hover:text-navy-900"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={1.9} /> : <Eye className="h-4 w-4" strokeWidth={1.9} />}
                </button>
              </div>
            </Field>

            {state.error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700" role="alert">
                {state.error}
              </div>
            ) : null}

            <div className="flex items-center justify-between pt-1">
              <label className="group flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 cursor-pointer rounded-md border-sky-200 text-navy-700 accent-navy-900 focus:ring-navy-700"
                />
                <span className="text-xs text-ink-500 transition-colors group-hover:text-navy-900">
                  Lembrar deste dispositivo
                </span>
              </label>
              <a href="#" className="text-xs font-medium text-navy-700 transition-colors hover:text-navy-900">
                Esqueceu a senha?
              </a>
            </div>

            <Button type="submit" size="lg" className="mt-4 w-full" disabled={pending}>
              {pending ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2} />
                  Autenticando…
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </>
              )}
            </Button>
          </form>

          <div className="mt-5 flex items-start gap-2 rounded-xl bg-sky-50 px-3 py-2.5 text-[11px] leading-relaxed text-ink-500">
            <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={2} />
            <span>Acesso protegido por sessão segura e auditoria.</span>
          </div>

          {demoAccounts.length > 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-amber-700">
                Ambiente de demonstração · senha: Clinicos@2026
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => {
                      const emailInput = document.getElementById('email') as HTMLInputElement | null;
                      const pwdInput = document.getElementById('password') as HTMLInputElement | null;
                      if (emailInput) emailInput.value = account.email;
                      if (pwdInput) pwdInput.value = 'Clinicos@2026';
                    }}
                    className="rounded-lg bg-white/80 px-2.5 py-2 text-left ring-1 ring-amber-200/60 transition hover:bg-white"
                  >
                    <p className="truncate text-[10px] font-bold text-navy-900">{account.label}</p>
                    <p className="truncate font-mono text-[10px] text-ink-500">{account.email}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-white/50">
          <MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />
          <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="transition hover:text-white/80">
            Fale com o Suporte
          </a>
        </div>
      </div>
    </div>
  );
}
