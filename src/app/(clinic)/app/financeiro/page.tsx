import Link from 'next/link';
import { Plus, Wallet } from 'lucide-react';
import { requireModule } from '@/lib/clinic/module-guard';
import { AccessRestricted } from '@/components/feedback/access-restricted';
import { listTransactions, getFinancialSummary, listFinancialCategories } from '@/lib/clinic/financeiro';
import { listPatientOptions } from '@/lib/clinic/patients';
import { listProfessionals } from '@/lib/clinic/professionals';
import { listUnits } from '@/lib/clinic/units';
import { createTransactionAction, settleTransactionAction, deleteTransactionAction } from '@/lib/clinic/actions/financeiro';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, Select } from '@/components/ui/input';
import { Table, TableShell, Td, Th } from '@/components/ui/table';
import { Alert } from '@/components/ui/alert';
import { StatCard } from '@/components/ui/stat-card';
import { formatCurrency, formatDate } from '@/lib/format';

export const metadata = { title: 'Financeiro' };

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{
    tipo?: string;
    status?: string;
    de?: string;
    ate?: string;
    msg?: string;
    erro?: string;
  }>;
}) {
  const access = await requireModule('financeiro');
  if (!access.allowed) {
    return <AccessRestricted homeHref="/app/painel" homeLabel="Voltar ao painel" />;
  }

  const sp = await searchParams;
  const user = access.user;
  const canCreate = access.permissions.has('financeiro:create');
  const canEdit = access.permissions.has('financeiro:edit');
  const canDelete = access.permissions.has('financeiro:delete');

  const [transactions, summary, categories, patients, professionals, units] = await Promise.all([
    listTransactions(user.id, user.activeClinicId, {
      type: sp.tipo,
      status: sp.status,
      from: sp.de,
      to: sp.ate,
    }),
    getFinancialSummary(user.id, user.activeClinicId),
    listFinancialCategories(user.id, user.activeClinicId),
    listPatientOptions(user.id, user.activeClinicId),
    listProfessionals(user.id, user.activeClinicId),
    listUnits(user.id, user.activeClinicId),
  ]);

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="Gestão"
        title="Financeiro"
        description="Lançamentos de receitas e despesas."
        actions={
          canCreate ? (
            <ButtonLink href="/app/financeiro/novo" size="md">
              <Plus className="h-4 w-4" />
              Novo lançamento
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Receitas do mês" value={formatCurrency(summary.revenueMonth)} icon={Wallet} tone="success" />
        <StatCard label="Despesas do mês" value={formatCurrency(summary.expenseMonth)} icon={Wallet} tone="danger" />
        <StatCard label="A receber" value={formatCurrency(summary.receivableOpen)} icon={Wallet} tone="warning" />
        <StatCard label="A pagar" value={formatCurrency(summary.payableOpen)} icon={Wallet} tone="info" />
      </div>

      <Card className="mt-5">
        <CardBody className="!p-4">
          <form method="get" action="/app/financeiro" className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
                De
              </label>
              <Input name="de" type="date" defaultValue={sp.de ?? ''} className="min-w-[150px]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
                Até
              </label>
              <Input name="ate" type="date" defaultValue={sp.ate ?? ''} className="min-w-[150px]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
                Tipo
              </label>
              <Select name="tipo" defaultValue={sp.tipo ?? ''} aria-label="Tipo" className="min-w-[140px]">
                <option value="">Todos os tipos</option>
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
                Status
              </label>
              <Select name="status" defaultValue={sp.status ?? ''} aria-label="Status" className="min-w-[140px]">
                <option value="">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="atrasado">Atrasado</option>
                <option value="cancelado">Cancelado</option>
              </Select>
            </div>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 text-xs font-semibold text-white transition hover:bg-navy-800"
            >
              Filtrar
            </button>
          </form>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardHeader title="Lançamentos" description={`${transactions.length} registro(s)`} />
        <CardBody className="p-0">
          {transactions.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Nenhum lançamento encontrado"
              description="Crie um novo lançamento para começar."
              className="py-8"
            />
          ) : (
            <TableShell>
              <Table>
                <thead>
                  <tr>
                    <Th className="text-[16px]">Vencimento</Th>
                    <Th className="text-[16px]">Descrição</Th>
                    <Th className="hidden md:table-cell text-[16px]">Categoria</Th>
                    <Th className="text-[16px]">Tipo</Th>
                    <Th className="text-[16px]">Status</Th>
                    <Th className="text-right text-[16px]">Valor</Th>
                    {canEdit ? <Th className="text-right text-[16px]">Ações</Th> : null}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <Td>{formatDate(transaction.due_date)}</Td>
                      <Td>
                        <p className="text-xs font-bold text-ink-900">
                          {transaction.description}
                        </p>
                        {transaction.patient_name ? (
                          <p className="text-[10px] text-ink-400">
                            Paciente: {transaction.patient_name}
                          </p>
                        ) : null}
                      </Td>
                      <Td className="hidden md:table-cell">
                        <span className="text-xs text-ink-600">
                          {transaction.category_name ?? '—'}
                        </span>
                      </Td>
                      <Td>
                        <Badge tone={transaction.type === 'receita' ? 'success' : 'danger'}>
                          {transaction.type}
                        </Badge>
                      </Td>
                      <Td>
                        <StatusBadge status={transaction.status} />
                      </Td>
                      <Td className="text-right font-semibold text-navy-900">
                        {formatCurrency(transaction.amount)}
                      </Td>
                      {canEdit ? (
                        <Td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {transaction.status !== 'pago' ? (
                              <form action={settleTransactionAction}>
                                <input type="hidden" name="transactionId" value={transaction.id} />
                                <button
                                  type="submit"
                                  className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-emerald-700"
                                >
                                  Baixar
                                </button>
                              </form>
                            ) : null}
                            {canDelete ? (
                              <form action={deleteTransactionAction} className="inline">
                                <input type="hidden" name="transactionId" value={transaction.id} />
                                <button
                                  type="submit"
                                  className="delete-trigger rounded-lg border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-600 transition hover:bg-danger-soft"
                                >
                                  Excluir
                                </button>
                              </form>
                            ) : null}
                          </div>
                        </Td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableShell>
          )}
        </CardBody>
      </Card>

      {canDelete ? (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var modal = null;
                var pendingForm = null;
                function ensureModal() {
                  if (modal) return modal;
                  modal = document.createElement('div');
                  modal.id = 'delete-modal';
                  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);padding:16px;';
                  var card = document.createElement('div');
                  card.style.cssText = 'width:100%;max-width:384px;border-radius:12px;background:#fff;padding:24px;box-shadow:0 10px 25px rgba(0,0,0,0.15);';
                  var title = document.createElement('p');
                  title.style.cssText = 'font-size:15px;font-weight:600;color:#111827;margin:0;';
                  title.textContent = 'Confirmar exclusão!';
                  var row = document.createElement('div');
                  row.style.cssText = 'margin-top:16px;display:flex;justify-content:flex-end;gap:8px;';
                  var noBtn = document.createElement('button');
                  noBtn.type = 'button';
                  noBtn.style.cssText = 'border-radius:8px;border:1px solid #e2e8f0;padding:8px 16px;font-size:15px;font-weight:600;color:#334155;background:#fff;cursor:pointer;';
                  noBtn.textContent = 'Não';
                  var yesBtn = document.createElement('button');
                  yesBtn.type = 'button';
                  yesBtn.style.cssText = 'border-radius:8px;background:#dc2626;padding:8px 16px;font-size:15px;font-weight:600;color:#fff;cursor:pointer;border:none;';
                  yesBtn.textContent = 'Sim';
                  row.appendChild(noBtn);
                  row.appendChild(yesBtn);
                  card.appendChild(title);
                  card.appendChild(row);
                  modal.appendChild(card);
                  document.body.appendChild(modal);
                  noBtn.addEventListener('click', close);
                  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
                  yesBtn.addEventListener('click', function () {
                    if (pendingForm) { pendingForm.requestSubmit(); }
                    close();
                  });
                  return modal;
                }
                function open(form) { pendingForm = form; var m = ensureModal(); m.style.display = 'flex'; }
                function close() { if (modal) modal.style.display = 'none'; pendingForm = null; }
                document.addEventListener('click', function (e) {
                  var btn = e.target && e.target.closest ? e.target.closest('.delete-trigger') : null;
                  if (!btn) return;
                  e.preventDefault();
                  var form = btn.closest('form');
                  open(form);
                });
              })();
            `,
          }}
        />
      ) : null}
    </div>
  );
}
