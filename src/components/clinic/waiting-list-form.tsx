'use client';

import { useActionState } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import { addToWaitingListAction } from '@/lib/clinic/actions/agenda';
import type { ClinicFormState } from '@/lib/clinic/form-state';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/input';

interface Option {
  id: string;
  name: string;
}

export function WaitingListForm({
  patients,
  professionals,
  units,
}: {
  patients: Option[];
  professionals: Option[];
  units: Option[];
}) {
  const [state, formAction, pending] = useActionState<ClinicFormState, FormData>(
    addToWaitingListAction,
    {},
  );

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
        <Field label="Paciente *" htmlFor="patientId">
          <Select id="patientId" name="patientId" required defaultValue="">
            <option value="" disabled>
              Selecione…
            </option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Unidade *" htmlFor="unitId">
          <Select id="unitId" name="unitId" required defaultValue="">
            <option value="" disabled>
              Selecione…
            </option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Profissional" htmlFor="professionalId">
          <Select id="professionalId" name="professionalId" defaultValue="">
            <option value="">Qualquer</option>
            {professionals.map((professional) => (
              <option key={professional.id} value={professional.id}>
                {professional.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Prioridade" htmlFor="priority">
          <Select id="priority" name="priority" defaultValue="3">
            <option value="1">1 — Urgente</option>
            <option value="2">2 — Alta</option>
            <option value="3">3 — Normal</option>
            <option value="4">4 — Baixa</option>
            <option value="5">5 — Flexível</option>
          </Select>
        </Field>
        <Field label="Data inicial:" htmlFor="desiredFrom">
          <Input id="desiredFrom" name="desiredFrom" type="datetime-local" />
        </Field>
        <Field label="Data final:" htmlFor="desiredTo">
          <Input id="desiredTo" name="desiredTo" type="datetime-local" />
        </Field>
        <Field label="Observações" htmlFor="notes" className="sm:col-span-2">
          <Input id="notes" name="notes" placeholder="Preferência de horário…" />
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
              Adicionar à lista
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
