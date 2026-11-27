import Link from 'next/link';
import { Plus, FlaskConical } from 'lucide-react';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { listExamOrders } from '@/lib/clinic/exames';
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

export const metadata = { title: 'Exames' };

export default async function ExamesPage({
  searchParams,
}: {
  searchParams: Promise<{ paciente?: string; msg?: string; erro?: string }>;
}) {
  const access = await requireModule('exames');
  if (!access.allowed) {
    return <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />;
  }

  const sp = await searchParams;
  const user = access.user;
  const canCreate = access.permissions.has('exames:create');

  const [orders, patients] = await Promise.all([
    listExamOrders(user.id, user.activeClinicId, sp.paciente || undefined),
    listPatientOptions(user.id, user.activeClinicId),
  ]);

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Clínico"
        title="Exames"
        description="Solicitações e resultados de exames."
        actions={
          canCreate ? (
            <ButtonLink href="/app/exames/novo" size="md">
              <Plus className="h-4 w-4" />
              Nova solicitação
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
          <form method="get" action="/app/exames" className="flex flex-wrap items-center gap-2">
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
        <CardHeader title="Solicitações" description={`${orders.length} registro(s)`} />
        <CardBody className="p-0">
          {orders.length === 0 ? (
            <EmptyState
              icon={FlaskConical}
              title="Nenhuma solicitação encontrada"
              description="Crie uma nova solicitação de exames."
              action={
                canCreate ? (
                  <ButtonLink href="/app/exames/novo" size="sm">
                    <Plus className="h-3.5 w-3.5" />
                    Nova solicitação
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
                    <Th>Prioridade</Th>
                    <Th className="text-[16px]">Status</Th>
                    <Th className="hidden sm:table-cell text-[16px]">Itens</Th>
                    <Th className="text-right text-[16px]">Ação</Th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <Td>{formatDateTime(order.order_date)}</Td>
                      <Td>
                        <p className="text-xs font-bold text-ink-900">
                          {order.patient_name}
                        </p>
                      </Td>
                      <Td className="hidden md:table-cell">
                        <span className="text-xs text-ink-600">
                          {order.professional_name}
                        </span>
                      </Td>
                      <Td className="capitalize text-xs">{order.priority}</Td>
                      <Td>
                        <StatusBadge status={order.status} />
                      </Td>
                      <Td className="hidden sm:table-cell">
                        <Badge tone="neutral">{order.items.length}</Badge>
                      </Td>
                      <Td className="text-right">
                        <Link
                          href={`/app/exames/${order.id}`}
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
