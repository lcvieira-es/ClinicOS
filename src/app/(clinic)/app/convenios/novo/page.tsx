import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { listInsuranceProviders } from '@/lib/clinic/convenios';
import { listPatientOptions } from '@/lib/clinic/patients';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { createClaimAction } from '@/lib/clinic/actions/convenios';

export const metadata = { title: 'Nova guia' };

export default async function NewGuiaPage() {
  const access = await requireModule('convenios');
  if (!access.allowed || !access.permissions.has('convenios:create')) {
    return <AccessRestricted homeHref="/app/convenios" homeLabel="Voltar" />;
  }

  const user = access.user;
  const [providers, patients] = await Promise.all([
    listInsuranceProviders(user.id, user.activeClinicId),
    listPatientOptions(user.id, user.activeClinicId),
  ]);

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Gestão"
        title="Nova guia"
        description="Registre uma guia de convênio."
        actions={
          <ButtonLink href="/app/convenios" variant="outline" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </ButtonLink>
        }
      />
      <Card>
        <CardBody>
          <form action={createClaimAction} className="space-y-4">
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
              <Field label="Operadora *" htmlFor="providerId">
                <Select id="providerId" name="providerId" required defaultValue="">
                  <option value="" disabled>
                    Selecione…
                  </option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Número da guia *" htmlFor="guideNumber">
                <Input id="guideNumber" name="guideNumber" required />
              </Field>
              <Field label="Código TUSS" htmlFor="tussCode">
                <Input id="tussCode" name="tussCode" />
              </Field>
              <Field label="Procedimento" htmlFor="procedureName" className="sm:col-span-2">
                <Input id="procedureName" name="procedureName" />
              </Field>
              <Field label="Valor apresentado (R$) *" htmlFor="presentedAmount">
                <Input id="presentedAmount" name="presentedAmount" inputMode="decimal" required placeholder="350,00" />
              </Field>
              <Field label="Observações" htmlFor="notes" className="sm:col-span-2">
                <Input id="notes" name="notes" />
              </Field>
            </div>
            <div className="flex items-center justify-end">
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 text-sm font-semibold text-white transition hover:bg-navy-800"
              >
                Criar guia
              </button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
