import Link from 'next/link';
import {
  ArrowRight,
  Building,
  ChartColumn,
  CircleCheck,
  FileBadge,
  ShieldCheck,
  TriangleExclamationPoint,
  Users,
  Wallet,
} from 'lucide-react';
import { requirePlatformAdmin } from '@/lib/auth/guards';
import {
  getPlanDistribution,
  getPlatformMetrics,
  getRecentClinics,
  getUpcomingRenewals,
} from '@/lib/platform/queries';
import { PageHeader } from '@/components/ui/page-header';
import { Alert } from '@/components/ui/alert';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Table, TableEmpty, TableShell, Td, Th } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';

export default async function PlatformDashboardPage() {
  const user = await requirePlatformAdmin();

  const [metrics, plans, renewals, recentClinics] = await Promise.all([
    getPlatformMetrics(user.id),
    getPlanDistribution(user.id),
    getUpcomingRenewals(user.id),
    getRecentClinics(user.id),
  ]);

  const maxPlanRevenue = Math.max(...plans.map((plan) => plan.revenue), 1);

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Administração da plataforma"
        title="Dashboard"
        description="Visão consolidada de clínicas, assinaturas e receita recorrente."
        actions={
          <ButtonLink href="/admin/relatorios" size="md">
            <ChartColumn className="h-4 w-4" />
            Relatórios
          </ButtonLink>
        }
      />

      <Alert
        variant="info"
        title="Privacidade por padrão"
        className="mb-5"
        action={<Badge tone="navy">Dados agregados</Badge>}
      >
        O superadministrador gerencia clínicas, planos e assinaturas, mas não acessa
        prontuários, receitas ou financeiro das clínicas. Métricas clínicas não são
        expostas nesta área.
      </Alert>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Clínicas ativas"
          value={metrics.clinicsActive}
          hint={`${metrics.clinicsTotal} cadastradas · ${metrics.clinicsSetup} em implantação`}
          icon={Building}
          tone="navy"
        />
        <StatCard
          label="Assinaturas vigentes"
          value={metrics.subscriptionsActive}
          hint={`${metrics.plansActive} planos ativos`}
          icon={FileBadge}
          tone="success"
        />
        <StatCard
          label="MRR"
          value={formatCurrency(metrics.mrr)}
          hint="Receita recorrente mensal"
          icon={Wallet}
          tone="mint"
        />
        <StatCard
          label="Inadimplentes"
          value={metrics.subscriptionsOverdue}
          hint={`${formatCurrency(metrics.overdueAmount)} vencidos`}
          icon={TriangleExclamationPoint}
          tone={metrics.subscriptionsOverdue > 0 ? 'danger' : 'success'}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="ARR"
          value={formatCurrency(metrics.arr)}
          hint="Receita recorrente anual"
          icon={ChartColumn}
          tone="success"
        />
        <StatCard
          label="Ticket médio"
          value={formatCurrency(metrics.ticket)}
          hint="Por assinatura ativa"
          icon={Users}
          tone="info"
        />
        <StatCard
          label="Renovações em 30 dias"
          value={metrics.renewals30}
          hint="Faturas abertas ou vencidas"
          icon={CircleCheck}
          tone="warning"
        />
        <StatCard
          label="Faturas em aberto"
          value={metrics.openInvoices}
          hint="Aguardando pagamento"
          icon={FileBadge}
          tone="navy"
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            title="Receita por plano"
            description="Clínicas e MRR por composição comercial."
            action={
              <ButtonLink href="/admin/planos" variant="ghost" size="sm">
                Ver planos
                <ArrowRight className="h-3.5 w-3.5" />
              </ButtonLink>
            }
          />
          <CardBody className="space-y-4">
            {plans.length === 0 ? (
              <EmptyState
                icon={ChartColumn}
                title="Nenhum plano cadastrado"
                description="Crie o primeiro plano para acompanhar a receita."
              />
            ) : (
              plans.map((plan) => (
                <div key={plan.slug}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy-900">{plan.name}</span>
                      <Badge tone="neutral">{plan.clinics} clínicas</Badge>
                    </div>
                    <span className="font-semibold text-ink-700">
                      {formatCurrency(plan.revenue)}
                      <span className="ml-1 text-[9px] font-normal text-ink-400">MRR</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-sky-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-navy-800 to-mint-400"
                      style={{
                        width: `${Math.max(
                          (plan.revenue / maxPlanRevenue) * 100,
                          plan.revenue > 0 ? 8 : 0,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}

            <div className="grid grid-cols-3 gap-2 border-t border-line pt-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                  Planos
                </p>
                <p className="text-lg font-bold text-navy-900">{metrics.plansActive}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                  Módulos
                </p>
                <p className="text-lg font-bold text-navy-900">{metrics.modulesActive}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                  Suspensas
                </p>
                <p className="text-lg font-bold text-navy-900">{metrics.clinicsSuspended}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Próximas renovações"
            description="Assinaturas e ciclos de cobrança."
            action={
              <ButtonLink href="/admin/assinaturas" variant="ghost" size="sm">
                Ver assinaturas
                <ArrowRight className="h-3.5 w-3.5" />
              </ButtonLink>
            }
          />
          {renewals.length === 0 ? (
            <EmptyState
              icon={FileBadge}
              title="Nenhuma assinatura cadastrada"
              description="As renovações aparecerão aqui quando houver contratos ativos."
            />
          ) : (
            <ul className="divide-y divide-line">
              {renewals.map((renewal) => (
                <li
                  key={renewal.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-navy-900">
                      {renewal.clinic_name}
                    </p>
                    <p className="text-[10px] text-ink-400">
                      {renewal.plan_name} · {renewal.periodicity} ·{' '}
                      {formatDate(renewal.current_period_end)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[11px] font-semibold text-ink-700">
                      {formatCurrency(renewal.price)}
                    </span>
                    <StatusBadge status={renewal.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader
            title="Clínicas recentes"
            description="Últimos cadastros e situação da assinatura."
            action={
              <ButtonLink href="/admin/clinicas" variant="ghost" size="sm">
                Ver todas
                <ArrowRight className="h-3.5 w-3.5" />
              </ButtonLink>
            }
          />
          <TableShell className="rounded-none border-0 shadow-none">
            <Table>
              <thead>
                <tr>
                  <Th>Clínica</Th>
                  <Th>Plano</Th>
                  <Th>Assinatura</Th>
                  <Th>Situação</Th>
                  <Th>Cadastro</Th>
                  <Th className="text-right">Ação</Th>
                </tr>
              </thead>
              <tbody>
                {recentClinics.length === 0 ? (
                  <TableEmpty colSpan={6}>
                    Nenhuma clínica cadastrada. Crie a primeira clínica para começar.
                  </TableEmpty>
                ) : (
                  recentClinics.map((clinic) => (
                    <tr key={clinic.id}>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-navy-800">
                            <Building className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-xs font-bold text-navy-900">
                              { clinic.display_name }
                            </p>
                            <p className="text-[10px] text-ink-400">
                              {clinic.plan_name ?? 'Sem plano'}
                            </p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <Badge tone="neutral">{clinic.plan_name ?? '—'}</Badge>
                      </Td>
                      <Td>
                        {clinic.subscription_status ? (
                          <StatusBadge status={clinic.subscription_status} />
                        ) : (
                          <span className="text-xs text-ink-400">—</span>
                        )}
                      </Td>
                      <Td>
                        <StatusBadge status={clinic.status} />
                      </Td>
                      <Td>
                        <span className="text-xs text-ink-500">
                          {formatDate(clinic.created_at)}
                        </span>
                      </Td>
                      <Td className="text-right">
                        <Link
                          href={`/admin/clinicas?clinic=${clinic.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-navy-800 hover:text-navy-950"
                        >
                          Abrir
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableShell>
        </Card>
      </div>

      <div className="mt-6 flex items-start gap-2 rounded-xl border border-line bg-white px-4 py-3 text-[11px] text-ink-500 shadow-card">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <span>
          {formatNumber(metrics.clinicsTotal)} clínicas monitoradas · ações do
          superadministrador registradas em auditoria encadeada por hash.
        </span>
      </div>
    </div>
  );
}
