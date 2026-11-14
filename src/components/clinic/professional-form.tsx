'use client';

import { useActionState, type ReactNode } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import {
  createProfessionalAction,
  updateProfessionalAction,
} from '@/lib/clinic/actions/professionals';
import type { ClinicFormState } from '@/lib/clinic/form-state';
import type { ProfessionalDetail } from '@/lib/clinic/professionals';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface UnitOption {
  id: string;
  name: string;
}

export function ProfessionalForm({
  mode,
  professional,
  units,
  canLinkUser,
  modules,
}: {
  mode: 'create' | 'edit';
  professional?: ProfessionalDetail;
  units: UnitOption[];
  canLinkUser: boolean;
  modules?: Array<{ key: string; name: string }>;
}) {
  const action =
    mode === 'create' ? createProfessionalAction : updateProfessionalAction;
  const [state, formAction, pending] = useActionState<ClinicFormState, FormData>(
    action,
    {},
  );

  const sections: Array<{
    title: string;
    description: string;
    columns: string;
    fields: ReactNode;
  }> = [
    {
      title: 'Identificação',
      description: 'Dados do conselho e especialidades.',
      columns: 'sm:grid-cols-3',
      fields: (
        <>
          <Field label="Nome completo *" htmlFor="fullName">
            <Input
              id="fullName"
              name="fullName"
              required
              minLength={3}
              defaultValue={professional?.full_name ?? ''}
              placeholder="Dra. Helena Martins"
            />
          </Field>
          <Field label="Conselho" htmlFor="council" hint="Sigla do conselho profissional.">
            <Select id="council" name="council" defaultValue={professional?.council ?? ''}>
              <option value="">—</option>
              <option value="CRM">CRM</option>
              <option value="CRO">CRO</option>
              <option value="CRF">CRF</option>
              <option value="COREN">COREN</option>
              <option value="CREFITO">CREFITO</option>
              <option value="CRP">CRP</option>
              <option value="CRN">CRN</option>
              <option value="CREF">CREF</option>
              <option value="CRBM">CRBM</option>
              <option value="CRFA">CRFA</option>
              <option value="CRTR">CRTR</option>
            </Select>
          </Field>
          <Field label="Número do registro" htmlFor="councilNumber">
            <Input
              id="councilNumber"
              name="councilNumber"
              defaultValue={professional?.council_number ?? ''}
            />
          </Field>
          <Field label="UF do conselho" htmlFor="councilState">
            <Input
              id="councilState"
              name="councilState"
              maxLength={2}
              defaultValue={professional?.council_state ?? ''}
              placeholder="SP"
              className="uppercase"
            />
          </Field>
          <Field
            label="Especialidades"
            htmlFor="specialties"
            className="sm:col-span-2"
            hint="Separe por vírgula: Clínica Médica, Medicina do Trabalho."
          >
            <Input
              id="specialties"
              name="specialties"
              defaultValue={(professional?.specialties ?? []).join(', ')}
            />
          </Field>
        </>
      ),
    },
    {
      title: 'Atendimento',
      description: 'Valores e duração padrão da consulta.',
      columns: 'sm:grid-cols-4',
      fields: (
        <>
          <Field label="Valor da consulta (R$)" htmlFor="consultationPrice">
            <Input
              id="consultationPrice"
              name="consultationPrice"
              inputMode="decimal"
              defaultValue={professional?.consultation_price ?? '0'}
              placeholder="350,00"
            />
          </Field>
          <Field label="Duração padrão (min)" htmlFor="defaultDurationMin">
            <Input
              id="defaultDurationMin"
              name="defaultDurationMin"
              inputMode="numeric"
              defaultValue={professional?.default_duration_min ?? 30}
            />
          </Field>
          <Field label="Comissão (%)" htmlFor="commissionPercent">
            <Input
              id="commissionPercent"
              name="commissionPercent"
              inputMode="decimal"
              defaultValue={professional?.commission_percent ?? '0'}
              placeholder="30,00"
            />
          </Field>
          <Field label="Cor" htmlFor="calendarColor" className="w-[20%]">
            <Input
              id="calendarColor"
              name="calendarColor"
              type="color"
              defaultValue={professional?.calendar_color ?? '#0EA5E9'}
              title="Cor na agenda"
              className="w-full"
            />
          </Field>
        </>
      ),
    },
    {
      title: 'Contato e vínculo',
      description: 'Canais e unidades de atuação.',
      columns: 'sm:grid-cols-3',
      fields: (
        <>
          <Field label="Telefone" htmlFor="phone">
            <Input
              id="phone"
              name="phone"
              inputMode="tel"
              defaultValue={professional?.phone ?? ''}
            />
          </Field>
          <Field label="E-mail" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={professional?.email ?? ''}
            />
          </Field>
          {canLinkUser ? (
            <Field
              label="Usuário vinculado (UUID)"
              htmlFor="userId"
              hint="Opcional: vincula o profissional a um usuário da clínica."
            >
              <Input
                id="userId"
                name="userId"
                defaultValue={professional?.user_id ?? ''}
                placeholder="00000000-0000-4000-8000-000000000000"
              />
            </Field>
          ) : null}
          <Field label="Observações" htmlFor="notes" className="sm:col-span-3">
            <Input
              id="notes"
              name="notes"
              defaultValue={professional?.notes ?? ''}
            />
          </Field>
        </>
      ),
    },
  ];

  return (
    <form action={formAction} className="space-y-5">
      {mode === 'edit' && professional ? (
        <input
          type="hidden"
          name="professionalId"
          value={professional.id}
        />
      ) : null}

      {state.error ? (
        <div
          className="rounded-xl border border-red-200 bg-danger-soft/60 px-4 py-3 text-xs font-medium text-red-700"
          role="alert"
        >
          {state.error}
        </div>
      ) : null}
      {state.success ? (
        <div
          className="rounded-xl border border-emerald-200 bg-success-soft/60 px-4 py-3 text-xs font-medium text-emerald-700"
          role="status"
        >
          {state.success}
        </div>
      ) : null}

      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader title={section.title} description={section.description} />
          <CardBody className={cn('grid gap-4', section.columns)}>
            {section.fields}
          </CardBody>
        </Card>
      ))}

      {modules && modules.length > 0 ? (
        <Card>
          <CardHeader
            title="Módulos"
            description="Habilitar permissão"
          />
          <CardBody className="grid gap-2 sm:grid-cols-2">
            {modules.map((module) => (
              <label
                key={module.key}
                className="flex items-center gap-2 rounded-xl border border-line bg-sky-25 px-3 py-2.5 text-xs text-ink-700"
              >
                <input
                  type="checkbox"
                  name="modules"
                  value={module.key}
                  className="h-4 w-4 rounded border-[#737373] text-navy-900 accent-navy-900"
                />
                {module.name}
              </label>
            ))}
            <div className="sm:col-span-2 mt-2 grid gap-3 border-t border-line pt-3 sm:grid-cols-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400 sm:col-span-2">
                Acesso ao sistema
              </p>
              <Field label="E-mail de acesso" htmlFor="accessEmail" hint="Preenchido automaticamente a partir do e-mail de contato.">
                <Input
                  id="accessEmail"
                  name="accessEmail"
                  type="email"
                  defaultValue={professional?.email ?? ''}
                  placeholder="acesso@clinica.com"
                />
              </Field>
              <Field label="Senha de acesso (8 a 25 caracteres)" htmlFor="accessPassword">
                <div className="flex gap-2">
                  <Input
                    id="accessPassword"
                    name="accessPassword"
                    type="text"
                    minLength={8}
                    maxLength={25}
                    placeholder="Senha de acesso"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
                      let pwd = '';
                      const arr = new Uint32Array(12);
                      crypto.getRandomValues(arr);
                      for (let i = 0; i < 12; i++) pwd += chars[arr[i] % chars.length];
                      const el = document.getElementById('accessPassword') as HTMLInputElement | null;
                      if (el) el.value = pwd;
                    }}
                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-line bg-white px-3 text-xs font-semibold text-ink-700 transition hover:bg-sky-100"
                  >
                    Gerar
                  </button>
                </div>
              </Field>
            </div>
            <p className="sm:col-span-2 text-[10px] leading-relaxed text-ink-400">
              O acesso efetivo aos módulos é definido no nível da clínica
              (assinatura e módulos contratados). O usuário será criado com
              perfil de médico e vinculado às unidades selecionadas.
            </p>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="Unidades de atuação"
          description="Marque as unidades onde o profissional atende."
        />
        <CardBody className="grid gap-2 sm:grid-cols-2">
          {units.length === 0 ? (
            <p className="text-xs text-ink-500">
              Nenhuma unidade cadastrada.
            </p>
          ) : (
            units.map((unit) => (
              <label
                key={unit.id}
                className="flex items-center gap-2 rounded-xl border border-line bg-sky-25 px-3 py-2.5 text-xs text-ink-700"
              >
                <input
                  type="checkbox"
                  name="unitIds"
                  value={unit.id}
                  defaultChecked={professional?.unit_ids?.includes(unit.id)}
                  className="h-4 w-4 rounded border-[#737373] text-navy-900 accent-navy-900"
                />
                {unit.name}
              </label>
            ))
          )}
        </CardBody>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" disabled={pending} size="md">
          {pending ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2} />
              Salvando…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" strokeWidth={2} />
              {mode === 'create' ? 'Cadastrar profissional' : 'Salvar alterações'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
