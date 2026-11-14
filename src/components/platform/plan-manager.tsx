'use client';

import { useActionState, useState } from 'react';
import {
  Building,
  Check,
  CircleCheck,
  CreditCard,
  Pencil,
  Plus,
  Sparkles,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { savePlanAction, type SimpleState } from '@/lib/platform/actions';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface PlanCard {
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
  ai_interaction_limit: number;
  message_limit: number;
  trial_days: number;
  is_active: boolean;
  sort_order: number;
  module_count: number;
  active_subscriptions: number;
}

const emptyPlan: Omit<PlanCard, 'module_count' | 'active_subscriptions'> = {
  id: '',
  name: '',
  slug: '',
  description: '',
  monthly_price: '0',
  annual_price: '0',
  user_limit: 0,
  professional_limit: 0,
  unit_limit: 1,
  patient_limit: 0,
  storage_gb: 0,
  ai_interaction_limit: 0,
  message_limit: 0,
  trial_days: 14,
  is_active: true,
  sort_order: 40,
};

export function PlanManager({
  plans,
  canEdit,
}: {
  plans: PlanCard[];
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState<PlanCard | null>(null);
  const [creating, setCreating] = useState(false);
  const [state, formAction, pending] = useActionState<SimpleState, FormData>(
    savePlanAction,
    {},
  );

  const formOpen = creating || editing !== null;
  const current = editing ?? (creating ? { ...emptyPlan, module_count: 0, active_subscriptions: 0 } : null);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        {canEdit ? (
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Novo plano
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="flex flex-col rounded-card border border-line bg-white p-5 shadow-card"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-navy-900">{plan.name}</h2>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset',
                      plan.is_active
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                        : 'bg-slate-100 text-ink-500 ring-line',
                    )}
                  >
                    {plan.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p className="mt-0.5 font-mono text-[10px] text-ink-400">{plan.slug}</p>
              </div>
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(plan);
                    setCreating(false);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-sky-50 hover:text-navy-900"
                  aria-label={`Editar plano ${plan.name}`}
                  title="Editar plano"
                >
                  <Pencil className="h-4 w-4" strokeWidth={1.9} />
                </button>
              ) : null}
            </div>

            {plan.description ? (
              <p className="mt-2 text-[11px] leading-relaxed text-ink-500">
                {plan.description}
              </p>
            ) : null}

            <div className="mt-4 flex items-end gap-1">
              <span className="text-2xl font-bold tracking-tight text-navy-900">
                {formatCurrency(plan.monthly_price)}
              </span>
              <span className="pb-0.5 text-[10px] text-ink-400">/mês</span>
            </div>
            <p className="text-[10px] text-ink-400">
              {formatCurrency(plan.annual_price)}/ano
            </p>

            <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4 text-[10px]">
              {[
                ['Usuários', plan.user_limit],
                ['Profissionais', plan.professional_limit],
                ['Unidades', plan.unit_limit],
                ['Pacientes', plan.patient_limit],
                ['Armazenamento', `${plan.storage_gb} GB`],
                ['Mensagens', plan.message_limit],
                ['Interações IA', plan.ai_interaction_limit],
                ['Teste', `${plan.trial_days} dias`],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-lg bg-sky-25 px-2.5 py-2">
                  <dt className="text-[8px] font-bold uppercase tracking-wide text-ink-400">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-[11px] font-bold text-navy-900">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[10px]">
              <span className="inline-flex items-center gap-1 font-semibold text-ink-500">
                <Building className="h-3 w-3" />
                {plan.module_count} módulos
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                <Users className="h-3 w-3" />
                {plan.active_subscriptions} clínicas ativas
              </span>
            </div>
          </div>
        ))}
      </div>

      {canEdit && formOpen && current ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-navy-950/50 p-4 pt-20 backdrop-blur-sm sm:p-6 sm:pt-20"
          role="dialog"
          aria-modal="true"
          aria-label={current.id ? 'Editar plano' : 'Novo plano'}
        >
          <div className="max-h-[calc(100vh-6rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-pop">
            <div className="sticky top-0 flex items-center justify-between border-b border-line bg-white/95 px-5 py-4 backdrop-blur">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-navy-800">
                  <Wallet className="h-4 w-4" />
                </span>
                <h2 className="text-sm font-bold text-navy-900">
                  {current.id ? `Editar plano · ${current.name}` : 'Novo plano'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setCreating(false);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-sky-50 hover:text-navy-900"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <form action={formAction} className="grid gap-4 p-5 sm:grid-cols-2">
              <input type="hidden" name="id" value={current.id} />

              <PlanField label="Nome *" name="name" defaultValue={current.name} placeholder="Profissional" required className="sm:col-span-2" />
              <PlanField label="Slug *" name="slug" defaultValue={current.slug} placeholder="professional" mono required />
              <PlanField label="Ordem" name="sortOrder" type="number" defaultValue={String(current.sort_order)} />
              <PlanField label="Descrição" name="description" defaultValue={current.description ?? ''} placeholder="Para clínicas com equipe…" className="sm:col-span-2" />
              <PlanField label="Preço mensal (R$) *" name="monthlyPrice" type="number" step="0.01" min="0" defaultValue={current.monthly_price} required />
              <PlanField label="Preço anual (R$) *" name="annualPrice" type="number" step="0.01" min="0" defaultValue={current.annual_price} required />
              <PlanField label="Usuários *" name="userLimit" type="number" min="0" defaultValue={String(current.user_limit)} required />
              <PlanField label="Profissionais *" name="professionalLimit" type="number" min="0" defaultValue={String(current.professional_limit)} required />
              <PlanField label="Unidades *" name="unitLimit" type="number" min="0" defaultValue={String(current.unit_limit)} required />
              <PlanField label="Pacientes *" name="patientLimit" type="number" min="0" defaultValue={String(current.patient_limit)} required />
              <PlanField label="Armazenamento (GB) *" name="storageGb" type="number" min="0" defaultValue={String(current.storage_gb)} required />
              <PlanField label="Mensagens no mês *" name="messageLimit" type="number" min="0" defaultValue={String(current.message_limit)} required />
              <PlanField label="Interações de IA no mês *" name="aiInteractionLimit" type="number" min="0" defaultValue={String(current.ai_interaction_limit)} required />
              <PlanField label="Dias de teste *" name="trialDays" type="number" min="0" defaultValue={String(current.trial_days)} required />

              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line px-3 py-2.5 text-xs font-semibold text-ink-700 sm:col-span-2">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={current.is_active}
                  className="h-4 w-4 accent-[#093D69]"
                />
                Plano ativo e disponível para novas contratações
              </label>

              {state.error ? (
                <p className="rounded-xl border border-red-200 bg-danger-soft/60 px-3 py-2.5 text-xs font-medium text-red-700 sm:col-span-2" role="alert">
                  {state.error}
                </p>
              ) : null}
              {state.success ? (
                <p className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-800 sm:col-span-2" role="status">
                  <CircleCheck className="h-4 w-4" />
                  {state.success}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-2 border-t border-line pt-4 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setCreating(false);
                  }}
                  className="h-10 rounded-xl border border-line px-4 text-xs font-semibold text-ink-600 transition hover:bg-sky-50"
                >
                  Cancelar
                </button>
                <Button type="submit" disabled={pending}>
                  {pending ? 'Salvando…' : 'Salvar plano'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <p className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-ink-400">
        <Sparkles className="h-3 w-3" />
        Alterações em planos são auditadas com hash encadeado.
        <CreditCard className="ml-1 h-3 w-3" />
        O valor vigente é congelado na assinatura da clínica.
        <Check className="ml-1 h-3 w-3" />
      </p>
    </div>
  );
}

function PlanField({
  label,
  name,
  type = 'text',
  defaultValue,
  placeholder,
  step,
  min,
  mono = false,
  required = false,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  step?: string;
  min?: string;
  mono?: boolean;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-[10px] font-semibold text-ink-600">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        step={step}
        min={min}
        required={required}
        className={cn(
          'h-10 w-full rounded-xl border border-[#737373] px-3 text-sm outline-none transition placeholder:text-ink-400 focus:border-navy-600 focus:ring-4 focus:ring-mint-400/15',
          mono && 'font-mono text-xs',
        )}
      />
    </label>
  );
}
