import 'server-only';

import { withPlatform } from '@/lib/db';

export interface PlatformMetrics {
  clinicsTotal: number;
  clinicsActive: number;
  clinicsSetup: number;
  clinicsSuspended: number;
  subscriptionsActive: number;
  subscriptionsOverdue: number;
  mrr: number;
  arr: number;
  ticket: number;
  openInvoices: number;
  overdueAmount: number;
  renewals30: number;
  plansActive: number;
  modulesActive: number;
}

export interface PlanDistributionRow {
  name: string;
  slug: string;
  clinics: number;
  revenue: number;
}

export interface RenewalRow {
  id: string;
  clinic_name: string;
  plan_name: string;
  status: string;
  price: string;
  periodicity: string;
  current_period_end: string | null;
}

export interface RecentClinicRow {
  id: string;
  display_name: string;
  status: string;
  created_at: string;
  plan_name: string | null;
  subscription_status: string | null;
}

export async function getPlatformMetrics(userId: string): Promise<PlatformMetrics> {
  return withPlatform(userId, async (tx) => {
    const rows = await tx.query<{
      clinics_total: number;
      clinics_active: number;
      clinics_setup: number;
      clinics_suspended: number;
      subscriptions_active: number;
      subscriptions_overdue: number;
      mrr: string;
      arr: string;
      open_invoices: number;
      overdue_amount: string;
      renewals_30: number;
      plans_active: number;
      modules_active: number;
    }>(
      `select
         (select count(*) from clinics)::int as clinics_total,
         (select count(*) from clinics where status = 'ativa')::int as clinics_active,
         (select count(*) from clinics where status = 'em_implantacao')::int as clinics_setup,
         (select count(*) from clinics where status = 'suspensa')::int as clinics_suspended,
         (select count(*) from subscriptions where status = 'ativa')::int as subscriptions_active,
         (select count(*) from subscriptions where status in ('inadimplente', 'vencida'))::int as subscriptions_overdue,
         (
           select coalesce(sum(
             case when periodicity = 'anual' then price / 12 else price end
           ), 0)
             from subscriptions
            where status = 'ativa'
         )::text as mrr,
         (
           select coalesce(sum(
             case when periodicity = 'anual' then price else price * 12 end
           ), 0)
             from subscriptions
            where status = 'ativa'
         )::text as arr,
         (select count(*) from subscription_invoices where status in ('aberta', 'vencida'))::int as open_invoices,
         (select coalesce(sum(amount), 0) from subscription_invoices where status = 'vencida')::text as overdue_amount,
         (
           select count(*)
             from subscription_invoices
            where status in ('aberta', 'vencida')
              and due_date between current_date and current_date + 30
         )::int as renewals_30,
         (select count(*) from plans where is_active = true)::int as plans_active,
         (select count(*) from modules where is_active = true)::int as modules_active`,
    );

    const row = rows[0];
    const mrr = Number(row?.mrr ?? 0);
    const arr = Number(row?.arr ?? 0);
    const subscriptionsActive = row?.subscriptions_active ?? 0;

    return {
      clinicsTotal: row?.clinics_total ?? 0,
      clinicsActive: row?.clinics_active ?? 0,
      clinicsSetup: row?.clinics_setup ?? 0,
      clinicsSuspended: row?.clinics_suspended ?? 0,
      subscriptionsActive,
      subscriptionsOverdue: row?.subscriptions_overdue ?? 0,
      mrr,
      arr,
      ticket: subscriptionsActive > 0 ? mrr / subscriptionsActive : 0,
      openInvoices: row?.open_invoices ?? 0,
      overdueAmount: Number(row?.overdue_amount ?? 0),
      renewals30: row?.renewals_30 ?? 0,
      plansActive: row?.plans_active ?? 0,
      modulesActive: row?.modules_active ?? 0,
    };
  });
}

export async function getPlanDistribution(
  userId: string,
): Promise<PlanDistributionRow[]> {
  return withPlatform(userId, async (tx) => {
    const rows = await tx.query<{
      name: string;
      slug: string;
      clinics: number;
      revenue: string;
    }>(
      `select p.name,
              p.slug,
              count(s.id) filter (where s.status in ('ativa', 'em_teste'))::int as clinics,
              coalesce(sum(
                case when s.status = 'ativa'
                  then case when s.periodicity = 'anual' then s.price / 12 else s.price end
                  else 0
                end
              ), 0)::text as revenue
         from plans p
         left join subscriptions s on s.plan_id = p.id
        group by p.id, p.name, p.slug, p.sort_order
        order by p.sort_order`,
    );

    return rows.map((row) => ({
      name: row.name,
      slug: row.slug,
      clinics: row.clinics,
      revenue: Number(row.revenue),
    }));
  });
}

export async function getUpcomingRenewals(userId: string): Promise<RenewalRow[]> {
  return withPlatform(userId, async (tx) => {
    return tx.query<RenewalRow>(
      `select s.id,
              c.display_name as clinic_name,
              p.name as plan_name,
              s.status::text as status,
              s.price::text as price,
              s.periodicity::text as periodicity,
              s.current_period_end
         from subscriptions s
         join clinics c on c.id = s.clinic_id
         join plans p on p.id = s.plan_id
        where s.status in ('ativa', 'em_teste', 'inadimplente', 'vencida')
        order by s.current_period_end nulls last
        limit 6`,
    );
  });
}

export async function getRecentClinics(userId: string): Promise<RecentClinicRow[]> {
  return withPlatform(userId, async (tx) => {
    return tx.query<RecentClinicRow>(
      `select c.id,
              c.display_name,
              c.status::text as status,
              c.created_at,
              p.name as plan_name,
              s.status::text as subscription_status
         from clinics c
         left join subscriptions s on s.clinic_id = c.id
         left join plans p on p.id = s.plan_id
        order by c.created_at desc
        limit 6`,
    );
  });
}

export async function getPlatformNotificationCount(userId: string): Promise<number> {
  return withPlatform(userId, async (tx) => {
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
