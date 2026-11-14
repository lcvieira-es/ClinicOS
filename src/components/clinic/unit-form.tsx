'use client';

import { useActionState, type ReactNode } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import { createUnitAction, updateUnitAction } from '@/lib/clinic/actions/units';
import type { ClinicFormState } from '@/lib/clinic/form-state';
import type { UnitDetail } from '@/lib/clinic/units';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/input';

export function UnitForm({
  mode,
  unit,
}: {
  mode: 'create' | 'edit';
  unit?: UnitDetail;
}) {
  const action = mode === 'create' ? createUnitAction : updateUnitAction;
  const [state, formAction, pending] = useActionState<ClinicFormState, FormData>(
    action,
    {},
  );

  const sections: Array<{ title: string; description: string; fields: ReactNode }> = [
    {
      title: 'Identificação',
      description: 'Dados da unidade e do responsável.',
      fields: (
        <>
          <Field label="Nome *" htmlFor="name">
            <Input
              id="name"
              name="name"
              required
              minLength={2}
              defaultValue={unit?.name ?? ''}
              placeholder="Unidade Paulista"
            />
          </Field>
          <Field label="Tipo *" htmlFor="type">
            <Select id="type" name="type" defaultValue={unit?.type ?? 'filial'}>
              <option value="matriz">Matriz</option>
              <option value="filial">Filial</option>
              <option value="consultorio">Consultório</option>
            </Select>
          </Field>
          <Field label="Código interno" htmlFor="internalCode">
            <Input
              id="internalCode"
              name="internalCode"
              defaultValue={unit?.internal_code ?? ''}
              placeholder="MATRIZ-01"
            />
          </Field>
          <Field label="Responsável" htmlFor="managerName">
            <Input
              id="managerName"
              name="managerName"
              defaultValue={unit?.manager_name ?? ''}
            />
          </Field>
          <Field label="Horário de funcionamento" htmlFor="openingHours" className="sm:col-span-2">
            <Input
              id="openingHours"
              name="openingHours"
              defaultValue={unit?.opening_hours ?? ''}
              placeholder="Segunda a sexta, 08h às 19h"
            />
          </Field>
          <label className="flex items-center gap-2 text-xs text-ink-600 sm:col-span-2">
            <input
              type="checkbox"
              name="isHeadquarters"
              value="on"
              defaultChecked={unit?.is_headquarters ?? false}
              className="h-4 w-4 rounded border-[#737373] text-navy-900 accent-navy-900"
            />
            Esta é a unidade matriz (sede) da clínica.
          </label>
        </>
      ),
    },
    {
      title: 'Contato e endereço',
      description: 'Localização e canais da unidade.',
      fields: (
        <>
          <Field label="Telefone" htmlFor="phone">
            <Input
              id="phone"
              name="phone"
              inputMode="tel"
              defaultValue={unit?.phone ?? ''}
            />
          </Field>
          <Field label="E-mail" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={unit?.email ?? ''}
            />
          </Field>
          <Field label="CEP" htmlFor="cep">
            <Input id="cep" name="cep" defaultValue={unit?.cep ?? ''} />
          </Field>
          <Field label="Logradouro" htmlFor="address" className="sm:col-span-2">
            <Input
              id="address"
              name="address"
              defaultValue={unit?.address ?? ''}
            />
          </Field>
          <Field label="Número" htmlFor="addressNumber">
            <Input
              id="addressNumber"
              name="addressNumber"
              defaultValue={unit?.address_number ?? ''}
            />
          </Field>
          <Field label="Complemento" htmlFor="complement">
            <Input
              id="complement"
              name="complement"
              defaultValue={unit?.complement ?? ''}
            />
          </Field>
          <Field label="Bairro" htmlFor="neighborhood">
            <Input
              id="neighborhood"
              name="neighborhood"
              defaultValue={unit?.neighborhood ?? ''}
            />
          </Field>
          <Field label="Cidade" htmlFor="city">
            <Input id="city" name="city" defaultValue={unit?.city ?? ''} />
          </Field>
          <Field label="UF" htmlFor="state">
            <Input
              id="state"
              name="state"
              maxLength={2}
              defaultValue={unit?.state ?? ''}
              placeholder="SP"
              className="uppercase"
            />
          </Field>
        </>
      ),
    },
  ];

  return (
    <form action={formAction} className="space-y-5">
      {mode === 'edit' && unit ? (
        <input type="hidden" name="unitId" value={unit.id} />
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
          <CardBody className="grid gap-4 sm:grid-cols-2">
            {section.fields}
          </CardBody>
        </Card>
      ))}

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
              {mode === 'create' ? 'Cadastrar unidade' : 'Salvar alterações'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
