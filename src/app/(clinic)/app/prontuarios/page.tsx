import Link from 'next/link';
import { Plus, FileText, ShieldCheck } from 'lucide-react';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { listMedicalRecords } from '@/lib/clinic/prontuarios';
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

export const metadata = { title: 'Prontuários' };

export default async function ProntuariosPage({
  searchParams,
}: {
  searchParams: Promise<{
    paciente?: string;
    msg?: string;
    erro?: string;
  }>;
}) {
  const access = await requireModule('prontuarios');
  if (!access.allowed) {
    return <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />;
  }

  const sp = await searchParams;
  const user = access.user;
  const canCreate = access.permissions.has('prontuarios:create');

  const [records, patients] = await Promise.all([
    listMedicalRecords(user.id, user.activeClinicId, sp.paciente || undefined),
    listPatientOptions(user.id, user.activeClinicId),
  ]);

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Clínico"
        title="Prontuários"
        description="Documentação clínica versionada e assinada."
        actions={
          canCreate ? (
            <ButtonLink href="/app/prontuarios/novo" size="md">
              <Plus className="h-4 w-4" />
              Novo prontuário
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
          <form method="get" action="/app/prontuarios" className="flex flex-wrap items-center gap-2">
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
        <CardHeader title="Registros" description={`${records.length} prontuário(s)`} />
        <CardBody className="p-0">
          {records.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nenhum prontuário encontrado"
              description="Crie um novo prontuário a partir de um paciente ou consulta."
              action={
                canCreate ? (
                  <ButtonLink href="/app/prontuarios/novo" size="sm">
                    <Plus className="h-3.5 w-3.5" />
                    Novo prontuário
                  </ButtonLink>
                ) : undefined
              }
            />
          ) : (
            <TableShell>
              <Table>
                <thead>
                  <tr>
                    <Th className="text-[16px]">Data</Th>
                    <Th className="text-[16px]">Paciente</Th>
                    <Th className="hidden md:table-cell text-[16px]">Profissional</Th>
                    <Th className="hidden lg:table-cell text-[16px]">Queixa principal</Th>
                    <Th className="text-[16px]">Versão</Th>
                    <Th className="text-[16px]">Status</Th>
                    <Th className="text-right text-[16px]">Ação</Th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <Td>{formatDateTime(record.record_date)}</Td>
                      <Td>
                        <p className="text-xs font-bold text-ink-900">
                          {record.patient_name}
                        </p>
                      </Td>
                      <Td className="hidden md:table-cell">
                        <span className="text-xs text-ink-600">
                          {record.professional_name}
                        </span>
                      </Td>
                      <Td className="hidden lg:table-cell">
                        <span className="text-xs text-ink-600">
                          {record.chief_complaint ?? '—'}
                        </span>
                      </Td>
                      <Td>
                        <Badge tone="neutral">v{record.version}</Badge>
                      </Td>
                      <Td>
                        <StatusBadge status={record.status} />
                        {record.verification_code ? (
                          <p className="mt-0.5 font-mono text-[9px] text-ink-400">
                            {record.verification_code}
                          </p>
                        ) : null}
                      </Td>
                      <Td className="text-right">
                        <Link
                          href={`/app/prontuarios/${record.id}`}
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
