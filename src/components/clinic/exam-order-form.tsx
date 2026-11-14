'use client';

import { useActionState, useState } from 'react';
import { LoaderCircle, Plus, Trash2, Save } from 'lucide-react';
import { createExamOrderAction } from '@/lib/clinic/actions/exames';
import type { ClinicFormState } from '@/lib/clinic/form-state';
import type { ExamCatalogItem } from '@/lib/clinic/exames';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/input';

interface Option {
  id: string;
  name: string;
}

export function ExamOrderForm({
  patients,
  professionals,
  appointments,
  catalog,
}: {
  patients: Option[];
  professionals: Option[];
  appointments: Option[];
  catalog: ExamCatalogItem[];
}) {
  const [state, formAction, pending] = useActionState<ClinicFormState, FormData>(
    createExamOrderAction,
    {},
  );

  const [items, setItems] = useState<string[]>(['']);

  const addItem = () => setItems((prev) => [...prev, '']);
  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));
  const updateItem = (index: number, value: string) =>
    setItems((prev) => prev.map((v, i) => (i === index ? value : v)));

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
        <CardHeader title="Solicitação" description="Paciente, profissional e prioridade." />
        <CardBody className="grid gap-4 sm:grid-cols-3">
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
          <Field label="Prioridade" htmlFor="priority">
            <Select id="priority" name="priority" defaultValue="rotina">
              <option value="rotina">Rotina</option>
              <option value="urgente">Urgente</option>
              <option value="emergencia">Emergência</option>
            </Select>
          </Field>
          <Field label="Laboratório" htmlFor="laboratory">
            <Input id="laboratory" name="laboratory" placeholder="Laboratório de apoio" />
          </Field>
          <Field label="Indicação clínica" htmlFor="clinicalIndication">
            <Input id="clinicalIndication" name="clinicalIndication" placeholder="Motivo da solicitação" />
          </Field>
          <Field label="Observações" htmlFor="notes" className="sm:col-span-3">
            <Input id="notes" name="notes" />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Exames"
          description="Itens da solicitação."
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
        <CardBody className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                list="exam-catalog"
                name="examName"
                required
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                placeholder="Nome do exame"
                className="h-9 flex-1 rounded-xl border border-[#737373] bg-white px-3 text-xs outline-none transition focus:border-navy-600"
              />
              <input
                name="tussCode"
                placeholder="TUSS"
                className="h-9 w-24 rounded-xl border border-[#737373] bg-white px-3 text-xs outline-none transition focus:border-navy-600"
              />
              {items.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 text-red-600 transition hover:bg-danger-soft"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          ))}
          <datalist id="exam-catalog">
            {catalog.map((exam) => (
              <option key={exam.id} value={exam.name} />
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
              Criar solicitação
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
