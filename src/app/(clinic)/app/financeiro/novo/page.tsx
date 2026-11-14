import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { listFinancialCategories } from '@/lib/clinic/financeiro';
import { listPatientOptions } from '@/lib/clinic/patients';
import { listProfessionals } from '@/lib/clinic/professionals';
import { listUnits } from '@/lib/clinic/units';
import { createTransactionAction } from '@/lib/clinic/actions/financeiro';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';

export const metadata = { title: 'Novo lançamento' };

export default async function NewTransactionPage() {
  const access = await requireModule('financeiro');
  if (!access.allowed || !access.permissions.has('financeiro:create')) {
    return <AccessRestricted homeHref="/app/financeiro" homeLabel="Voltar" />;
  }

  const user = access.user;
  const [categories, patients, professionals, units] = await Promise.all([
    listFinancialCategories(user.id, user.activeClinicId),
    listPatientOptions(user.id, user.activeClinicId),
    listProfessionals(user.id, user.activeClinicId),
    listUnits(user.id, user.activeClinicId),
  ]);

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Gestão"
        title="Novo lançamento"
        description="Registre uma receita ou despesa."
        actions={
          <ButtonLink href="/app/financeiro" variant="outline" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </ButtonLink>
        }
      />
      <Card>
        <CardBody>
          <form action={createTransactionAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tipo *" htmlFor="type">
                <Select id="type" name="type" required defaultValue="receita">
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                </Select>
              </Field>
              <Field label="Categoria" htmlFor="categoryId">
                <Select id="categoryId" name="categoryId" defaultValue="">
                  <option value="">Sem categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Descrição *" htmlFor="description" className="sm:col-span-2">
                <Input id="description" name="description" required minLength={2} />
              </Field>
              <Field label="Valor (R$) *" htmlFor="amount">
                <Input id="amount" name="amount" inputMode="decimal" required placeholder="350,00" />
              </Field>
              <Field label="Vencimento *" htmlFor="dueDate">
                <Input id="dueDate" name="dueDate" type="date" required />
              </Field>
              <Field label="Forma de pagamento" htmlFor="paymentMethod">
                <Select id="paymentMethod" name="paymentMethod" defaultValue="">
                  <option value="">—</option>
                  <option value="pix">Pix</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao_credito">Cartão de crédito</option>
                  <option value="cartao_debito">Cartão de débito</option>
                  <option value="boleto">Boleto</option>
                  <option value="convenio">Convênio</option>
                  <option value="transferencia">Transferência</option>
                  <option value="outro">Outro</option>
                </Select>
              </Field>
              <Field label="Paciente" htmlFor="patientId">
                <Select id="patientId" name="patientId" defaultValue="">
                  <option value="">—</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Profissional" htmlFor="professionalId">
                <Select id="professionalId" name="professionalId" defaultValue="">
                  <option value="">—</option>
                  {professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      {professional.full_name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Unidade" htmlFor="unitId">
                <Select id="unitId" name="unitId" defaultValue="">
                  <option value="">—</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </Select>
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
                Criar lançamento
              </button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
