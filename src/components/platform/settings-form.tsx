'use client';

import { useActionState } from 'react';
import { Building, CircleCheck, LoaderCircle, Sparkles } from 'lucide-react';
import { savePlatformSettingsAction, type SimpleState } from '@/lib/platform/actions';
import type { PlatformSettings } from '@/lib/platform/admin-queries';
import { Button } from '@/components/ui/button';

export function SettingsForm({ settings }: { settings: PlatformSettings }) {
  const [state, formAction, pending] = useActionState<SimpleState, FormData>(
    savePlatformSettingsAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsField
          label="Nome da plataforma *"
          name="platformName"
          defaultValue={settings.platformName}
          placeholder="ClinicOS"
          required
        />
        <SettingsField
          label="E-mail de suporte *"
          name="supportEmail"
          type="email"
          defaultValue={settings.supportEmail}
          placeholder="suporte@clinicos.app"
          required
        />
        <SettingsField
          label="Dias de teste padrão *"
          name="defaultTrialDays"
          type="number"
          min="0"
          defaultValue={String(settings.defaultTrialDays)}
          required
        />
        <SelectField
          label="Gateway padrão *"
          name="defaultGateway"
          defaultValue={settings.defaultGateway}
          options={[
            ['manual', 'Manual (conciliação na plataforma)'],
            ['stripe', 'Stripe'],
            ['asaas', 'Asaas (Pix/boleto)'],
            ['pagseguro', 'PagSeguro'],
            ['mercadopago', 'Mercado Pago'],
          ]}
        />
        <SelectField
          label="Periodicidade padrão *"
          name="defaultPeriodicity"
          defaultValue={settings.defaultPeriodicity}
          options={[
            ['mensal', 'Mensal'],
            ['anual', 'Anual'],
          ]}
        />
        <SelectField
          label="Modo do WhatsApp *"
          name="whatsappMode"
          defaultValue={settings.whatsappMode}
          options={[
            ['manual', 'Manual (sem API ” envio assistido)'],
            ['meta', 'Meta Cloud API (oficial)'],
          ]}
        />
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-800">
          <Sparkles className="h-3.5 w-3.5" />
          Guardrails de IA ” fixos e não editáveis
        </p>
        <ul className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-emerald-800">
          <li className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 ring-1 ring-emerald-200">
            <CircleCheck className="h-3 w-3" />
            Diagnóstico desativado
          </li>
          <li className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 ring-1 ring-emerald-200">
            <CircleCheck className="h-3 w-3" />
            Prescrição autônoma desativada
          </li>
          <li className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 ring-1 ring-emerald-200">
            <CircleCheck className="h-3 w-3" />
            Revisão humana obrigatória
          </li>
        </ul>
        <p className="mt-2 text-[10px] leading-relaxed text-emerald-800/80">
          A IA auxilia documentação e organização. Ela nunca diagnostica, prescreve ou
          finaliza registros sem revisão do profissional.
        </p>
      </div>

      {state.error ? (
        <p className="rounded-xl border border-red-200 bg-danger-soft/60 px-3 py-2.5 text-xs font-medium text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-800" role="status">
          <CircleCheck className="h-4 w-4" />
          {state.success}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
        <p className="flex items-center gap-1.5 text-[10px] text-ink-400">
          <Building className="h-3.5 w-3.5" />
          Alterações registradas em auditoria com hash.
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2} />
              Salvando…
            </>
          ) : (
            'Salvar configurações'
          )}
        </Button>
      </div>
    </form>
  );
}

function SettingsField({
  label,
  name,
  type = 'text',
  defaultValue,
  placeholder,
  min,
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  min?: string;
  required?: boolean;
}) {
  return (
    <label>
      <span className="mb-1.5 block text-[10px] font-semibold text-ink-600">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        min={min}
        required={required}
        className="h-10 w-full rounded-xl border border-[#737373] px-3 text-sm outline-none transition placeholder:text-ink-400 focus:border-navy-600 focus:ring-4 focus:ring-mint-400/15"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: Array<[string, string]>;
}) {
  return (
    <label>
      <span className="mb-1.5 block text-[10px] font-semibold text-ink-600">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-10 w-full appearance-none rounded-xl border border-[#737373] bg-white px-3 text-sm outline-none transition focus:border-navy-600 focus:ring-4 focus:ring-mint-400/15"
      >
        {options.map(([value, labelText]) => (
          <option key={value} value={value}>
            {labelText}
          </option>
        ))}
      </select>
    </label>
  );
}
