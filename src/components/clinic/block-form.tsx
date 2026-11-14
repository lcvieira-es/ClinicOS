'use client';

import { useActionState } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import { createBlockAction } from '@/lib/clinic/actions/agenda';
import type { ClinicFormState } from '@/lib/clinic/form-state';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/input';

interface Option {
  id: string;
  name: string;
}

export function BlockForm({
  professionals,
  units,
}: {
  professionals: Option[];
  units: Option[];
}) {
  const [state, formAction, pending] = useActionState<ClinicFormState, FormData>(
    createBlockAction,
    {},
  );

  const now = new Date();
  const isoLocal = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}T${h}:${min}`;
  };
  const startDefault = isoLocal(now);
  const endDefault = isoLocal(new Date(now.getTime() + 60 * 60_000));

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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Profissional *" htmlFor="professionalId">
          <Select id="professionalId" name="professionalId" required defaultValue="">
            <option value="" disabled>
              Selecione…
            </option>
            {professionals.map((professional) => (
              <option key={professional.id} value={professional.id}>
                {professional.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Unidade" htmlFor="unitId">
          <Select id="unitId" name="unitId" defaultValue="">
            <option value="">Todas</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Início *" htmlFor="start">
          <Input id="start" name="start" type="datetime-local" required defaultValue={startDefault} />
        </Field>
        <Field label="Fim *" htmlFor="end">
          <Input id="end" name="end" type="datetime-local" required defaultValue={endDefault} />
        </Field>
        <Field label="Motivo" htmlFor="reason" className="sm:col-span-2">
          <Input id="reason" name="reason" placeholder="Reunião, férias, folga…" />
        </Field>
      </div>

      <div className="flex items-center justify-end">
        <Button type="submit" disabled={pending} size="md">
          {pending ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2} />
              Salvando…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" strokeWidth={2} />
              Criar bloqueio
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
