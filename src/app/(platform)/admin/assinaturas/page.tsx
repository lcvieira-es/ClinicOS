import Link from 'next/link';
import {
  ArrowRight,
  FileBadge,
  Search,
  Wallet,
} from 'lucide-react';
import { requirePlatformAdmin } from '@/lib/auth/guards';
import { listSubscriptions } from '@/lib/platform/admin-queries';
import { RegisterPaymentButton } from '@/components/platform/register-payment-button';
import { PageHeader } from '@/components/ui/page-header';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, Select } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Table, TableShell, Td, Th } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/format';

export const metadata = { title: 'Assinaturas' };

const PAGE_SIZE = 10;

export default async function PlatformSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; status?: string; pagina?: string }>;
}) {
  const user = await requirePlatformAdmin();

  const params = await searchParams;
  const busca = (params.busca ?? '').trim();
  const status = params.status ?? '';
  const page = Math.max(1, Number(params.pagina ?? '1') || 1);

  const { items, total, pageSize } = await listSubscriptions(user.id, {
    search: busca,
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  const pageHref = (target: number) => {
    const query = new URLSearchParams();
    if (busca) query.set('busca', busca);
    if (status) query.set('status', status);
    if (target > 1) query.set('pagina', String(target));
    const suffix = query.toString();
    return `/admin/assinaturas${suffix ? `?${suffix}` : ''}`;
  };

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Administração da plataforma"
        title="Assinaturas"
        description="Contratos, situação, periodicidade, renovações e registro manual de pagamento."
        actions={
          <ButtonLink href="/admin/pagamentos" variant="outline" size="md">
            <Wallet className="h-4 w-4" />
            Ver pagamentos
          </ButtonLink>
        }
      />

      <Card className="mb-4">
        <CardBody className="!p-4">
          <form method="get" action="/admin/assinaturas" className="grid gap-2 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" strokeWidth={1.9} />
              <Input
                name="busca"
                type="search"
                defaultValue={busca}
                placeholder="Buscar clínica…"
                className="pl-9"
                aria-label="Buscar assinatura"
              />
            </div>
            <Select name="status" defaultValue={status} aria-label="Situação da assinatura">
              <option value="">Todas as situações</option>
              <option value="em_teste">Em teste</option>
              <option value="ativa">Ativa</option>
              <option value="inadimplente">Inadimplente</option>
              <option value="vencida">Vencida</option>
              <option value="suspensa">Suspensa</option>
              <option value="cancelada">Cancelada</option>
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

      {items.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileBadge}
            title="Nenhuma assinatura encontrada"
            description="Ajuste os filtros ou crie uma clínica para gerar a primeira assinatura."
            action={
              <ButtonLink href="/admin/clinicas/novo" size="sm">
                Nova clínica
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <TableShell>
          <Table>
            <thead>
              <tr>
                <Th>Clínica</Th>
                <Th>Plano</Th>
                <Th className="hidden md:table-cell">Valor / ciclo</Th>
                <Th className="hidden sm:table-cell">Fim do período</Th>
                <Th>Situação</Th>
                <Th className="text-right">Ação</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((subscription) => (
                <tr key={subscription.id}>
                  <Td>
                    <Link
                      href={`/admin/clinicas/${subscription.clinic_id}`}
                      className="text-xs font-bold text-navy-900 hover:underline"
                    >
                      {subscription.clinic_name}
                    </Link>
                  </Td>
                  <Td>
                    <Badge tone="neutral">{subscription.plan_name}</Badge>
                  </Td>
                  <Td className="hidden md:table-cell">
                    <span className="text-xs font-semibold text-ink-700">
                      {formatCurrency(subscription.price)}
                    </span>
                    <span className="ml-1 text-[10px] text-ink-400">
                      /{subscription.periodicity === 'anual' ? 'ano' : 'mês'}
                    </span>
                  </Td>
                  <Td className="hidden sm:table-cell">
                    <span className="text-xs text-ink-500">
                      {formatDate(subscription.current_period_end)}
                    </span>
                  </Td>
                  <Td>
                    <StatusBadge status={subscription.status} />
                  </Td>
                  <Td className="text-right">
                    {subscription.open_invoice_id ? (
                      <RegisterPaymentButton
                        invoiceId={subscription.open_invoice_id}
                        compact
                      />
                    ) : (
                      <Link
                        href={`/admin/clinicas/${subscription.clinic_id}`}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-navy-800 transition hover:text-navy-950"
                      >
                        Detalhes
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} pageSize={pageSize} total={total} href={pageHref} />
        </TableShell>
      )}
    </div>
  );
}
