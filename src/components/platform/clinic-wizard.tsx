'use client';

import { useActionState, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Building,
  Check,
  CircleCheck,
  ClipboardList,
  Copy,
  CreditCard,
  LoaderCircle,
  Lock,
  MapPin,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import { createClinicAction, type WizardState } from '@/lib/platform/actions';
import { formatCnpj } from '@/lib/platform/format';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPhoneBR } from '@/lib/utils/phone';
import { lookupCep } from '@/lib/utils/cep';

export interface WizardPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthly_price: string;
  annual_price: string;
  user_limit: number;
  professional_limit: number;
  unit_limit: number;
  patient_limit: number;
  storage_gb: number;
  message_limit: number;
  ai_interaction_limit: number;
  trial_days: number;
  module_count: number;
}

interface WizardForm {
  legalName: string;
  tradeName: string;
  displayName: string;
  cnpj: string;
  email: string;
  phone: string;
  whatsapp: string;
  cep: string;
  address: string;
  addressNumber: string;
  neighborhood: string;
  city: string;
  state: string;
  notes: string;
  unitName: string;
  unitCode: string;
  unitPhone: string;
  unitEmail: string;
  unitOpeningHours: string;
  adminName: string;
  adminEmail: string;
  planSlug: string;
  periodicity: 'mensal' | 'anual';
}

const initialForm: WizardForm = {
  legalName: '',
  tradeName: '',
  displayName: '',
  cnpj: '',
  email: '',
  phone: '',
  whatsapp: '',
  cep: '',
  address: '',
  addressNumber: '',
  neighborhood: '',
  city: '',
  state: '',
  notes: '',
  unitName: 'Matriz',
  unitCode: 'MATRIZ-01',
  unitPhone: '',
  unitEmail: '',
  unitOpeningHours: 'Segunda a sexta, 08h às 18h',
  adminName: '',
  adminEmail: '',
  planSlug: '',
  periodicity: 'mensal',
};

const steps = [
  { key: 'clinica', label: 'Clínica', icon: Building },
  { key: 'unidade', label: 'Unidade matriz', icon: MapPin },
  { key: 'administrador', label: 'Administrador', icon: UserRound },
  { key: 'plano', label: 'Plano e assinatura', icon: CreditCard },
  { key: 'revisao', label: 'Revisão', icon: ClipboardList },
] as const;

