import Link from 'next/link';
import { Plus, Pill } from 'lucide-react';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { listPrescriptions } from '@/lib/clinic/prescricoes';
import { listPatientOptions } from '@/lib/clinic/patients';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/input';
import { Table, TableShell, Td, Th } from '@/components/ui/table';
import { Alert } from '@/components/ui/alert';
import { formatDateTime } from '@/lib/format';

export const metadata = { title: 'Prescrições' };

export default async function PrescricoesPage({
  searchParams,
}: {
  searchParams: Promise<{ paciente?: string; msg?: string; erro?: string }>;
}) {
  const access = await requireModule('prescricoes');
  if (!access.allowed) {
    return <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />;
  }

  const sp = await searchParams;
  const user = access.user;
  const canCreate = access.permissions.has('prescricoes:create');

  const [prescriptions, patients] = await Promise.all([
    listPrescriptions(user.id, user.activeClinicId, sp.paciente || undefined),
    listPatientOptions(user.id, user.activeClinicId),
  ]);

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Clínico"
        title="Prescrições"
        description="Receitas emitidas e assinadas."
        actions={
          canCreate ? (
            <ButtonLink href="/app/prescricoes/novo" size="md">
              <Plus className="h-4 w-4" />
              Nova prescrição
            </ButtonLink>
          ) : null
        }
      />

      {sp.erro ? (
        <Alert variant="danger" className="mb-4">
          {decodeURIComponent(sp.erro)}
        </Alert>
      ) : null}
      {sp.msg ? (
        <Alert variant="success" className="mb-4">
          {decodeURIComponent(sp.msg)}
        </Alert>
      ) : null}

      <Card className="mb-4">
        <CardBody className="!p-4">
          <form method="get" action="/app/prescricoes" className="flex flex-wrap items-center gap-2">
            <Select
              name="paciente"
              defaultValue={sp.paciente ?? ''}
              aria-label="Paciente"
              className="w-full min-w-[160px] sm:w-[40%]"
            >
              <option value="">Todos os pacientes</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </Select>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 text-xs font-semibold text-white transition hover:bg-navy-800"
            >
              Filtrar
            </button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Prescrições" description={`${prescriptions.length} registro(s)`} />
        <CardBody className="p-0">
          {prescriptions.length === 0 ? (
            <EmptyState
              icon={Pill}
              title="Nenhuma prescrição encontrada"
              description="Crie uma nova prescrição a partir de um paciente."
              action={
                canCreate ? (
                  <ButtonLink href="/app/prescricoes/novo" size="sm">
                    <Plus className="h-3.5 w-3.5" />
                    Nova prescrição
                  </ButtonLink>
                ) : undefined
              }
            />
          ) : (
            <TableShell>
              <Table>
                <thead>
                  <tr>
                    <Th>Data</Th>
                    <Th>Paciente</Th>
                    <Th className="hidden md:table-cell">Profissional</Th>
                    <Th>Tipo</Th>
                    <Th>Status</Th>
                    <Th className="hidden sm:table-cell">Itens</Th>
                    <Th className="text-right">Ação</Th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map((prescription) => (
                    <tr key={prescription.id}>
                      <Td>{formatDateTime(prescription.created_at)}</Td>
                      <Td>
                        <p className="text-xs font-bold text-ink-900">
                          {prescription.patient_name}
                        </p>
                      </Td>
                      <Td className="hidden md:table-cell">
                        <span className="text-xs text-ink-600">
                          {prescription.professional_name}
                        </span>
                      </Td>
                      <Td className="capitalize text-xs">{prescription.type}</Td>
                      <Td>
                        <StatusBadge status={prescription.status} />
                        {prescription.verification_code ? (
                          <p className="mt-0.5 font-mono text-[9px] text-ink-400">
                            {prescription.verification_code}
                          </p>
                        ) : null}
                      </Td>
                      <Td className="hidden sm:table-cell">
                        <Badge tone="neutral">{prescription.items.length}</Badge>
                      </Td>
                      <Td className="text-right">
                        <Link
                          href={`/app/prescricoes/${prescription.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-navy-800 transition hover:text-navy-950"
                        >
                          Abrir
                        </Link>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableShell>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
