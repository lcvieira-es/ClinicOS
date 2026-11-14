import Link from 'next/link';
import {
  ArrowRight,
  Building,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { requirePlatformAdmin } from '@/lib/auth/guards';
import { getPlatformPermissions } from '@/lib/permissions';
import {
  getClinicSummary,
  listClinics,
  listPlans,
} from '@/lib/platform/admin-queries';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardBody } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, Select } from '@/components/ui/input';
import { Table, TableShell, Td, Th } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { formatCnpj } from '@/lib/platform/format';

const PAGE_SIZE = 10;

export const metadata = { title: 'Clínicas' };

export default async function PlatformClinicsPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; status?: string; plano?: string; pagina?: string }>;
}) {
  const user = await requirePlatformAdmin();
  const permissions = await getPlatformPermissions(user.id);
  const canCreate = permissions.has('plataforma-clinicas:create');

  const params = await searchParams;
  const busca = (params.busca ?? '').trim();
  const status = params.status ?? '';
  const plano = params.plano ?? '';
  const page = Math.max(1, Number(params.pagina ?? '1') || 1);

  const [summary, plans, result] = await Promise.all([
    getClinicSummary(user.id),
    listPlans(user.id),
    listClinics(user.id, { search: busca, status, plan: plano, page, pageSize: PAGE_SIZE }),
  ]);

  const pageHref = (target: number) => {
    const query = new URLSearchParams();
    if (busca) query.set('busca', busca);
    if (status) query.set('status', status);
    if (plano) query.set('plano', plano);
    if (target > 1) query.set('pagina', String(target));
    const suffix = query.toString();
    return `/admin/clinicas${suffix ? `?${suffix}` : ''}`;
  };

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Administração da plataforma"
        title="Clínicas"
        description="Cadastro e contratação de clínicas, módulos contratados, vínculo de conta e situação da assinatura."
        actions={
          canCreate ? (
            <ButtonLink href="/admin/clinicas/novo" size="md">
              <Plus className="h-4 w-4" />
              Nova clínica
            </ButtonLink>
          ) : null
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Clínicas"
          value={summary.total}
          hint="Cadastradas na plataforma"
          icon={Building}
          tone="navy"
        />
        <StatCard
          label="Ativas"
          value={summary.active}
          hint="Em operação"
          icon={Users}
          tone="success"
        />
        <StatCard
          label="Em implantação"
          value={summary.settingUp}
          hint="Onboarding em andamento"
          icon={SlidersHorizontal}
          tone="warning"
        />
        <StatCard
          label="Suspensas"
          value={summary.suspended}
          hint="Acesso bloqueado"
          icon={ShieldCheck}
          tone={summary.suspended > 0 ? 'danger' : 'success'}
        />
      </div>

      <Card className="mt-5">
        <CardBody className="!p-4">
          <form method="get" action="/admin/clinicas" className="grid gap-2 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" strokeWidth={1.9} />
              <Input
                name="busca"
                type="search"
                defaultValue={busca}
                placeholder="Buscar por nome, razão social ou CNPJ…"
                className="pl-9"
                aria-label="Buscar clínica"
              />
            </div>
            <Select name="status" defaultValue={status} aria-label="Situação">
              <option value="">Todas as situações</option>
              <option value="ativa">Ativa</option>
              <option value="em_implantacao">Em implantação</option>
              <option value="suspensa">Suspensa</option>
              <option value="cancelada">Cancelada</option>
            </Select>
            <Select name="plano" defaultValue={plano} aria-label="Plano">
              <option value="">Todos os planos</option>
              {plans.map((plan) => (
                <option key={plan.slug} value={plan.slug}>
                  {plan.name}
                </option>
              ))}
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

      <div className="mt-4">
        {result.items.length === 0 ? (
          <Card>
            <EmptyState
              icon={Building}
              title={busca || status || plano ? 'Nenhuma clínica encontrada' : 'Nenhuma clínica cadastrada'}
              description={
                busca || status || plano
                  ? 'Ajuste os filtros e tente novamente.'
                  : 'Crie a primeira clínica para iniciar a contratação.'
              }
              action={
                canCreate && !busca && !status && !plano ? (
                  <ButtonLink href="/admin/clinicas/novo" size="sm">
                    <Plus className="h-3.5 w-3.5" />
                    Nova clínica
                  </ButtonLink>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <TableShell>
            <Table>
              <thead>
                <tr>
                  <Th>Clínica</Th>
                  <Th className="hidden md:table-cell">CNPJ / Plano</Th>
                  <Th className="hidden lg:table-cell">Localidade</Th>
                  <Th>Situação</Th>
                  <Th className="hidden sm:table-cell">Assinatura</Th>
                  <Th className="text-right">Ação</Th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((clinic) => (
                  <tr key={clinic.id}>
                    <Td>
                      <Link href={`/admin/clinicas/${clinic.id}`} className="group flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-navy-800 transition group-hover:bg-mint-400/20">
                          <Building className="h-4 w-4" strokeWidth={1.9} />
                        </span>
                        <span className="min-w-0">
                          <span className="block max-w-[220px] truncate text-xs font-bold text-navy-900 group-hover:underline">
                            {clinic.display_name}
                          </span>
                          <span className="block max-w-[220px] truncate text-[10px] text-ink-400">
                            {clinic.legal_name}
                          </span>
                        </span>
                      </Link>
                    </Td>
                    <Td className="hidden md:table-cell">
                      <p className="font-mono text-[11px] text-ink-600">
                        {formatCnpj(clinic.cnpj)}
                      </p>
                      <Badge tone="neutral" className="mt-1">
                        {clinic.plan_name ?? 'Sem plano'}
                      </Badge>
                    </Td>
                    <Td className="hidden lg:table-cell">
                      <span className="text-[11px] text-ink-500">
                        {[clinic.city, clinic.state].filter(Boolean).join(' · ') || '—'}
                      </span>
                    </Td>
                    <Td>
                      <StatusBadge status={clinic.status} />
                    </Td>
                    <Td className="hidden sm:table-cell">
                      {clinic.subscription_status ? (
                        <StatusBadge status={clinic.subscription_status} />
                      ) : (
                        <span className="text-xs text-ink-400">Sem assinatura</span>
                      )}
                    </Td>
                    <Td className="text-right">
                      <Link
                        href={`/admin/clinicas/${clinic.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-navy-800 transition hover:text-navy-950"
                      >
                        Abrir
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination
              page={result.page}
              pageSize={result.pageSize}
              total={result.total}
              href={pageHref}
            />
          </TableShell>
        )}
      </div>
    </div>
  );
}
