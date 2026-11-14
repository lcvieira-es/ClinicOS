import 'server-only';

import { withTenant } from '@/lib/db';

export interface TransactionItem {
  id: string;
  type: string;
  description: string;
  amount: string;
  due_date: string;
  paid_at: string | null;
  status: string;
  payment_method: string | null;
  category_name: string | null;
  patient_name: string | null;
  professional_name: string | null;
  created_at: string;
}

export interface FinancialSummary {
  revenueMonth: number;
  expenseMonth: number;
  receivableOpen: number;
  payableOpen: number;
}

export async function listTransactions(
  userId: string,
  clinicId: string,
  filters?: { type?: string; status?: string; from?: string; to?: string },
): Promise<TransactionItem[]> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const params: unknown[] = [];
    const conditions: string[] = [];
    if (filters?.type) {
      params.push(filters.type);
      conditions.push(`ft.type = $${params.length}::transaction_type`);
    }
    if (filters?.status) {
      params.push(filters.status);
      conditions.push(`ft.status = $${params.length}::transaction_status`);
    }
    if (filters?.from) {
      params.push(filters.from);
      conditions.push(`ft.due_date >= $${params.length}::date`);
    }
    if (filters?.to) {
      params.push(filters.to);
      conditions.push(`ft.due_date <= $${params.length}::date`);
    }
    const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
    return tx.query<TransactionItem>(
      `select ft.id,
              ft.type::text as type,
              ft.description,
              ft.amount::text as amount,
              ft.due_date::text as due_date,
              ft.paid_at::text as paid_at,
              ft.status::text as status,
              ft.payment_method::text as payment_method,
              fc.name as category_name,
              p.full_name as patient_name,
              pr.full_name as professional_name,
              ft.created_at::text as created_at
         from financial_transactions ft
         left join financial_categories fc on fc.id = ft.category_id
         left join patients p on p.id = ft.patient_id
         left join professionals pr on pr.id = ft.professional_id
         ${where}
        order by ft.due_date desc, ft.created_at desc
        limit 200`,
      params,
    );
  });
}

export async function listFinancialCategories(
  userId: string,
  clinicId: string,
  type?: string,
): Promise<Array<{ id: string; name: string; type: string }>> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const params: unknown[] = [clinicId];
    const conditions = ['(clinic_id is null or clinic_id = $1)'];
    if (type) {
      params.push(type);
      conditions.push(`type = $${params.length}::transaction_type`);
    }
    return tx.query<{ id: string; name: string; type: string }>(
      `select id, name, type::text as type
         from financial_categories
        where ${conditions.join(' and ')}
        order by name`,
      params,
    );
  });
}

export async function getFinancialSummary(
  userId: string,
  clinicId: string,
): Promise<FinancialSummary> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const rows = await tx.query<{
      revenue_month: string;
      expense_month: string;
      receivable_open: string;
      payable_open: string;
    }>(
      `select
         coalesce(sum(amount) filter (where type='receita' and status='pago' and paid_at >= date_trunc('month', current_date)::date), 0)::text as revenue_month,
         coalesce(sum(amount) filter (where type='despesa' and status='pago' and paid_at >= date_trunc('month', current_date)::date), 0)::text as expense_month,
         coalesce(sum(amount) filter (where type='receita' and status in ('pendente','atrasado')), 0)::text as receivable_open,
         coalesce(sum(amount) filter (where type='despesa' and status in ('pendente','atrasado')), 0)::text as payable_open
       from financial_transactions`,
    );
    const row = rows[0];
    return {
      revenueMonth: Number(row?.revenue_month ?? 0),
      expenseMonth: Number(row?.expense_month ?? 0),
      receivableOpen: Number(row?.receivable_open ?? 0),
      payableOpen: Number(row?.payable_open ?? 0),
    };
  });
}
