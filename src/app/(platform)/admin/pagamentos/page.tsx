import Link from 'next/link';
import {
  ArrowRight,
  Building,
  CircleCheck,
  CircleDollarSign,
  Clock,
  Search,
  Wallet,
} from 'lucide-react';
import { requirePlatformAdmin } from '@/lib/auth/guards';
import { getInvoiceSummary, listInvoices } from '@/lib/platform/admin-queries';
import { RegisterPaymentButton } from '@/components/platform/register-payment-button';
import { PageHeader } from '@/components/ui/page-header';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Card, CardBody } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, Select } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { StatCard } from '@/components/ui/stat-card';
import { Table, TableShell, Td, Th } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/format';

export const metadata = { title: 'Pagamentos' };

const PAGE_SIZE = 10;

export default async function PlatformPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; busca?: string; pagina?: string }>;
}) {
  const user = await requirePlatformAdmin();

  const params = await searchParams;
  const status = params.status ?? '';
  const busca = (params.busca ?? '').trim();
  const page = Math.max(1, Number(params.pagina ?? '1') || 1);

  const [summary, result] = await Promise.all([
    getInvoiceSummary(user.id),
    listInvoices(user.id, { status, search: busca, page, pageSize: PAGE_SIZE }),
  ]);

  const pageHref = (target: number) => {
    const query = new URLSearchParams();
    if (status) query.set('status', status);
    if (busca) query.set('busca', busca);
    if (target > 1) query.set('pagina', String(target));
    const suffix = query.toString();
    return `/admin/pagamentos${suffix ? `?${suffix}` : ''}`;
  };

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Administração da plataforma"
        title="Pagamentos"
        description="Faturas vigentes e em aberto, conciliação manual e contratos monitorados."
        actions={<Badge tone="navy">Conciliação manual</Badge>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Em aberto"
          value={summary.openTotal}
          hint={formatCurrency(summary.openAmount)}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Vencidas"
          value={summary.overdueTotal}
          hint={formatCurrency(summary.overdueAmount)}
          icon={CircleDollarSign}
          tone={summary.overdueTotal > 0 ? 'danger' : 'success'}
        />
        <StatCard
          label="Conciliadas no mês"
          value={summary.paidMonth}
          hint={formatCurrency(summary.paidMonthAmount)}
          icon={CircleCheck}
          tone="success"
        />
        <StatCard
          label="Conciliação"
          value="Manual"
          hint="Gateway: manual até integrar Asaas/Stripe"
          icon={Wallet}
          tone="info"
        />
      </div>

      <Card className="mt-4">
        <CardBody className="!p-4">
          <form method="get" action="/admin/pagamentos" className="grid gap-2 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" strokeWidth={1.9} />
              <Input
                name="busca"
                type="search"
                defaultValue={busca}
                placeholder="Buscar clínica…"
                className="pl-9"
                aria-label="Buscar fatura"
              />
            </div>
            <Select name="status" defaultValue={status} aria-label="Situação da fatura">
              <option value="">Todas as situações</option>
              <option value="aberta">Aberta</option>
              <option value="vencida">Vencida</option>
              <option value="paga">Paga</option>
              <option value="cancelada">Cancelada</option>
              <option value="reembolsada">Reembolsada</option>
            </Select>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 text-sm font-semibold text-white transition hover:bg-navy-800"
            >
              <Search className="h-4 w-4" strokeWidth={2} />
              Filtrar
            </button>
          </form>
        </CardBody>
      </Card>

      {result.items.length === 0 ? (
        <Card className="mt-4">
          <EmptyState
            icon={CircleDollarSign}
            title="Nenhuma fatura encontrada"
            description="As faturas aparecerão aqui após serem geradas. Gere a fatura do período na página da clínica."
            action={
              <Link
                href="/admin/assinaturas"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-navy-800 hover:text-navy-950"
              >
                Ver assinaturas
                <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="mt-4">
          <TableShell>
            <Table>
              <thead>
                <tr>
                  <Th>Clínica</Th>
                  <Th>Plano</Th>
                  <Th>Valor</Th>
                  <Th className="hidden sm:table-cell">Vencimento</Th>
                  <Th>Situação</Th>
                  <Th className="text-right">Ação</Th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((invoice) => {
                  const payable = invoice.status === 'aberta' || invoice.status === 'vencida';
                  return (
                    <tr key={invoice.id}>
                      <Td>
                        <Link
                          href={`/admin/clinicas/${invoice.clinic_id}`}
                          className="flex items-center gap-2 text-xs font-bold text-navy-900 hover:underline"
                        >
                          <Building className="h-3.5 w-3.5 text-ink-400" />
                          <span className="max-w-[180px] truncate">{invoice.clinic_name}</span>
                        </Link>
                      </Td>
                      <Td>
                        <Badge tone="neutral">{invoice.plan_name}</Badge>
                      </Td>
                      <Td className="font-semibold text-navy-900">
                        {formatCurrency(invoice.amount)}
                      </Td>
                      <Td className="hidden sm:table-cell">
                        <span className="text-xs text-ink-500">{formatDate(invoice.due_date)}</span>
                      </Td>
                      <Td>
                        <StatusBadge status={invoice.status} />
                      </Td>
                      <Td className="text-right">
                        {payable ? (
                          <RegisterPaymentButton invoiceId={invoice.id} compact />
                        ) : (
                          <span className="text-[10px] text-ink-400">
                            {invoice.paid_at ? `Pago em ${formatDate(invoice.paid_at)}` : '—'}
                          </span>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <Pagination page={result.page} pageSize={result.pageSize} total={result.total} href={pageHref} />
          </TableShell>
        </div>
      )}
    </div>
  );
}
