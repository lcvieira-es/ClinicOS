'use client';

import { useActionState, type ReactNode } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import {
  createPatientAction,
  updatePatientAction,
} from '@/lib/clinic/actions/patients';
import type { ClinicFormState } from '@/lib/clinic/form-state';
import type { PatientDetail } from '@/lib/clinic/patients';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/input';

interface Option {
  id: string;
  name: string;
}

export function PatientForm({
  mode,
  patient,
  units,
  insurances,
  canSeeSensitive,
}: {
  mode: 'create' | 'edit';
  patient?: PatientDetail;
  units: Option[];
  insurances: Option[];
  canSeeSensitive: boolean;
}) {
  const action = mode === 'create' ? createPatientAction : updatePatientAction;
  const [state, formAction, pending] = useActionState<ClinicFormState, FormData>(
    action,
    {},
  );

  const sections: Array<{ title: string; description: string; fields: ReactNode }> = [
    {
      title: 'Identificação',
      description: 'Dados civis do paciente.',
      fields: (
        <>
          <Field label="Nome completo *" htmlFor="fullName">
            <Input
              id="fullName"
              name="fullName"
              required
              minLength={3}
              defaultValue={patient?.full_name ?? ''}
              placeholder="Nome como consta no documento"
            />
          </Field>
          <Field
            label="Nome social"
            htmlFor="socialName"
            hint="Usado na comunicação com o paciente."
          >
            <Input
              id="socialName"
              name="socialName"
              defaultValue={patient?.social_name ?? ''}
            />
          </Field>
          <Field
            label={canSeeSensitive ? 'CPF' : 'CPF (somente leitura no seu perfil)'}
            htmlFor="cpf"
            hint={
              canSeeSensitive
                ? 'Somente dígitos. O mesmo CPF não pode se repetir na clínica.'
                : 'Seu perfil não visualiza dados sensíveis; o CPF atual é mantido.'
            }
          >
            <Input
              id="cpf"
              name="cpf"
              inputMode="numeric"
              maxLength={14}
              readOnly={!canSeeSensitive}
              defaultValue={patient?.cpf ?? ''}
              placeholder="000.000.000-00"
            />
          </Field>
          <Field label="Data de nascimento" htmlFor="birthDate">
            <Input
              id="birthDate"
              name="birthDate"
              type="date"
              defaultValue={patient?.birth_date ?? ''}
            />
          </Field>
          <Field label="Sexo *" htmlFor="sex">
            <Select id="sex" name="sex" defaultValue={patient?.sex ?? 'nao_informado'}>
              <option value="feminino">Feminino</option>
              <option value="masculino">Masculino</option>
              <option value="intersexo">Intersexo</option>
              <option value="nao_informado">Não informado</option>
            </Select>
          </Field>
          <Field label="Gênero" htmlFor="gender" hint="Como o paciente se identifica.">
            <Input
              id="gender"
              name="gender"
              defaultValue={patient?.gender ?? ''}
              placeholder="Opcional"
            />
          </Field>
        </>
      ),
    },
    {
      title: 'Contato',
      description: 'Canais de comunicação e endereço.',
      fields: (
        <>
          <Field label="E-mail" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={patient?.email ?? ''}
            />
          </Field>
          <Field label="Telefone" htmlFor="phone">
            <Input
              id="phone"
              name="phone"
              inputMode="tel"
              defaultValue={patient?.phone ?? ''}
              placeholder="(11) 90000-0000"
            />
          </Field>
          <Field label="WhatsApp" htmlFor="whatsapp">
            <Input
              id="whatsapp"
              name="whatsapp"
              inputMode="tel"
              defaultValue={patient?.whatsapp ?? ''}
            />
          </Field>
          <Field label="CEP" htmlFor="cep">
            <Input id="cep" name="cep" defaultValue={patient?.cep ?? ''} />
          </Field>
          <Field label="Logradouro" htmlFor="address" className="sm:col-span-2">
            <Input
              id="address"
              name="address"
              defaultValue={patient?.address ?? ''}
              placeholder="Rua, avenida…"
            />
          </Field>
          <Field label="Número" htmlFor="addressNumber">
            <Input
              id="addressNumber"
              name="addressNumber"
              defaultValue={patient?.address_number ?? ''}
            />
          </Field>
          <Field label="Complemento" htmlFor="complement">
            <Input
              id="complement"
              name="complement"
              defaultValue={patient?.complement ?? ''}
            />
          </Field>
          <Field label="Bairro" htmlFor="neighborhood">
            <Input
              id="neighborhood"
              name="neighborhood"
              defaultValue={patient?.neighborhood ?? ''}
            />
          </Field>
          <Field label="Cidade" htmlFor="city">
            <Input id="city" name="city" defaultValue={patient?.city ?? ''} />
          </Field>
          <Field label="UF" htmlFor="state">
            <Input
              id="state"
              name="state"
              maxLength={2}
              defaultValue={patient?.state ?? ''}
              placeholder="SP"
              className="uppercase"
            />
          </Field>
        </>
      ),
    },
    {
      title: 'Convênio e emergência',
      description: 'Operadora contratada e contato de emergência.',
      fields: (
        <>
          <Field label="Convênio" htmlFor="insuranceProviderId">
            <Select
              id="insuranceProviderId"
              name="insuranceProviderId"
              defaultValue={patient?.insurance_provider_id ?? ''}
            >
              <option value="">Particular / sem convênio</option>
              {insurances.map((insurance) => (
                <option key={insurance.id} value={insurance.id}>
                  {insurance.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Número da carteirinha" htmlFor="insuranceMemberNumber">
            <Input
              id="insuranceMemberNumber"
              name="insuranceMemberNumber"
              defaultValue={patient?.insurance_member_number ?? ''}
            />
          </Field>
          <Field label="Contato de emergência" htmlFor="emergencyContactName">
            <Input
              id="emergencyContactName"
              name="emergencyContactName"
              defaultValue={patient?.emergency_contact_name ?? ''}
            />
          </Field>
          <Field label="Telefone de emergência" htmlFor="emergencyContactPhone">
            <Input
              id="emergencyContactPhone"
              name="emergencyContactPhone"
              inputMode="tel"
              defaultValue={patient?.emergency_contact_phone ?? ''}
            />
          </Field>
          <Field label="Unidade preferencial" htmlFor="preferredUnitId">
            <Select
              id="preferredUnitId"
              name="preferredUnitId"
              defaultValue={patient?.preferred_unit_id ?? ''}
            >
              <option value="">Sem preferência</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Observações"
            htmlFor="notes"
            className="sm:col-span-2"
            hint="Nunca registre diagnóstico ou prescrição neste campo."
          >
            <Input
              id="notes"
              name="notes"
              defaultValue={patient?.notes ?? ''}
              placeholder="Alergias conhecidas, preferências de contato…"
            />
          </Field>
        </>
      ),
    },
  ];

  return (
    <form action={formAction} className="space-y-5">
      {mode === 'edit' && patient ? (
        <input type="hidden" name="patientId" value={patient.id} />
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

      {mode === 'create' ? (
        <Card>
          <CardHeader
            title="Consentimento LGPD"
            description="Evidência do tratamento de dados pessoais."
          />
          <CardBody className="space-y-3">
            <label className="flex items-start gap-3 rounded-xl border border-line bg-sky-25 px-4 py-3">
              <input
                type="checkbox"
                name="lgpdConsent"
                value="true"
                className="mt-0.5 h-4 w-4 rounded border-[#737373] text-navy-900 accent-navy-900"
              />
              <span className="text-xs leading-relaxed text-ink-600">
                O paciente (ou responsável legal) foi informado sobre o
                tratamento dos dados pessoais e autorizou o registro no prontuário
                administrativo desta clínica, conforme a LGPD.
              </span>
            </label>
            <p className="text-[11px] leading-relaxed text-ink-400">
              Sem esse aceite o cadastro é criado com consentimento pendente e
              poderá ser registrado depois na ficha do paciente.
            </p>
          </CardBody>
        </Card>
      ) : null}

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
              {mode === 'create' ? 'Cadastrar paciente' : 'Salvar alterações'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
