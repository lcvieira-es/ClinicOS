import Link from 'next/link';
import {
  Plus,
  Search,
  Users,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import {
  getPatientSummary,
  listPatients,
} from '@/lib/clinic/patients';
import { getPlanLimits, getUsageFor } from '@/lib/clinic/limits';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardBody } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, Select } from '@/components/ui/input';
import { Table, TableShell, Td, Th } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Avatar } from '@/components/ui/avatar';
import { Alert } from '@/components/ui/alert';
import { limitLabel } from '@/lib/clinic/limits';

export const metadata = { title: 'Pacientes' };

const PAGE_SIZE = 12;

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{
    busca?: string;
    status?: string;
    pagina?: string;
    msg?: string;
    erro?: string;
  }>;
}) {
  const access = await requireModule('pacientes');
  if (!access.allowed) {
    return (
      <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />
    );
  }

  const user = access.user;
  const params = await searchParams;
  const busca = (params.busca ?? '').trim();
  const status = params.status ?? '';
  const page = Math.max(1, Number(params.pagina ?? '1') || 1);
  const canSeeSensitive = access.permissions.has('pacientes:view_sensitive');
  const canCreate = access.permissions.has('pacientes:create');

  const [summary, limits, usage, result] = await Promise.all([
    getPatientSummary(user.id, user.activeClinicId),
    getPlanLimits(user.id, user.activeClinicId),
    getUsageFor(user.id, user.activeClinicId),
    listPatients(user.id, user.activeClinicId, {
      search: busca,
      status,
      page,
      pageSize: PAGE_SIZE,
      canSeeSensitive,
    }),
  ]);

  const pageHref = (target: number) => {
    const query = new URLSearchParams();
    if (busca) query.set('busca', busca);
    if (status) query.set('status', status);
    if (target > 1) query.set('pagina', String(target));
    const suffix = query.toString();
    return `/app/pacientes${suffix ? `?${suffix}` : ''}`;
  };

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Cadastros"
        title="Pacientes"
        description="Cadastro, consentimento LGPD e histórico de atendimentos."
        actions={
          <>
            <Badge tone="navy" className="hidden sm:inline-flex">
              {limitLabel('patient', limits, usage)}
            </Badge>
            {canCreate ? (
              <ButtonLink href="/app/pacientes/novo" size="md">
                <Plus className="h-4 w-4" />
                Novo paciente
              </ButtonLink>
            ) : null}
          </>
        }
      />

      {params.erro ? (
        <Alert variant="danger" className="mb-4">
          {decodeURIComponent(params.erro)}
        </Alert>
      ) : null}
      {params.msg ? (
        <Alert variant="success" className="mb-4">
          {decodeURIComponent(params.msg)}
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pacientes"
          value={summary.total}
          hint="Total cadastrados"
          icon={Users}
          tone="navy"
        />
        <StatCard
          label="Ativos"
          value={summary.active}
          hint="Em atendimento"
          icon={UserCheck}
          tone="success"
        />
        <StatCard
          label="Inativos / arquivados"
          value={summary.inactive + summary.archived}
          hint={`${summary.inactive} inativo(s) · ${summary.archived} arquivado(s)`}
          icon={ShieldCheck}
          tone="info"
        />
        <StatCard
          label="Consentimento pendente"
          value={summary.pendingConsent}
          hint="LGPD ainda não registrado"
          icon={AlertTriangle}
          tone={summary.pendingConsent > 0 ? 'warning' : 'success'}
        />
      </div>

      <Card className="mt-5">
        <CardBody className="!p-4">
          <form
            method="get"
            action="/app/pacientes"
            className="flex flex-wrap items-center gap-2"
          >
            <div className="relative w-[30%]">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
                strokeWidth={1.9}
              />
              <Input
                name="busca"
                type="search"
                defaultValue={busca}
                placeholder="Buscar por nome, e-mail, telefone ou CPF…"
                className="pl-9 w-full"
                aria-label="Buscar paciente"
              />
            </div>
            <Select name="status" defaultValue={status} aria-label="Situação" className="w-[20%]">
              <option value="">Todas as situações</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="arquivado">Arquivado</option>
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
              icon={Users}
              title={
                busca || status
                  ? 'Nenhum paciente encontrado'
                  : 'Nenhum paciente cadastrado'
              }
              description={
                busca || status
                  ? 'Ajuste os filtros e tente novamente.'
                  : 'Cadastre o primeiro paciente para iniciar a agenda.'
              }
              action={
                canCreate && !busca && !status ? (
                  <ButtonLink href="/app/pacientes/novo" size="sm">
                    <Plus className="h-3.5 w-3.5" />
                    Novo paciente
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
                  <Th className="text-[16px]">Paciente</Th>
                  <Th className="hidden md:table-cell text-[16px]">CPF</Th>
                  <Th className="hidden lg:table-cell text-[16px]">Contato</Th>
                  <Th className="hidden xl:table-cell text-[16px]">Convênio</Th>
                  <Th className="hidden xl:table-cell text-[16px]">Situação</Th>
                  <Th className="hidden sm:table-cell text-[16px]">LGPD</Th>
                  <Th className="text-right text-[16px]">Ação</Th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((patient) => (
                  <tr key={patient.id}>
                    <Td>
                      <Link
                        href={`/app/pacientes/${patient.id}`}
                        className="group flex items-center gap-2.5"
                      >
                        <Avatar name={patient.full_name} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-bold text-navy-900 group-hover:underline">
                            {patient.full_name}
                          </span>
                          {patient.social_name ? (
                            <span className="block truncate text-[10px] text-ink-400">
                              Social: {patient.social_name}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    </Td>
                    <Td className="hidden md:table-cell">
                      <span className="font-mono text-[11px] text-ink-600">
                        {patient.cpf ?? '—'}
                      </span>
                    </Td>
                    <Td className="hidden lg:table-cell">
                      <p className="text-[11px] text-ink-600">
                        {patient.phone ?? patient.email ?? '—'}
                      </p>
                      {patient.whatsapp ? (
                        <p className="text-[10px] text-ink-400">
                          WhatsApp {patient.whatsapp}
                        </p>
                      ) : null}
                    </Td>
                    <Td className="hidden xl:table-cell">
                      <span className="text-[11px] text-ink-600">
                        {patient.insurance_provider_name ?? 'Particular'}
                      </span>
                    </Td>
                    <Td>
                      <StatusBadge status={patient.status} />
                    </Td>
                    <Td className="hidden sm:table-cell">
                      {patient.lgpd_consent_at ? (
                        <Badge tone="success" dot>
                          Consentido
                        </Badge>
                      ) : (
                        <Badge tone="warning" dot>
                          Pendente
                        </Badge>
                      )}
                    </Td>
                    <Td className="text-right">
                      <Link
                        href={`/app/pacientes/${patient.id}`}
                        className="inline-flex items-center gap-1 text-[13px] font-bold text-navy-800 transition hover:text-navy-950"
                      >
                        Abrir
                        <Search className="h-3 w-3" />
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
