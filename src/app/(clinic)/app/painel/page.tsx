import Link from 'next/link';
import {
  CalendarDays,
  CircleCheck,
  CircleX,
  Clock,
  FlaskConical,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  ArrowRight,
  Plus,
  TriangleExclamationPoint,
} from 'lucide-react';
import { requireClinicUser } from '@/lib/auth/guards';
import { loadClinicContext } from '@/lib/tenant/context';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import {
  getClinicDashboardMetrics,
  getPendingExams,
  getTodayAgenda,
} from '@/lib/clinic/queries';
import { PageHeader } from '@/components/ui/page-header';
import { Alert } from '@/components/ui/alert';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardBody, CardHeader, SectionTitle } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { StatusBadge, Badge } from '@/components/ui/badge';
import { Table, TableEmpty, Td, Th, TableShell } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import {
  formatCurrency,
  formatDate,
  formatPercent,
  formatTime,
  todayLabel,
} from '@/lib/format';

export default async function ClinicDashboardPage() {
  const user = await requireClinicUser();

  const { modules, permissions } = await loadClinicContext(
    user.id,
    user.activeClinicId,
    user.activeMembership.role,
  );

  if (!permissions.has('painel:view')) {
    return <AccessRestricted homeHref="/" homeLabel="Voltar" />;
  }

  const canFinance = modules.has('financeiro') && permissions.has('financeiro:view');
  const canExams = modules.has('exames') && permissions.has('exames:view');
  const canPatients = modules.has('pacientes') && permissions.has('pacientes:view');
  const canAgenda = modules.has('agenda') && permissions.has('agenda:view');
  const isDemo = user.activeClinicName.toLowerCase().includes('demonstra');

  const [metrics, agenda, pendingExams] = await Promise.all([
    getClinicDashboardMetrics(user.id, user.activeClinicId, canFinance),
    canAgenda ? getTodayAgenda(user.id, user.activeClinicId) : Promise.resolve([]),
    canExams ? getPendingExams(user.id, user.activeClinicId) : Promise.resolve([]),
  ]);

  const balance = metrics.revenueMonth - metrics.expenseMonth;
  const realizedPct =
    metrics.todayTotal > 0
      ? Math.round((metrics.completed / metrics.todayTotal) * 100)
      : 0;

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Operação"
        title="Painel"
        description={
          <span>
            Visão geral de <strong className="font-semibold text-ink-700">{todayLabel()}</strong>
          </span>
        }
        actions={
          <>
            {canPatients ? (
              <ButtonLink href="/app/pacientes" variant="outline" size="md">
                <Users className="h-4 w-4" />
                Pacientes
              </ButtonLink>
            ) : null}
            {canAgenda ? (
              <ButtonLink href="/app/agenda" size="md">
                <Plus className="h-4 w-4" />
                Nova consulta
              </ButtonLink>
            ) : null}
          </>
        }
      />

      {isDemo ? (
        <Alert
          variant="warning"
          title="Ambiente de demonstração"
          className="mb-5"
          action={
            <Badge tone="warning">Dados fictícios</Badge>
          }
        >
          A clínica <strong>Clínica Demonstração</strong> utiliza dados fictícios para
          apresentar a experiência do produto. Nenhum dado real de paciente é utilizado.
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Consultas hoje"
          value={metrics.todayTotal}
          hint={`${metrics.waiting} aguardando`}
          icon={CalendarDays}
          tone="navy"
        />
        <StatCard
          label="Realizadas"
          value={metrics.completed}
          hint={`${realizedPct}% da agenda`}
          icon={CircleCheck}
          tone="success"
        />
        <StatCard
          label="Faltas"
          value={metrics.noShow}
          hint={`Taxa de ${formatPercent(metrics.noShowRate)}`}
          icon={CircleX}
          tone={metrics.noShow > 0 ? 'danger' : 'success'}
        />
        <StatCard
          label="Pacientes ativos"
          value={metrics.activePatients}
          hint="Base da clínica"
          icon={Users}
          tone="mint"
        />
      </div>

      {canFinance ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Receitas do mês"
            value={formatCurrency(metrics.revenueMonth)}
            hint="Recebidas"
            icon={TrendingUp}
            tone="success"
          />
          <StatCard
            label="Despesas do mês"
            value={formatCurrency(metrics.expenseMonth)}
            hint="Pagas"
            icon={TrendingDown}
            tone="danger"
          />
          <StatCard
            label="Saldo do mês"
            value={
              <span className={balance >= 0 ? 'text-success' : 'text-danger'}>
                {formatCurrency(balance)}
              </span>
            }
            hint="Receitas − despesas"
            icon={Wallet}
            tone={balance >= 0 ? 'mint' : 'danger'}
          />
          <StatCard
            label="A receber"
            value={formatCurrency(metrics.receivableOpen)}
            hint={`${formatCurrency(metrics.payableOpen)} a pagar`}
            icon={Clock}
            tone="warning"
          />
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            title="Agenda de hoje"
            description={`${metrics.todayTotal} consultas previstas · ${metrics.waiting} aguardando`}
            action={
              canAgenda ? (
                <ButtonLink href="/app/agenda" variant="ghost" size="sm">
                  Ver agenda
                  <ArrowRight className="h-3.5 w-3.5" />
                </ButtonLink>
              ) : null
            }
          />
          {agenda.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nenhuma consulta para hoje"
              description="A agenda do dia está livre. Crie um agendamento ou acompanhe a lista de espera."
              action={
                canAgenda ? (
                  <ButtonLink href="/app/agenda" size="sm">
                    <Plus className="h-3.5 w-3.5" />
                    Nova consulta
                  </ButtonLink>
                ) : undefined
              }
            />
          ) : (
            <TableShell className="rounded-none border-0 shadow-none">
              <Table>
                <thead>
                  <tr>
                    <Th>Horário</Th>
                    <Th>Paciente</Th>
                    <Th className="hidden md:table-cell">Profissional</Th>
                    <Th>Situação</Th>
                    <Th className="text-right">Valor</Th>
                  </tr>
                </thead>
                <tbody>
                  {agenda.map((appointment) => (
                    <tr key={appointment.id}>
                      <Td>
                        <span className="inline-flex items-center gap-1.5 font-semibold text-navy-900">
                          <Clock className="h-3.5 w-3.5 text-ink-400" />
                          {formatTime(appointment.scheduled_start)}
                        </span>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <Avatar name={appointment.patient_name} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-ink-900">
                              {appointment.patient_name}
                            </p>
                            <p className="text-[10px] capitalize text-ink-400">
                              {appointment.type}
                            </p>
                          </div>
                        </div>
                      </Td>
                      <Td className="hidden md:table-cell">
                        <span className="text-xs text-ink-600">
                          {appointment.professional_name}
                        </span>
                      </Td>
                      <Td>
                        <StatusBadge status={appointment.status} />
                      </Td>
                      <Td className="text-right font-semibold text-navy-900">
                        {formatCurrency(appointment.amount)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="border-t border-line bg-slate-50/70 px-4 py-2.5">
                <Link
                  href="/app/consultas"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-navy-700 hover:text-navy-900"
                >
                  Abrir lista de consultas
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </TableShell>
          )}
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Situação do dia" description="Andamento da agenda" />
            <CardBody className="space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[11px]">
                  <span className="font-medium text-ink-600">Atendimentos concluídos</span>
                  <span className="font-bold text-navy-900">
                    {metrics.completed}/{metrics.todayTotal}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-sky-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(realizedPct, 100)}%` }}
                  />
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Aguardando', value: metrics.waiting, tone: 'text-amber-600' },
                  { label: 'Canceladas', value: metrics.cancelled, tone: 'text-red-600' },
                  { label: 'Faltas', value: metrics.noShow, tone: 'text-red-600' },
                  {
                    label: 'Taxa de faltas',
                    value: formatPercent(metrics.noShowRate),
                    tone: 'text-ink-700',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-line bg-sky-25 px-3 py-2.5"
                  >
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                      {item.label}
                    </dt>
                    <dd className={`mt-0.5 text-lg font-bold ${item.tone}`}>{item.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="rounded-xl bg-navy-900 px-3.5 py-3 text-white">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/50">
                  Próxima consulta
                </p>
                {agenda.find((item) => item.status === 'aguardando') ? (
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold">
                      {agenda.find((item) => item.status === 'aguardando')?.patient_name}
                    </p>
                    <span className="shrink-0 text-[11px] font-bold text-mint-400">
                      {formatTime(
                        agenda.find((item) => item.status === 'aguardando')?.scheduled_start,
                      )}
                    </span>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-white/60">Nenhum paciente aguardando.</p>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Pendências"
              description="Itens que precisam de atenção"
              action={
                canExams ? (
                  <ButtonLink href="/app/exames" variant="ghost" size="sm">
                    Ver exames
                  </ButtonLink>
                ) : null
              }
            />
            <CardBody className="space-y-2.5">
              <div className="flex items-center gap-3 rounded-xl border border-amber-200/70 bg-warning-soft/35 px-3 py-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-warning-soft text-warning">
                  <FlaskConical className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-ink-900">
                    {metrics.pendingExams} exames pendentes
                  </p>
                  <p className="text-[10px] text-ink-500">
                    Solicitações aguardando coleta ou resultado
                  </p>
                </div>
              </div>

              {canFinance ? (
                <div className="flex items-center gap-3 rounded-xl border border-red-200/60 bg-danger-soft/30 px-3 py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-danger-soft text-danger">
                    <Wallet className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink-900">
                      {formatCurrency(metrics.receivableOpen)} a receber
                    </p>
                    <p className="text-[10px] text-ink-500">
                      Lançamentos pendentes ou atrasados
                    </p>
                  </div>
                </div>
              ) : null}

              {pendingExams.length > 0 ? (
                <div className="pt-1">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-400">
                    Exames aguardando
                  </p>
                  <ul className="space-y-1.5">
                    {pendingExams.slice(0, 3).map((exam) => (
                      <li
                        key={exam.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-sky-25 px-2.5 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-semibold text-ink-700">
                            {exam.patient_name}
                          </p>
                          <p className="text-[10px] text-ink-400">
                            {formatDate(exam.order_date)} · {exam.professional_name}
                          </p>
                        </div>
                        {exam.priority === 'urgente' || exam.priority === 'emergencia' ? (
                          <Badge tone="danger">Prioridade</Badge>
                        ) : (
                          <StatusBadge status={exam.status} />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {metrics.pendingExams === 0 && !canFinance ? (
                <EmptyState
                  icon={TriangleExclamationPoint}
                  title="Sem pendências"
                  description="Nenhum item exige atenção neste momento."
                  className="py-6"
                />
              ) : null}
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="mt-6" id="alertas">
        <SectionTitle subtitle="Atalhos para as rotinas mais usadas">
          Acesso rápido
        </SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {canAgenda ? (
            <QuickAction
              href="/app/agenda"
              icon={CalendarDays}
              title="Agenda"
              description="Organize horários e confirme presenças."
            />
          ) : null}
          {canPatients ? (
            <QuickAction
              href="/app/pacientes"
              icon={Users}
              title="Pacientes"
              description="Consulte cadastros e consentimentos."
            />
          ) : null}
          {modules.has('prontuarios') && permissions.has('prontuarios:view') ? (
            <QuickAction
              href="/app/prontuarios"
              icon={CircleCheck}
              title="Prontuários"
              description="Acompanhe a documentação clínica."
            />
          ) : null}
          {canFinance ? (
            <QuickAction
              href="/app/financeiro"
              icon={Wallet}
              title="Financeiro"
              description="Veja contas, fluxo de caixa e repasses."
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof CalendarDays;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-card border border-line bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-navy-600/25 hover:shadow-pop"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-navy-800 transition group-hover:bg-mint-400/25">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1 text-xs font-bold text-navy-900">
          {title}
          <ArrowRight className="h-3 w-3 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
        </span>
        <span className="mt-0.5 block text-[11px] leading-relaxed text-ink-500">
          {description}
        </span>
      </span>
    </Link>
  );
}
