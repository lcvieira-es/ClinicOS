import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { getClinicSubscriptionInfo } from '@/lib/clinic/assinatura';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableShell, Td, Th } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/format';

export const metadata = { title: 'Assinatura' };

export default async function AssinaturaPage() {
  const access = await requireModule('assinatura');
  if (!access.allowed) {
    return <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />;
  }

  const user = access.user;
  const info = await getClinicSubscriptionInfo(user.id, user.activeClinicId);

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Sistema"
        title="Assinatura"
        description="Plano, módulos liberados, limites e faturas."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card>
          <CardHeader title="Plano atual" />
          <CardBody className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge tone="navy">{info.planName ?? 'Sem plano'}</Badge>
              {info.status ? <StatusBadge status={info.status} /> : null}
            </div>
            <dl className="grid gap-2 text-[16px]">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-400">Periodicidade</dt>
                <dd className="font-semibold text-ink-700">{info.periodicity ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-400">Valor</dt>
                <dd className="font-semibold text-ink-700">
                  {info.price ? formatCurrency(info.price) : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-400">Período atual</dt>
                <dd className="font-semibold text-ink-700">
                  {info.currentPeriodStart && info.currentPeriodEnd
                    ? `${formatDate(info.currentPeriodStart)} a ${formatDate(info.currentPeriodEnd)}`
                    : '—'}
                </dd>
              </div>
            </dl>
            <div className="border-t border-line pt-3">
              <p className="mb-2 text-[15px] font-bold uppercase tracking-wide text-ink-400">
                Limites contratados
              </p>
              <ul className="space-y-1 text-[16px] text-ink-600">
                <li>Usuários: {info.limits.userLimit}</li>
                <li>Profissionais: {info.limits.professionalLimit}</li>
                <li>Unidades: {info.limits.unitLimit}</li>
                <li>Pacientes: {info.limits.patientLimit}</li>
              </ul>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Módulos liberados" description={`${info.modules.length} módulo(s)`} />
          <CardBody>
            {info.modules.length === 0 ? (
              <p className="text-xl text-ink-500">Nenhum módulo liberado.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {info.modules.map((module) => (
                  <Badge key={module.key} tone="neutral">
                    {module.name}
                  </Badge>
                ))}
              </div>
            )}
            <p className="mt-4 text-[15px] leading-relaxed text-ink-400">
              Para alterar o plano ou contratar módulos adicionais, contate o
              administrador da plataforma.
            </p>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader title="Faturas" description={`${info.invoices.length} fatura(s)`} />
        <CardBody className="p-0">
          {info.invoices.length === 0 ? (
            <EmptyState
              title="Nenhuma fatura encontrada"
              description="As faturas aparecerão aqui conforme a cobrança."
              className="py-8"
            />
          ) : (
            <TableShell>
              <Table>
                <thead>
                  <tr>
                    <Th>Vencimento</Th>
                    <Th>Valor</Th>
                    <Th>Status</Th>
                    <Th className="hidden sm:table-cell">Pago em</Th>
                  </tr>
                </thead>
                <tbody>
                  {info.invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <Td>{formatDate(invoice.due_date)}</Td>
                      <Td className="font-semibold text-navy-900">
                        {formatCurrency(invoice.amount)}
                      </Td>
                      <Td>
                        <StatusBadge status={invoice.status} />
                      </Td>
                      <Td className="hidden sm:table-cell">
                        {invoice.paid_at ? formatDate(invoice.paid_at) : '—'}
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
