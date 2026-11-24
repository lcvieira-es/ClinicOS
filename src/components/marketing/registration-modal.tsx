'use client';

import { useState, useEffect, useRef } from 'react';
import { useActionState } from 'react';
import { registerTrialClinicAction } from '@/lib/marketing/register-action';
import { plans } from '@/lib/marketing/plans';
import { Button } from '@/components/ui/button';
import { lookupCep } from '@/lib/utils/cep';
import { formatPhoneBR } from '@/lib/utils/phone';

export function RegistrationModal() {
  const [open, setOpen] = useState(false);
  const cepRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = cepRef.current;
    if (!el) return;
    const handler = async () => {
      const data = await lookupCep(el.value);
      if (!data) return;
      const addr = document.querySelector('input[name="address"]') as HTMLInputElement | null;
      const comp = document.querySelector('input[name="complement"]') as HTMLInputElement | null;
      if (addr) addr.value = data.logradouro;
      if (comp && data.complemento) comp.value = data.complemento;
    };
    el.addEventListener('blur', handler);
    return () => el.removeEventListener('blur', handler);
  }, [open]);
  const [state, formAction, pending] = useActionState(registerTrialClinicAction, {});

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-auto inline-flex items-center justify-center rounded-full bg-navy-900 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-navy-700"
      >
        Solicitar avaliação gratuita
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-navy-900">Solicitar avaliação gratuita</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-ink-500 hover:text-navy-900">✕</button>
            </div>

            {state.success ? (
              <div className="space-y-4">
                <p className="text-sm text-emerald-700 font-semibold">{state.success}</p>
                <p className="text-sm text-ink-600">
                  Clínica <strong>{state.clinicName}</strong> cadastrada. Acesso: <strong>{state.adminEmail}</strong>
                </p>
                {state.temporaryPassword ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-bold text-amber-700">Senha temporária (exibida uma única vez)</p>
                    <code className="mt-2 block select-all rounded-lg bg-white px-3 py-2 font-mono text-sm font-bold text-navy-900 ring-1 ring-amber-200">
                      {state.temporaryPassword}
                    </code>
                    <p className="mt-2 text-xs text-ink-600">Anote e entregue com segurança. Altere no primeiro acesso.</p>
                  </div>
                ) : (
                  <p className="text-sm text-ink-600">O e-mail já possuía conta; o vínculo foi ativado com a senha atual.</p>
                )}
                <button type="button" onClick={() => setOpen(false)} className="rounded-full bg-navy-900 px-6 py-2 text-sm font-semibold text-white">
                  Fechar
                </button>
              </div>
            ) : (
              <form action={formAction} className="space-y-6">
                <fieldset className="space-y-3">
                  <legend className="text-sm font-bold text-navy-900">Dados pessoais</legend>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-ink-600">Nome completo *</span>
                    <input name="fullName" required className="h-10 w-full rounded-xl border border-[#737373] px-3 text-sm" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-ink-600">Telefone particular</span>
                    <input name="phonePersonal" inputMode="tel" className="h-10 w-full rounded-xl border border-[#737373] px-3 text-sm" onChange={(e) => { e.target.value = formatPhoneBR(e.target.value); }} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-ink-600">Email particular *</span>
                    <input name="emailPersonal" type="email" required className="h-10 w-full rounded-xl border border-[#737373] px-3 text-sm" />
                  </label>
                </fieldset>

                <fieldset className="space-y-3">
                  <legend className="text-sm font-bold text-navy-900">Dados profissionais</legend>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-ink-600">Nome da clínica *</span>
                    <input name="clinicName" required className="h-10 w-full rounded-xl border border-[#737373] px-3 text-sm" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-ink-600">CNPJ</span>
                    <input name="cnpj" placeholder="00.000.000/0000-00" className="h-10 w-full rounded-xl border border-[#737373] px-3 text-sm" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-ink-600">CEP</span>
                    <input
                      name="cep"
                      ref={cepRef}
                      className="h-10 w-full rounded-xl border border-[#737373] px-3 text-sm"
                      onChange={() => {
                        // lookup happens on blur via native listener
                      }}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-ink-600">Endereço completo da clínica *</span>
                    <input name="address" required className="h-10 w-full rounded-xl border border-[#737373] px-3 text-sm" />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-ink-600">Número *</span>
                      <input name="addressNumber" required className="h-10 w-full rounded-xl border border-[#737373] px-3 text-sm" />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-ink-600">Complemento</span>
                      <input name="complement" className="h-10 w-full rounded-xl border border-[#737373] px-3 text-sm" />
                    </label>
                  </div>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-ink-600">Telefone profissional</span>
                    <input name="phoneProfessional" inputMode="tel" className="h-10 w-full rounded-xl border border-[#737373] px-3 text-sm" onChange={(e) => { e.target.value = formatPhoneBR(e.target.value); }} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-ink-600">Email profissional</span>
                    <input name="emailProfessional" type="email" className="h-10 w-full rounded-xl border border-[#737373] px-3 text-sm" />
                  </label>
                </fieldset>

                <fieldset className="space-y-3">
                  <legend className="text-sm font-bold text-navy-900">Plano e acesso</legend>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-ink-600">Plano de assinatura *</span>
                    <select name="planSlug" required className="h-10 w-full rounded-xl border border-[#737373] px-3 text-sm">
                      <option value="">Selecione…</option>
                      {plans.map((p) => (
                        <option key={p.slug} value={p.slug}>{p.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-ink-600">E-mail de acesso ao sistema *</span>
                    <select name="accessEmailChoice" required className="h-10 w-full rounded-xl border border-[#737373] px-3 text-sm">
                      <option value="personal">Email particular</option>
                      <option value="professional">Email profissional</option>
                    </select>
                  </label>
                </fieldset>

                {state.error && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{state.error}</p>
                )}

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-line px-5 py-2 text-sm font-semibold text-ink-700">
                    Cancelar
                  </button>
                  <button type="submit" disabled={pending} className="rounded-full bg-navy-900 px-6 py-2 text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-60">
                    {pending ? 'Enviando…' : 'Enviar cadastro'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
