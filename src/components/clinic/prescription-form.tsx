'use client';

import { useActionState, useState } from 'react';
import { LoaderCircle, Plus, Trash2, Save } from 'lucide-react';
import { createPrescriptionAction } from '@/lib/clinic/actions/prescricoes';
import type { ClinicFormState } from '@/lib/clinic/form-state';
import type { MedicationItem } from '@/lib/clinic/prescricoes';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/input';

interface Option {
  id: string;
  name: string;
}

interface Item {
  medicationName: string;
  dose: string;
  frequency: string;
  duration: string;
  route: string;
  quantity: string;
  instructions: string;
}

export function PrescriptionForm({
  patients,
  professionals,
  appointments,
  medications,
}: {
  patients: Option[];
  professionals: Option[];
  appointments: Option[];
  medications: MedicationItem[];
}) {
  const [state, formAction, pending] = useActionState<ClinicFormState, FormData>(
    createPrescriptionAction,
    {},
  );

  const [items, setItems] = useState<Item[]>([
    { medicationName: '', dose: '', frequency: '', duration: '', route: '', quantity: '', instructions: '' },
  ]);

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { medicationName: '', dose: '', frequency: '', duration: '', route: '', quantity: '', instructions: '' },
    ]);

  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const updateItem = (index: number, field: keyof Item, value: string) =>
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );

  return (
    <form action={formAction} className="space-y-5">
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

      <Card>
        <CardHeader title="Identificação" description="Paciente, profissional e tipo." />
        <CardBody className="grid gap-4 sm:grid-cols-2">
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
          <Field label="Profissional *" htmlFor="professionalId">
            <Select
              id="professionalId"
              name="professionalId"
              required
              defaultValue=""
            >
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
          <Field label="Consulta vinculada" htmlFor="appointmentId">
            <Select id="appointmentId" name="appointmentId" defaultValue="">
              <option value="">Nenhuma</option>
              {appointments.map((appointment) => (
                <option key={appointment.id} value={appointment.id}>
                  {appointment.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tipo" htmlFor="type">
            <Select id="type" name="type" defaultValue="simples">
              <option value="simples">Simples</option>
              <option value="controle_especial">Controle especial</option>
              <option value="antimicrobiano">Antimicrobiano</option>
              <option value="notificacao_a">Notificação A</option>
            </Select>
          </Field>
          <Field label="Observações" htmlFor="notes" className="sm:col-span-2">
            <Input id="notes" name="notes" placeholder="Orientações gerais…" />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Medicamentos"
          description="Itens da receita."
          action={
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1 rounded-lg bg-navy-900 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-navy-800"
            >
              <Plus className="h-3 w-3" />
              Adicionar
            </button>
          }
        />
        <CardBody className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="space-y-3 rounded-xl border border-line bg-sky-25 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-ink-700">
                  Item {index + 1}
                </p>
                {items.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 transition hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remover
                  </button>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Medicamento *" htmlFor={`medicationName-${index}`}>
                  <input
                    list="medication-list"
                    name="medicationName"
                    required
                    value={item.medicationName}
                    onChange={(e) => updateItem(index, 'medicationName', e.target.value)}
                    placeholder="Nome do medicamento"
                    className="h-9 w-full rounded-xl border border-[#737373] bg-white px-3 text-xs outline-none transition focus:border-navy-600"
                  />
                </Field>
                <Field label="Dose" htmlFor={`dose-${index}`}>
                  <Input
                    name="dose"
                    value={item.dose}
                    onChange={(e) => updateItem(index, 'dose', e.target.value)}
                    placeholder="500 mg"
                  />
                </Field>
                <Field label="Frequência" htmlFor={`frequency-${index}`}>
                  <Input
                    name="frequency"
                    value={item.frequency}
                    onChange={(e) => updateItem(index, 'frequency', e.target.value)}
                    placeholder="8/8h"
                  />
                </Field>
                <Field label="Duração" htmlFor={`duration-${index}`}>
                  <Input
                    name="duration"
                    value={item.duration}
                    onChange={(e) => updateItem(index, 'duration', e.target.value)}
                    placeholder="7 dias"
                  />
                </Field>
                <Field label="Via" htmlFor={`route-${index}`}>
                  <Input
                    name="route"
                    value={item.route}
                    onChange={(e) => updateItem(index, 'route', e.target.value)}
                    placeholder="Oral"
                  />
                </Field>
                <Field label="Quantidade" htmlFor={`quantity-${index}`}>
                  <Input
                    name="quantity"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    placeholder="21"
                  />
                </Field>
                <Field label="Instruções" htmlFor={`instructions-${index}`} className="sm:col-span-2">
                  <Input
                    name="instructions"
                    value={item.instructions}
                    onChange={(e) => updateItem(index, 'instructions', e.target.value)}
                    placeholder="Tomar após as refeições"
                  />
                </Field>
              </div>
            </div>
          ))}
          <datalist id="medication-list">
            {medications.map((medication) => (
              <option key={medication.id} value={medication.name} />
            ))}
          </datalist>
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
              Criar prescrição
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
