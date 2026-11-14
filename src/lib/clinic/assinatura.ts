import 'server-only';

import { withTenant } from '@/lib/db';

export interface ClinicSubscriptionInfo {
  planName: string | null;
  planSlug: string | null;
  status: string | null;
  periodicity: string | null;
  price: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  limits: {
    userLimit: number;
    professionalLimit: number;
    unitLimit: number;
    patientLimit: number;
  };
  modules: Array<{ key: string; name: string }>;
  invoices: Array<{
    id: string;
    amount: string;
    status: string;
    due_date: string;
    paid_at: string | null;
  }>;
}

export async function getClinicSubscriptionInfo(
  userId: string,
  clinicId: string,
): Promise<ClinicSubscriptionInfo> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const subs = await tx.query<{
      plan_name: string | null;
      plan_slug: string | null;
      status: string | null;
      periodicity: string | null;
      price: string | null;
      current_period_start: string | null;
      current_period_end: string | null;
      user_limit: number;
      professional_limit: number;
      unit_limit: number;
      patient_limit: number;
    }>(
      `select p.name as plan_name, p.slug as plan_slug, s.status::text as status,
              s.periodicity::text as periodicity, s.price::text as price,
              s.current_period_start::text as current_period_start,
              s.current_period_end::text as current_period_end,
              p.user_limit, p.professional_limit, p.unit_limit, p.patient_limit
         from subscriptions s
         left join plans p on p.id = s.plan_id
        where s.clinic_id = $1
        order by s.current_period_end desc nulls last, s.started_at desc
        limit 1`,
      [clinicId],
    );

    const sub = subs[0];

    const modules = await tx.query<{ key: string; name: string }>(
      `select m.key, m.name
         from clinic_modules cm
         join modules m on m.id = cm.module_id
        where cm.clinic_id = $1 and cm.enabled = true
        order by m.name`,
      [clinicId],
    );

    const invoices = await tx.query<{
      id: string;
      amount: string;
      status: string;
      due_date: string;
      paid_at: string | null;
    }>(
      `select id, amount::text as amount, status::text as status, due_date::text as due_date, paid_at::text as paid_at
         from subscription_invoices
        where clinic_id = $1
        order by due_date desc
        limit 20`,
      [clinicId],
    );

    return {
      planName: sub?.plan_name ?? null,
      planSlug: sub?.plan_slug ?? null,
      status: sub?.status ?? null,
      periodicity: sub?.periodicity ?? null,
      price: sub?.price ?? null,
      currentPeriodStart: sub?.current_period_start ?? null,
      currentPeriodEnd: sub?.current_period_end ?? null,
      limits: {
        userLimit: sub?.user_limit ?? 0,
        professionalLimit: sub?.professional_limit ?? 0,
        unitLimit: sub?.unit_limit ?? 0,
        patientLimit: sub?.patient_limit ?? 0,
      },
      modules,
      invoices,
    };
  });
}