export function ClinicWizard({ plans }: { plans: WizardPlan[] }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardForm>(initialForm);
  const [copied, setCopied] = useState(false);
  const [state, formAction, pending] = useActionState<WizardState, FormData>(
    createClinicAction,
    {},
  );

  const set = <K extends keyof WizardForm>(key: K, value: WizardForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.slug === form.planSlug) ?? null,
    [plans, form.planSlug],
  );

  const projectedPrice = selectedPlan
    ? form.periodicity === 'anual'
      ? Number(selectedPlan.annual_price)
      : Number(selectedPlan.monthly_price)
    : 0;

  const stepErrors = (index: number): string | null => {
    if (index === 0) {
      if (form.legalName.trim().length < 3) return 'Informe a razão social.';
      if (form.displayName.trim().length < 2) return 'Informe o nome de exibição.';
      if (form.cnpj && !/^\d{14}$/.test(form.cnpj.replace(/\D/g, '')))
        return 'CNPJ deve conter 14 dígitos.';
      if (form.address.trim().length < 3) return 'Informe o endereço.';
      if (!form.addressNumber.trim()) return 'Informe o número.';
      if (form.city.trim().length < 2) return 'Informe a cidade.';
      if (!/^[A-Z]{2}$/.test(form.state.trim().toUpperCase())) return 'Informe a UF (2 letras).';
      return null;
    }
    if (index === 1) {
      if (form.unitName.trim().length < 2) return 'Informe o nome da unidade.';
      return null;
    }
    if (index === 2) {
      if (form.adminName.trim().length < 3) return 'Informe o nome do administrador.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail.trim()))
        return 'Informe um e-mail válido.';
      return null;
    }
    if (index === 3) {
      if (!form.planSlug) return 'Selecione um plano.';
      return null;
    }
    return null;
  };

  const goNext = () => {
    if (stepErrors(step)) return;
    setStep((value) => Math.min(steps.length - 1, value + 1));
  };

  const payload = JSON.stringify({
    clinic: {
      legalName: form.legalName,
      tradeName: form.tradeName,
      displayName: form.displayName,
      cnpj: form.cnpj.replace(/\D/g, ''),
      email: form.email,
      phone: form.phone,
      whatsapp: form.whatsapp,
      cep: form.cep.replace(/\D/g, ''),
      address: form.address,
      addressNumber: form.addressNumber,
      neighborhood: form.neighborhood,
      city: form.city,
      state: form.state.toUpperCase(),
      notes: form.notes,
    },
    unit: {
      name: form.unitName,
      internalCode: form.unitCode,
      phone: form.unitPhone,
      email: form.unitEmail,
      cep: form.cep.replace(/\D/g, ''),
      address: form.address,
      addressNumber: form.addressNumber,
      neighborhood: form.neighborhood,
      city: form.city,
      state: form.state.toUpperCase(),
      openingHours: form.unitOpeningHours,
    },
    admin: {
      fullName: form.adminName,
      email: form.adminEmail,
    },
    subscription: {
      planSlug: form.planSlug,
      periodicity: form.periodicity,
    },
  });

  if (state.success) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-card border border-emerald-200 bg-white p-6 text-center shadow-card sm:p-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500">
            <CircleCheck className="h-7 w-7 text-white" strokeWidth={2} />
          </span>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-navy-900">
            Clínica criada com sucesso
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">
            <strong className="text-ink-700">{state.clinicName}</strong> foi cadastrada
            com unidade matriz, administrador e assinatura em implantação.
          </p>

          {state.temporaryPassword ? (
            <div className="mx-auto mt-5 max-w-md rounded-xl border border-amber-200 bg-warning-soft/40 p-4 text-left">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700">
                <Lock className="h-3.5 w-3.5" />
                Senha temporária ” exibida uma única vez
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-600">
                Anote e entregue com segurança para{' '}
                <strong>{state.adminEmail}</strong>. Peça para alterar no primeiro acesso.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 select-all rounded-lg bg-white px-3 py-2 font-mono text-sm font-bold text-navy-900 ring-1 ring-amber-200">
                  {state.temporaryPassword}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(state.temporaryPassword ?? '');
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1600);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-700 transition hover:bg-amber-50"
                  aria-label="Copiar senha temporária"
                >
                  {copied ? (
                    <Check className="h-4 w-4" strokeWidth={2.2} />
                  ) : (
                    <Copy className="h-4 w-4" strokeWidth={1.9} />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <p className="mx-auto mt-5 max-w-md rounded-xl bg-sky-50 px-4 py-3 text-[12px] leading-relaxed text-ink-600">
              O e-mail <strong>{state.adminEmail}</strong> já possuía conta no ClinicOS.
              O vínculo de administrador foi ativado com a senha atual do usuário.
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Link
              href={`/admin/clinicas/${state.clinicId}`}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-navy-900 px-5 text-sm font-semibold text-white transition hover:bg-navy-800"
            >
              Abrir a clínica
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <Link
              href="/admin/clinicas"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-5 text-sm font-semibold text-ink-700 transition hover:bg-sky-50"
            >
              Voltar à lista
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stepError = stepErrors(step);
  const selected = selectedPlan;

  return (
    <form action={formAction} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
      <input type="hidden" name="payload" value={payload} />

      <div className="rounded-card border border-line bg-white shadow-card">
        <ol className="flex items-center gap-0 overflow-x-auto border-b border-line px-3 py-3 sm:px-5">
          {steps.map((item, index) => {
            const active = index === step;
            const done = index < step;
            const Icon = item.icon;
            return (
              <li key={item.key} className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (index <= step || !stepErrors(step)) setStep(index);
                  }}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition"
                  aria-current={active ? 'step' : undefined}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition',
                      active
                        ? 'bg-navy-900 text-white'
                        : done
                          ? 'bg-mint-400 text-navy-950'
                          : 'bg-sky-100 text-ink-400',
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : index + 1}
                  </span>
                  <span
                    className={cn(
                      'hidden text-[11px] font-semibold md:inline',
                      active ? 'text-navy-900' : 'text-ink-400',
                    )}
                  >
                    {item.label}
                  </span>
                </button>
                {index < steps.length - 1 ? (
                  <span className="mx-1 h-px w-3 bg-line sm:w-5" aria-hidden />
                ) : null}
              </li>
            );
          })}
        </ol>

        <div className="p-5 sm:p-6">
          {step === 0 ? (
            <fieldset className="grid gap-4 sm:grid-cols-2">
              <WizardField label="Razão social *" value={form.legalName} onChange={(v) => set('legalName', v)} placeholder="Clínica Exemplo Ltda" className="sm:col-span-2" />
              <WizardField label="Nome fantasia" value={form.tradeName} onChange={(v) => set('tradeName', v)} placeholder="Clínica Exemplo" />
              <WizardField label="Nome de exibição *" value={form.displayName} onChange={(v) => set('displayName', v)} placeholder="Clínica Exemplo" />
              <WizardField label="CNPJ" value={form.cnpj} onChange={(v) => set('cnpj', v)} placeholder="00.000.000/0000-00" mono />
              <WizardField label="E-mail da clínica" type="email" value={form.email} onChange={(v) => set('email', v)} placeholder="contato@clinica.com.br" />
              <WizardField label="Telefone" value={form.phone} onChange={(v) => set('phone', formatPhoneBR(v))} placeholder="(11) 4000-0000" />
              <WizardField label="WhatsApp" value={form.whatsapp} onChange={(v) => set('whatsapp', formatPhoneBR(v))} placeholder="(11) 90000-0000" />
              <WizardField label="CEP" value={form.cep} onChange={async (v) => { set('cep', v); const data = await lookupCep(v); if (!data) return; set('address', data.logradouro); set('neighborhood', data.bairro); set('city', data.localidade); set('state', data.uf); }} placeholder="00000-000" mono />
              <WizardField label="Endereço *" value={form.address} onChange={(v) => set('address', v)} placeholder="Avenida Paulista" className="sm:col-span-2" />
              <WizardField label="Número *" value={form.addressNumber} onChange={(v) => set('addressNumber', v)} placeholder="1000" />
              <WizardField label="Bairro" value={form.neighborhood} onChange={(v) => set('neighborhood', v)} placeholder="Bela Vista" />
              <WizardField label="Cidade *" value={form.city} onChange={(v) => set('city', v)} placeholder="São Paulo" />
              <WizardField label="UF *" value={form.state} onChange={(v) => set('state', v.toUpperCase())} placeholder="SP" mono maxLength={2} />
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-[11px] font-semibold text-ink-600">Observações internas</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => set('notes', event.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-[#737373] px-3 py-2 text-sm outline-none transition focus:border-navy-600 focus:ring-4 focus:ring-mint-400/15"
                  placeholder="Notas sobre a implantação (opcional)"
                />
              </label>
            </fieldset>
          ) : null}

          {step === 1 ? (
            <fieldset className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 rounded-xl border border-info-soft bg-info-soft/40 px-3 py-2.5 text-[11px] leading-relaxed text-sky-800">
                A unidade matriz concentra o endereço principal. A clínica poderá
                cadastrar filiais na área de unidades após a implantação.
              </div>
              <WizardField label="Nome da unidade *" value={form.unitName} onChange={(v) => set('unitName', v)} placeholder="Matriz" />
              <WizardField label="Código interno" value={form.unitCode} onChange={(v) => set('unitCode', v)} placeholder="MATRIZ-01" mono />
              <WizardField label="Telefone da unidade" value={form.unitPhone} onChange={(v) => set('unitPhone', formatPhoneBR(v))} placeholder="(11) 4000-0000" />
              <WizardField label="E-mail da unidade" type="email" value={form.unitEmail} onChange={(v) => set('unitEmail', v)} placeholder="unidade@clinica.com.br" />
              <WizardField label="Horário de funcionamento" value={form.unitOpeningHours} onChange={(v) => set('unitOpeningHours', v)} className="sm:col-span-2" />
              <div className="sm:col-span-2 rounded-xl bg-sky-50 px-3 py-2.5 text-[11px] text-ink-500">
                Endereço herdado da clínica: {form.address}, {form.addressNumber}
                {form.neighborhood ? ` ” ${form.neighborhood}` : ''} ·{' '}
                {form.city}/{form.state}
              </div>
            </fieldset>
          ) : null}

          {step === 2 ? (
            <fieldset className="grid max-w-lg gap-4">
              <div className="rounded-xl border border-info-soft bg-info-soft/40 px-3 py-2.5 text-[11px] leading-relaxed text-sky-800">
                Será criado um vínculo de administrador da clínica para este e-mail.
                Se o usuário já existir no ClinicOS, ele será vinculado; caso contrário,
                criaremos a conta com uma senha temporária exibida uma única vez.
              </div>
              <WizardField label="Nome completo do administrador *" value={form.adminName} onChange={(v) => set('adminName', v)} placeholder="Maria Silva" />
              <WizardField label="E-mail de acesso *" type="email" value={form.adminEmail} onChange={(v) => set('adminEmail', v)} placeholder="admin@clinica.com.br" />
            </fieldset>
          ) : null}

          {step === 3 ? (
            <fieldset className="grid gap-3">
              {selectedPlan ? null : (
                <p className="text-[11px] font-semibold text-ink-500">
                  Selecione o plano contratado. O valor é aplicado automaticamente.
                </p>
              )}
              {plans.map((plan) => {
                const active = form.planSlug === plan.slug;
                return (
                  <button
                    key={plan.slug}
                    type="button"
                    onClick={() => set('planSlug', plan.slug)}
                    aria-pressed={active}
                    className={cn(
                      'rounded-2xl border p-4 text-left transition',
                      active
                        ? 'border-navy-900 bg-navy-900/[0.04] ring-2 ring-navy-900/80'
                        : 'border-line bg-white hover:border-navy-600/30',
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'flex h-5 w-5 items-center justify-center rounded-full border transition',
                            active ? 'border-navy-900 bg-navy-900' : 'border-[#737373]',
                          )}
                        >
                          {active ? <Check className="h-3 w-3 text-white" strokeWidth={3} /> : null}
                        </span>
                        <span className="text-sm font-bold text-navy-900">{plan.name}</span>
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-navy-700">
                          {plan.module_count} módulos
                        </span>
                      </div>
                      <span className="text-sm font-bold text-navy-900">
                        {formatCurrency(plan.monthly_price)}
                        <span className="text-[10px] font-normal text-ink-400">/mês</span>
                      </span>
                    </div>
                    {plan.description ? (
                      <p className="mt-1.5 pl-7 text-[11px] text-ink-500">{plan.description}</p>
                    ) : null}
                    <p className="mt-1.5 pl-7 text-[10px] text-ink-400">
                      {plan.user_limit} usuários · {plan.professional_limit} profissionais ·{' '}
                      {plan.unit_limit} unidade(s) · {plan.patient_limit} pacientes
                    </p>
                  </button>
                );
              })}

              <div className="mt-1 grid grid-cols-2 gap-2 rounded-xl border border-line bg-sky-25 p-1.5">
                {(['mensal', 'anual'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set('periodicity', value)}
                    className={cn(
                      'h-10 rounded-lg text-xs font-bold capitalize transition',
                      form.periodicity === value
                        ? 'bg-navy-900 text-white shadow-card'
                        : 'text-ink-600 hover:text-navy-900',
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4 text-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400">
                Confira antes de criar
              </p>

              <ReviewBlock
                title="Clínica"
                rows={[
                  ['Razão social', form.legalName],
                  ['Nome de exibição', form.displayName],
                  ['CNPJ', form.cnpj ? formatCnpj(form.cnpj) : '”'],
                  ['Endereço', `${form.address}, ${form.addressNumber}${form.neighborhood ? ` · ${form.neighborhood}` : ''} · ${form.city}/${form.state}`],
                  ['Contato', [form.email, form.phone].filter(Boolean).join(' · ') || '”'],
                ]}
              />
              <ReviewBlock
                title="Unidade matriz"
                rows={[
                  ['Nome', form.unitName],
                  ['Código interno', form.unitCode || '”'],
                  ['Funcionamento', form.unitOpeningHours],
                ]}
              />
              <ReviewBlock
                title="Administrador"
                rows={[
                  ['Nome', form.adminName],
                  ['E-mail de acesso', form.adminEmail],
                ]}
              />
              <ReviewBlock
                title="Plano e assinatura"
                rows={[
                  ['Plano', selected?.name ?? '”'],
                  ['Periodicidade', form.periodicity],
                  [
                    'Valor',
                    formatCurrency(projectedPrice) + (form.periodicity === 'mensal' ? '/mês' : '/ano'),
                  ],
                  ['Módulos incluídos', `${selected?.module_count ?? 0} módulos`],
                  ['Teste', `${selected?.trial_days ?? 0} dias`],
                ]}
              />

              <div className="flex items-start gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 px-3 py-2.5 text-[11px] leading-relaxed text-emerald-800">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                <span>
                  Ao confirmar, a clínica, a unidade matriz, o administrador, a
                  assinatura em implantação e os módulos do plano serão criados em
                  uma única transação. Toda alteração gera evento de auditoria.
                </span>
              </div>
            </div>
          ) : null}

          {stepError && step !== steps.length - 1 ? (
            <p className="mt-4 text-xs font-semibold text-danger" role="alert">
              {stepError}
            </p>
          ) : null}

          {state.error ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-danger-soft/60 px-3 py-2.5 text-xs font-medium text-red-700" role="alert">
              {state.error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>

          {step < steps.length - 1 ? (
            <Button type="button" onClick={goNext} disabled={Boolean(stepError)}>
              Continuar
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" variant="mint" size="lg" disabled={pending}>
              {pending ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2} />
                  Criando clínica…
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Criar clínica
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-card border border-line bg-white p-5 shadow-card">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
            Progresso
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-sky-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-navy-800 to-mint-400 transition-all"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] font-semibold text-ink-500">
            Etapa {step + 1} de {steps.length} · {steps[step].label}
          </p>
        </div>

        <div className="rounded-card border border-line bg-navy-900 p-5 text-white shadow-card">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-mint-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Provisão segura
          </p>
          <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-white/70">
            <li>• Cria clínica, unidade matriz, administrador e assinatura em uma transação.</li>
            <li>• Módulos do plano viram entitlements da clínica.</li>
            <li>• Dados clínicos nunca são acessados pela plataforma.</li>
            <li>• Toda alteração é auditada com hash encadeado.</li>
          </ul>
        </div>
      </aside>
    </form>
  );
}

function WizardField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  mono = false,
  maxLength,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  mono?: boolean;
  maxLength?: number;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-[11px] font-semibold text-ink-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={cn(
          'h-10 w-full rounded-xl border border-[#737373] px-3 text-sm outline-none transition placeholder:text-ink-400 focus:border-navy-600 focus:ring-4 focus:ring-mint-400/15',
          mono && 'font-mono',
        )}
      />
    </label>
  );
}

function ReviewBlock({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, string]>;
}) {
  return (
    <div className="rounded-xl border border-line">
      <p className="border-b border-line bg-slate-50/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500">
        {title}
      </p>
      <dl className="divide-y divide-line">
        {rows.map(([key, value]) => (
          <div key={key} className="grid grid-cols-[120px_minmax(0,1fr)] gap-2 px-3 py-1.5 text-[11px]">
            <dt className="text-ink-400">{key}</dt>
            <dd className="text-ink-700">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
