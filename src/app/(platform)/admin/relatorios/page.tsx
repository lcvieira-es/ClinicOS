import {
  ArrowDownToLine,
  Building,
  CircleCheck,
  ChartColumn,
  FileBadge,
  TrendingUp,
  Users,
} from 'lucide-react';
import { requirePlatformAdmin } from '@/lib/auth/guards';
import { getPlatformReports } from '@/lib/platform/admin-queries';
import { PageHeader } from '@/components/ui/page-header';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Table, TableEmpty, TableShell, Td, Th } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, formatDate } from '@/lib/format';

export const metadata = { title: 'Relatórios' };

const statusLabels: Record<string, string> = {
  em_teste: 'Em teste',
  ativa: 'Ativa',
  inadimplente: 'Inadimplente',
  suspensa: 'Suspensa',
  vencida: 'Vencida',
  cancelada: 'Cancelada',
};

export default async function PlatformReportsPage() {
  const user = await requirePlatformAdmin();
  const reports = await getPlatformReports(user.id);

  const maxMrr = Math.max(...reports.mrrByPlan.map((row) => Number(row.mrr)), 1);
  const maxAdoption = Math.max(...reports.moduleAdoption.map((row) => row.adoption), 1);

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Administração da plataforma"
        title="Relatórios"
        description="Receita por plano, assinaturas por status, adoção de módulos e próximas renovações — com exportação em CSV."
        actions={<Badge tone="navy">Dados agregados</Badge>}
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-navy-800" />
                MRR por plano
              </span>
            }
            description="Receita recorrente mensal considerando o ciclo anual."
            action={
              <a
                href="/admin/relatorios/export?report=mrr-by-plan"
                className="inline-flex items-center gap-1 text-[10px] font-bold text-navy-800 transition hover:text-navy-950"
              >
                <ArrowDownToLine className="h-3.5 w-3.5" />
                CSV
              </a>
            }
          />
          <CardBody className="space-y-3">
            {reports.mrrByPlan.map((row) => (
              <div key={row.slug}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="font-bold text-navy-900">{row.name}</span>
                    <Badge tone="neutral">{row.subscriptions} clínicas</Badge>
                  </span>
                  <span className="font-semibold text-ink-700">{formatCurrency(row.mrr)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-sky-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-navy-800 to-mint-400"
                    style={{ width: `${Math.max((Number(row.mrr) / maxMrr) * 100, Number(row.mrr) > 0 ? 6 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <FileBadge className="h-4 w-4 text-navy-800" />
                Assinaturas por status
              </span>
            }
            description="Distribuição atual dos contratos."
            action={
              <a
                href="/admin/relatorios/export?report=subscriptions-by-status"
                className="inline-flex items-center gap-1 text-[10px] font-bold text-navy-800 transition hover:text-navy-950"
              >
                <ArrowDownToLine className="h-3.5 w-3.5" />
                CSV
              </a>
            }
          />
          <CardBody>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {reports.subscriptionsByStatus.map((row) => (
                <div
                  key={row.status}
                  className="rounded-xl border border-line bg-sky-25 px-3 py-3 text-center"
                >
                  <p className="text-2xl font-bold tracking-tight text-navy-900">
                    {row.count}
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                    {statusLabels[row.status] ?? row.status}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-ink-400">
              {reports.subscriptionsByStatus.reduce((acc, row) => acc + row.count, 0)} assinaturas no total.
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Building className="h-4 w-4 text-navy-800" />
                Adoção de módulos
              </span>
            }
            description="Clínicas com cada módulo habilitado."
            action={
              <a
                href="/admin/relatorios/export?report=module-adoption"
                className="inline-flex items-center gap-1 text-[10px] font-bold text-navy-800 transition hover:text-navy-950"
              >
                <ArrowDownToLine className="h-3.5 w-3.5" />
                CSV
              </a>
            }
          />
          <CardBody className="space-y-2.5">
            {reports.moduleAdoption.map((row) => (
              <div key={row.key} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                    <span className="truncate font-medium text-ink-700">{row.name}</span>
                    <span className="shrink-0 font-bold text-navy-900">{row.adoption}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-sky-100">
                    <div
                      className="h-full rounded-full bg-mint-400"
                      style={{ width: `${(row.adoption / maxAdoption) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <ChartColumn className="h-4 w-4 text-navy-800" />
                Renovações em 30 dias
              </span>
            }
            description="Contratos que vencem no próximo mês."
            action={
              <a
                href="/admin/relatorios/export?report=renewals-30"
                className="inline-flex items-center gap-1 text-[10px] font-bold text-navy-800 transition hover:text-navy-950"
              >
                <ArrowDownToLine className="h-3.5 w-3.5" />
                CSV
              </a>
            }
          />
          {reports.renewals30.length === 0 ? (
            <CardBody>
              <EmptyState
                icon={CircleCheck}
                title="Nenhuma renovação em 30 dias"
                description="Não há contratos com fim de período no próximo mês."
              />
            </CardBody>
          ) : (
            <TableShell className="rounded-none border-0 shadow-none">
              <Table>
                <thead>
                  <tr>
                    <Th>Clínica</Th>
                    <Th>Plano</Th>
                    <Th className="hidden sm:table-cell">Fim do período</Th>
                    <Th className="text-right">Valor</Th>
                  </tr>
                </thead>
                <tbody>
                  {reports.renewals30.map((renewal, index) => (
                    <tr key={index}>
                      <Td className="font-semibold text-navy-900">{renewal.clinic_name}</Td>
                      <Td>
                        <Badge tone="neutral">{renewal.plan_name}</Badge>
                      </Td>
                      <Td className="hidden sm:table-cell text-xs text-ink-500">
                        {formatDate(renewal.current_period_end)}
                      </Td>
                      <Td className="text-right font-semibold text-navy-900">
                        {formatCurrency(renewal.amount)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableShell>
          )}
        </Card>
      </div>

      <div className="mt-5 flex items-start gap-2 rounded-xl border border-line bg-white px-4 py-3 text-[10px] leading-relaxed text-ink-400 shadow-card">
        <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
        <span>
          Relatórios refletem dados agregados de todas as clínicas e não expõem
          nenhuma informação clínica de pacientes. Exportações respeitam o mesmo
          escopo de permissão da sessão do superadministrador.
        </span>
      </div>
    </div>
  );
}
