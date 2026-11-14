import 'server-only';

import { withTenant } from '@/lib/db';

export interface ClinicDashboardMetrics {
  todayTotal: number;
  waiting: number;
  completed: number;
  cancelled: number;
  noShow: number;
  productionMonth: number;
  revenueMonth: number;
  expenseMonth: number;
  receivableOpen: number;
  payableOpen: number;
  pendingExams: number;
  activePatients: number;
  noShowRate: number;
}

export interface AgendaItem {
  id: string;
  scheduled_start: string;
  status: string;
  type: string;
  amount: string;
  patient_name: string;
  professional_name: string;
}

export interface PendingExamItem {
  id: string;
  order_date: string;
  status: string;
  priority: string;
  patient_name: string;
  professional_name: string;
}

export async function getUnreadNotificationCount(
  userId: string,
  clinicId: string,
): Promise<number> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const rows = await tx.query<{ total: number }>(
      `select count(*)::int as total
         from notifications
        where user_id = $1
          and read_at is null`,
      [userId],
    );
    return rows[0]?.total ?? 0;
  });
}

export async function getClinicDashboardMetrics(
  userId: string,
  clinicId: string,
  includeFinance: boolean,
): Promise<ClinicDashboardMetrics> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const appointmentRows = await tx.query<{
      today_total: number;
      waiting: number;
      completed: number;
      cancelled: number;
      no_show: number;
      production_month: string;
    }>(
      `select
         count(*) filter (where scheduled_start >= current_date and scheduled_start < current_date + interval '1 day')::int as today_total,
         count(*) filter (where scheduled_start >= current_date and scheduled_start < current_date + interval '1 day' and status = 'aguardando')::int as waiting,
         count(*) filter (where scheduled_start >= current_date and scheduled_start < current_date + interval '1 day' and status = 'realizada')::int as completed,
         count(*) filter (where scheduled_start >= current_date and scheduled_start < current_date + interval '1 day' and status = 'cancelada')::int as cancelled,
         count(*) filter (where scheduled_start >= current_date and scheduled_start < current_date + interval '1 day' and status = 'faltou')::int as no_show,
         coalesce(sum(amount) filter (
           where status = 'realizada'
             and scheduled_start >= date_trunc('month', current_date)
         ), 0)::text as production_month
       from appointments`,
    );

    const appointment = appointmentRows[0];

    const patientRows = await tx.query<{ total: number }>(
      `select count(*)::int as total from patients where status <> 'arquivado'`,
    );

    const examRows = await tx.query<{ total: number }>(
      `select count(*)::int as total
         from exam_orders
        where status in ('solicitado', 'coletado', 'em_analise')`,
    );

    let revenueMonth = 0;
    let expenseMonth = 0;
    let receivableOpen = 0;
    let payableOpen = 0;

    if (includeFinance) {
      const financeRows = await tx.query<{
        revenue_month: string;
        expense_month: string;
        receivable_open: string;
        payable_open: string;
      }>(
        `select
           coalesce(sum(amount) filter (
             where type = 'receita' and status = 'pago'
               and paid_at >= date_trunc('month', current_date)::date
           ), 0)::text as revenue_month,
           coalesce(sum(amount) filter (
             where type = 'despesa' and status = 'pago'
               and paid_at >= date_trunc('month', current_date)::date
           ), 0)::text as expense_month,
           coalesce(sum(amount) filter (
             where type = 'receita' and status in ('pendente', 'atrasado')
           ), 0)::text as receivable_open,
           coalesce(sum(amount) filter (
             where type = 'despesa' and status in ('pendente', 'atrasado')
           ), 0)::text as payable_open
         from financial_transactions`,
      );
      const finance = financeRows[0];
      revenueMonth = Number(finance?.revenue_month ?? 0);
      expenseMonth = Number(finance?.expense_month ?? 0);
      receivableOpen = Number(finance?.receivable_open ?? 0);
      payableOpen = Number(finance?.payable_open ?? 0);
    }

    const todayTotal = appointment?.today_total ?? 0;
    const noShow = appointment?.no_show ?? 0;
    const completed = appointment?.completed ?? 0;

    return {
      todayTotal,
      waiting: appointment?.waiting ?? 0,
      completed,
      cancelled: appointment?.cancelled ?? 0,
      noShow,
      productionMonth: Number(appointment?.production_month ?? 0),
      revenueMonth,
      expenseMonth,
      receivableOpen,
      payableOpen,
      pendingExams: examRows[0]?.total ?? 0,
      activePatients: patientRows[0]?.total ?? 0,
      noShowRate:
        todayTotal > 0 ? Number(((noShow / todayTotal) * 100).toFixed(1)) : 0,
    };
  });
}

export async function getTodayAgenda(
  userId: string,
  clinicId: string,
): Promise<AgendaItem[]> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<AgendaItem>(
      `select a.id,
              a.scheduled_start,
              a.status::text as status,
              a.type::text as type,
              a.amount::text as amount,
              p.full_name as patient_name,
              pr.full_name as professional_name
         from appointments a
         join patients p on p.id = a.patient_id
         join professionals pr on pr.id = a.professional_id
        where a.scheduled_start >= current_date
          and a.scheduled_start < current_date + interval '1 day'
        order by a.scheduled_start
        limit 8`,
    );
  });
}

export async function getPendingExams(
  userId: string,
  clinicId: string,
): Promise<PendingExamItem[]> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<PendingExamItem>(
      `select eo.id,
              eo.order_date,
              eo.status::text as status,
              eo.priority::text as priority,
              p.full_name as patient_name,
              pr.full_name as professional_name
         from exam_orders eo
         join patients p on p.id = eo.patient_id
         join professionals pr on pr.id = eo.professional_id
        where eo.status in ('solicitado', 'coletado', 'em_analise')
        order by
          case eo.priority when 'emergencia' then 1 when 'urgente' then 2 else 3 end,
          eo.order_date
        limit 5`,
    );
  });
}
