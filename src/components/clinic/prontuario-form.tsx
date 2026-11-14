'use client';

import { useActionState } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import {
  createMedicalRecordAction,
  updateMedicalRecordAction,
} from '@/lib/clinic/actions/prontuarios';
import type { ClinicFormState } from '@/lib/clinic/form-state';
import type { MedicalRecordDetail } from '@/lib/clinic/prontuarios';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/input';

interface Option {
  id: string;
  name: string;
}

export function ProntuarioForm({
  mode,
  record,
  patients,
  professionals,
  appointments,
}: {
  mode: 'create' | 'edit';
  record?: MedicalRecordDetail;
  patients: Option[];
  professionals: Option[];
  appointments: Option[];
}) {
  const action =
    mode === 'create' ? createMedicalRecordAction : updateMedicalRecordAction;
  const [state, formAction, pending] = useActionState<ClinicFormState, FormData>(
    action,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      {mode === 'edit' && record ? (
        <input type="hidden" name="recordId" value={record.id} />
      ) : null}

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
        <CardHeader title="Identificação" description="Paciente, profissional e data." />
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Paciente *" htmlFor="patientId">
            <Select
              id="patientId"
              name="patientId"
              required
              defaultValue={record?.patient_id ?? ''}
              className="w-full"
            >
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
              defaultValue={record?.professional_id ?? ''}
              className="w-full"
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
            <Select
              id="appointmentId"
              name="appointmentId"
              defaultValue={record?.appointment_id ?? ''}
              className="w-full"
            >
              <option value="">Nenhuma</option>
              {appointments.map((appointment) => (
                <option key={appointment.id} value={appointment.id}>
                  {appointment.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Data do registro" htmlFor="recordDate">
            <Input
              id="recordDate"
              name="recordDate"
              type="datetime-local"
              defaultValue={record?.record_date ? record.record_date.slice(0, 16) : ''}
              className="w-full"
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Anamnese" description="Queixa, histórico e exame." />
        <CardBody className="grid gap-4 sm:grid-cols-3">
          <Field label="Queixa principal" htmlFor="chiefComplaint">
            <Textarea
              id="chiefComplaint"
              name="chiefComplaint"
              defaultValue={record?.chief_complaint ?? ''}
              className="h-[7.5rem] w-full"
            />
          </Field>
          <Field label="História da doença atual" htmlFor="historyPresentIllness">
            <Textarea
              id="historyPresentIllness"
              name="historyPresentIllness"
              defaultValue={record?.history_present_illness ?? ''}
              className="h-[7.5rem] w-full"
            />
          </Field>
          <Field label="Exame físico" htmlFor="physicalExam">
            <Textarea
              id="physicalExam"
              name="physicalExam"
              defaultValue={record?.physical_exam ?? ''}
              className="h-[7.5rem] w-full"
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Avaliação e plano" description="Diagnóstico e conduta." />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Avaliação / diagnóstico" htmlFor="assessment">
            <Textarea
              id="assessment"
              name="assessment"
              defaultValue={record?.assessment ?? ''}
              className="h-[7.5rem] w-full"
            />
          </Field>
          <Field label="Plano / conduta" htmlFor="plan">
            <Textarea
              id="plan"
              name="plan"
              defaultValue={record?.plan ?? ''}
              className="h-[7.5rem] w-full"
            />
          </Field>
          <Field
            label="Códigos CID-10"
            htmlFor="icd10Codes"
            hint="Separe por vírgula ou espaço."
            className="sm:col-span-2"
          >
            <Textarea
              id="icd10Codes"
              name="icd10Codes"
              defaultValue={(record?.icd10_codes ?? []).join(', ')}
              placeholder="J06.9, R05"
              className="h-10 w-[50%]"
            />
          </Field>
          <Field label="Observações" htmlFor="notes" className="sm:col-span-2">
            <Textarea id="notes" name="notes" defaultValue={record?.notes ?? ''} className="h-10 w-[50%]" />
          </Field>
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
              {mode === 'create' ? 'Criar rascunho' : 'Salvar alterações'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
