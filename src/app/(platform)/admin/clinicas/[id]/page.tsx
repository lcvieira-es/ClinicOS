import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Building,
  CircleDollarSign,
  CreditCard,
  MapPin,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import { requirePlatformAdmin } from '@/lib/auth/guards';
import {
  getAddableModules,
  getClinicDetail,
  listPlans,
} from '@/lib/platform/admin-queries';
import {
  removeClinicModuleAction,
  toggleClinicStatusAction,
  suspendClinicMemberAction,
  reactivateClinicMemberAction,
} from '@/lib/platform/actions';
import { RegisterPaymentButton } from '@/components/platform/register-payment-button';
import { PageHeader } from '@/components/ui/page-header';
import { Alert } from '@/components/ui/alert';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ConfirmSubmitButton } from '@/components/ui/confirm-submit';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableShell, Td, Th } from '@/components/ui/table';
import { ChangePlanForm, GenerateInvoiceButton } from '@/components/platform/change-plan-form';
import { AddModuleForm } from '@/components/platform/add-module-form';
import { formatCnpj } from '@/lib/platform/format';
import { formatCurrency, formatDate } from '@/lib/format';

export const metadata = { title: 'Clínica' };

export default async function ClinicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requirePlatformAdmin();

  const [detail, plans, addableModules] = await Promise.all([
    getClinicDetail(user.id, id),
    listPlans(user.id),
    getAddableModules(user.id, id),
  ]);

  if (!detail) notFound();

  const { clinic, units, admins, subscription, modules, invoices } = detail;
  const isSuspended = clinic.status === 'suspensa';

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Administração da plataforma"
        title={clinic.display_name}
        description={clinic.legal_name}
        actions={
          <>
            <StatusBadge status={clinic.status} />
            <form action={toggleClinicStatusAction}>
              <input type="hidden" name="clinicId" value={clinic.id} />
              <input type="hidden" name="next" value={isSuspended ? 'ativa' : 'suspensa'} />
              <ConfirmSubmitButton
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink-700 transition hover:bg-sky-50"
                confirm={
                  isSuspended
                    ? 'Reativar esta clínica? O acesso à área da clínica e a assinatura serão reativados.'
                    : 'Suspender esta clínica? O acesso à área da clínica será bloqueado e a assinatura ficará suspensa.'
                }
              >
                {isSuspended ? 'Reativar clínica' : 'Suspender clínica'}
              </ConfirmSubmitButton>
            </form>
          </>
        }
      />

      <div className="mb-4">
        <Link
          href="/admin/clinicas"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-500 transition hover:text-navy-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para Clínicas
        </Link>
      </div>

      {isSuspended ? (
        <Alert variant="warning" title="Clínica suspensa" className="mb-5">
          O acesso da clínica está bloqueado. Os dados permanecem armazenados conforme a
          LGPD; a assinatura também foi suspensa.
        </Alert>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-navy-800" />
                  Dados da clínica
                </span>
              }
              description="Identificação e contato do contratante."
            />
            <CardBody>
              <dl className="grid gap-3 sm:grid-cols-2">
                {[
                  ['CNPJ', formatCnpj(clinic.cnpj)],
                  ['E-mail', clinic.email ?? '—'],
                  ['Telefone', clinic.phone ?? '—'],
                  ['WhatsApp', clinic.whatsapp ?? '—'],
                  [
                    'Endereço',
                    [
                      clinic.address,
                      clinic.address_number,
                      clinic.neighborhood,
                      [clinic.city, clinic.state].filter(Boolean).join(' / '),
                    ]
                      .filter(Boolean)
                      .join(', ') || '—',
                  ],
                  ['Portal do paciente', clinic.portal_slug ? `/portal · ${clinic.portal_slug}` : '—'],
                  ['Cadastrada em', formatDate(clinic.created_at)],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
                      {label}
                    </dt>
                    <dd className="mt-0.5 text-xs font-medium text-ink-700">{value}</dd>
                  </div>
                ))}
              </dl>
              {clinic.notes ? (
                <p className="mt-4 rounded-xl bg-sky-25 px-3 py-2.5 text-[11px] leading-relaxed text-ink-500">
                  {clinic.notes}
                </p>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-navy-800" />
                  Unidades
                </span>
              }
              description="Matriz e filiais vinculadas."
              action={<Badge tone="neutral">{units.length} unidade(s)</Badge>}
            />
            {units.length === 0 ? (
              <CardBody>
                <EmptyState
                  icon={MapPin}
                  title="Nenhuma unidade cadastrada"
                  description="A unidade matriz é criada no assistente de implantação."
                />
              </CardBody>
            ) : (
              <TableShell className="rounded-none border-0 shadow-none">
                <Table>
                  <thead>
                    <tr>
                      <Th>Unidade</Th>
                      <Th className="hidden sm:table-cell">Localidade</Th>
                      <Th>Matriz</Th>
                      <Th>Situação</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((unit) => (
                      <tr key={unit.id}>
                        <Td className="font-semibold text-navy-900">{unit.name}</Td>
                        <Td className="hidden sm:table-cell text-xs text-ink-500">
                          {[unit.city, unit.state].filter(Boolean).join(' · ') || '—'}
                        </Td>
                        <Td>
                          {unit.is_headquarters ? (
                            <Badge tone="mint">Matriz</Badge>
                          ) : (
                            <span className="text-xs text-ink-400">Filial</span>
                          )}
                        </Td>
                        <Td>
                          <StatusBadge status={unit.status} />
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableShell>
            )}
          </Card>

          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-navy-800" />
                  Administradores da clínica
                </span>
              }
              description="Quem gerencia esta clínica no ClinicOS."
              action={<Badge tone="neutral">{admins.length}</Badge>}
            />
            {admins.length === 0 ? (
              <CardBody>
                <EmptyState
                  icon={Users}
                  title="Nenhum administrador vinculado"
                  description="Vincule um usuário com perfil de administrador da clínica no momento da criação."
                />
              </CardBody>
            ) : (
              <TableShell className="rounded-none border-0 shadow-none">
                <Table>
                  <thead>
                    <tr>
                      <Th>Nome</Th>
                      <Th className="hidden md:table-cell">E-mail</Th>
                      <Th>Situação</Th>
                      <Th className="text-right">Ações</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => (
                      <tr key={admin.membership_id}>
                        <Td className="font-semibold text-navy-900">{admin.full_name}</Td>
                        <Td className="hidden md:table-cell text-xs text-ink-500">
                          {admin.email}
                        </Td>
                        <Td>
                          <StatusBadge status={admin.status} />
                        </Td>
                        <Td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {admin.status === 'ativo' ? (
                              <form action={suspendClinicMemberAction}>
                                <input type="hidden" name="clinicId" value={clinic.id} />
                                <input type="hidden" name="membershipId" value={admin.membership_id} />
                                <button
                                  type="submit"
                                  className="rounded-lg border border-amber-200 px-2 py-1 text-[10px] font-semibold text-amber-700 transition hover:bg-warning-soft"
                                >
                                  Suspender
                                </button>
                              </form>
                            ) : admin.status === 'suspenso' ? (
                              <form action={reactivateClinicMemberAction}>
                                <input type="hidden" name="clinicId" value={clinic.id} />
                                <input type="hidden" name="membershipId" value={admin.membership_id} />
                                <button
                                  type="submit"
                                  className="rounded-lg border border-emerald-200 px-2 py-1 text-[10px] font-semibold text-emerald-700 transition hover:bg-success-soft"
                                >
                                  Reativar
                                </button>
                              </form>
                            ) : null}
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableShell>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-navy-800" />
                  Assinatura
                </span>
              }
              description="Plano, ciclo de cobrança e valor."
            />
            <CardBody className="space-y-4">
              {subscription ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold tracking-tight text-navy-900">
                        {subscription.plan_name}
                      </p>
                      <p className="text-[10px] uppercase tracking-wide text-ink-400">
                        {subscription.periodicity} · {subscription.gateway}
                      </p>
                    </div>
                    <StatusBadge status={subscription.status} />
                  </div>

                  <dl className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-sky-25 px-3 py-2.5">
                      <dt className="text-[9px] font-bold uppercase tracking-wide text-ink-400">
                        Valor
                      </dt>
                      <dd className="mt-0.5 text-base font-bold text-navy-900">
                        {formatCurrency(subscription.price)}
                        <span className="text-[9px] font-normal text-ink-400">
                          /{subscription.periodicity === 'anual' ? 'ano' : 'mês'}
                        </span>
                      </dd>
                    </div>
                    <div className="rounded-xl bg-sky-25 px-3 py-2.5">
                      <dt className="text-[9px] font-bold uppercase tracking-wide text-ink-400">
                        Fim do período
                      </dt>
                      <dd className="mt-0.5 text-base font-bold text-navy-900">
                        {formatDate(subscription.current_period_end)}
                      </dd>
                    </div>
                  </dl>

                  {subscription.trial_ends_at ? (
                    <p className="text-[11px] text-ink-500">
                      Teste grátis até {formatDate(subscription.trial_ends_at)}.
                    </p>
                  ) : null}

                  <div className="space-y-3 border-t border-line pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">
                      Alterar plano
                    </p>
                    <ChangePlanForm
                      clinicId={clinic.id}
                      plans={plans.map((plan) => ({
                        id: plan.id,
                        name: plan.name,
                        slug: plan.slug,
                      }))}
                      currentPlanId={subscription.plan_id}
                      currentPeriodicity={subscription.periodicity}
                    />
                    <GenerateInvoiceButton clinicId={clinic.id} />
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={CreditCard}
                  title="Sem assinatura"
                  description="Esta clínica não possui assinatura vinculada."
                />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-navy-800" />
                  Módulos contratados
                </span>
              }
              description="Do plano e adicionais avulsos."
              action={<Badge tone="neutral">{modules.length}</Badge>}
            />
            <CardBody className="space-y-3">
              {modules.length === 0 ? (
                <p className="text-[11px] text-ink-400">Nenhum módulo ativado.</p>
              ) : (
                <ul className="flex flex-wrap gap-1.5">
                  {modules.map((module) => (
                    <li key={module.id} className="group relative">
                      <span
                        className={
                          module.source === 'adicional'
                            ? 'inline-flex items-center gap-1 rounded-full bg-violet-50 py-1 pl-2.5 pr-1 text-[10px] font-semibold text-violet-700 ring-1 ring-inset ring-violet-200'
                            : 'inline-flex items-center gap-1 rounded-full bg-sky-50 py-1 pl-2.5 pr-2.5 text-[10px] font-semibold text-sky-800 ring-1 ring-inset ring-sky-100'
                        }
                      >
                        {module.name}
                        {module.source === 'adicional' ? (
                          <form action={removeClinicModuleAction} className="inline">
                            <input type="hidden" name="clinicId" value={clinic.id} />
                            <input type="hidden" name="moduleId" value={module.id} />
                            <ConfirmSubmitButton
                              className="rounded-full p-0.5 text-violet-500 transition hover:bg-violet-100 hover:text-violet-800"
                              confirm={`Remover o módulo adicional "${module.name}" desta clínica?`}
                            >
                              <Trash2 className="h-3 w-3" strokeWidth={2} />
                              <span className="sr-only">Remover módulo</span>
                            </ConfirmSubmitButton>
                          </form>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="border-t border-line pt-3">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">
                  Ativar módulo adicional
                </p>
                <AddModuleForm clinicId={clinic.id} modules={addableModules} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4 text-navy-800" />
                  Faturas recentes
                </span>
              }
              description="Cobranças geradas para este contrato."
              action={
                <ButtonLink href="/admin/pagamentos" variant="ghost" size="sm">
                  Ver todas
                </ButtonLink>
              }
            />
            {invoices.length === 0 ? (
              <CardBody>
                <EmptyState
                  icon={CircleDollarSign}
                  title="Nenhuma fatura"
                  description="Gere a primeira fatura do período ao concluir o teste."
                />
              </CardBody>
            ) : (
              <ul className="divide-y divide-line">
                {invoices.slice(0, 5).map((invoice) => {
                  const payable = invoice.status === 'aberta' || invoice.status === 'vencida';
                  return (
                    <li
                      key={invoice.id}
                      className="flex items-center justify-between gap-3 px-5 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-navy-900">
                          {formatCurrency(invoice.amount)}
                        </p>
                        <p className="text-[10px] text-ink-400">
                          venc. {formatDate(invoice.due_date)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge status={invoice.status} />
                        {payable ? (
                          <RegisterPaymentButton invoiceId={invoice.id} compact />
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <div className="flex items-start gap-2 rounded-xl border border-line bg-white px-4 py-3 text-[10px] leading-relaxed text-ink-400 shadow-card">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <span>
              Ações de suspensão, alteração de plano, módulos e registro de pagamento
              são registradas na trilha de auditoria com hash encadeado.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
