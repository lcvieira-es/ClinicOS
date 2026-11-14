import 'server-only';

import { withPlatform } from '@/lib/db';

export interface ClinicListItem {
  id: string;
  display_name: string;
  legal_name: string;
  cnpj: string | null;
  status: string;
  city: string | null;
  state: string | null;
  created_at: string;
  plan_name: string | null;
  plan_slug: string | null;
  subscription_status: string | null;
  periodicity: string | null;
}

export interface ClinicListResult {
  items: ClinicListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ClinicListFilters {
  search: string;
  status: string;
  plan: string;
  page: number;
  pageSize: number;
}

export async function listClinics(
  userId: string,
  filters: ClinicListFilters,
): Promise<ClinicListResult> {
  const { search, status, plan, page, pageSize } = filters;
  const offset = (page - 1) * pageSize;

  return withPlatform(userId, async (tx) => {
    const where = `
      where ($1 = ''
             or c.display_name ilike '%' || $1 || '%'
             or c.legal_name  ilike '%' || $1 || '%'
             or c.cnpj = $1)
        and ($2 = '' or c.status::text = $2)
        and ($3 = '' or p.slug = $3)`;

    const countRows = await tx.query<{ total: number }>(
      `select count(*)::int as total
         from clinics c
         left join subscriptions s on s.clinic_id = c.id
         left join plans p on p.id = s.plan_id
         ${where}`,
      [search, status, plan],
    );

    const items = await tx.query<ClinicListItem>(
      `select c.id,
              c.display_name,
              c.legal_name,
              c.cnpj,
              c.status::text as status,
              c.city,
              c.state::text as state,
              c.created_at,
              p.name as plan_name,
              p.slug as plan_slug,
              s.status::text as subscription_status,
              s.periodicity::text as periodicity
         from clinics c
         left join subscriptions s on s.clinic_id = c.id
         left join plans p on p.id = s.plan_id
         ${where}
        order by c.created_at desc
        limit $4 offset $5`,
      [search, status, plan, pageSize, offset],
    );

    return {
      items,
      total: countRows[0]?.total ?? 0,
      page,
      pageSize,
    };
  });
}

export interface ClinicSummary {
  total: number;
  active: number;
  settingUp: number;
  suspended: number;
}

export async function getClinicSummary(userId: string): Promise<ClinicSummary> {
  return withPlatform(userId, async (tx) => {
    const rows = await tx.query<{
      total: number;
      active: number;
      setting_up: number;
      suspended: number;
    }>(
      `select count(*)::int as total,
              count(*) filter (where status = 'ativa')::int as active,
              count(*) filter (where status = 'em_implantacao')::int as setting_up,
              count(*) filter (where status = 'suspensa')::int as suspended
         from clinics`,
    );
    const row = rows[0];
    return {
      total: row?.total ?? 0,
      active: row?.active ?? 0,
      settingUp: row?.setting_up ?? 0,
      suspended: row?.suspended ?? 0,
    };
  });
}

export interface ClinicUnitRow {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  is_headquarters: boolean;
  status: string;
}

export interface ClinicAdminRow {
  membership_id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
}

export interface ClinicSubscriptionRow {
  id: string;
  plan_id: string;
  plan_name: string;
  plan_slug: string;
  status: string;
  periodicity: string;
  price: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  gateway: string;
  started_at: string;
}

export interface ClinicModuleRow {
  id: string;
  key: string;
  name: string;
  category: string;
  source: string;
  enabled: boolean;
  price: string;
  is_core: boolean;
}

export interface ClinicInvoiceRow {
  id: string;
  amount: string;
  due_date: string;
  paid_at: string | null;
  status: string;
  created_at: string;
}

export interface ClinicDetail {
  clinic: {
    id: string;
    display_name: string;
    legal_name: string;
    trade_name: string | null;
    cnpj: string | null;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    address: string | null;
    address_number: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    status: string;
    portal_slug: string | null;
    created_at: string;
    notes: string | null;
  };
  units: ClinicUnitRow[];
  admins: ClinicAdminRow[];
  subscription: ClinicSubscriptionRow | null;
  modules: ClinicModuleRow[];
  invoices: ClinicInvoiceRow[];
}

export async function getClinicDetail(
  userId: string,
  clinicId: string,
): Promise<ClinicDetail | null> {
  return withPlatform(userId, async (tx) => {
    const clinicRows = await tx.query<ClinicDetail['clinic']>(
      `select id, display_name, legal_name, trade_name, cnpj, email, phone, whatsapp,
              address, address_number, neighborhood, city, state::text as state,
              status::text as status, portal_slug, created_at, notes
         from clinics
        where id = $1
        limit 1`,
      [clinicId],
    );
    const clinic = clinicRows[0];
    if (!clinic) return null;

    const [units, admins, subscriptionRows, modules, invoices] = await Promise.all([
      tx.query<ClinicUnitRow>(
        `select id, name, city, state::text as state, is_headquarters, status
           from clinic_units
          where clinic_id = $1
          order by is_headquarters desc, name`,
        [clinicId],
      ),
      tx.query<ClinicAdminRow>(
        `select m.id as membership_id,
                m.user_id,
                u.full_name,
                u.email,
                m.role::text as role,
                m.status::text as status
           from clinic_memberships m
           join users u on u.id = m.user_id
          where m.clinic_id = $1
            and m.role = 'clinic_admin'
          order by u.full_name`,
        [clinicId],
      ),
      tx.query<ClinicSubscriptionRow>(
        `select s.id,
                s.plan_id,
                p.name as plan_name,
                p.slug as plan_slug,
                s.status::text as status,
                s.periodicity::text as periodicity,
                s.price::text as price,
                s.trial_ends_at,
                s.current_period_end,
                s.gateway::text as gateway,
                s.started_at
           from subscriptions s
           join plans p on p.id = s.plan_id
          where s.clinic_id = $1
          limit 1`,
        [clinicId],
      ),
      tx.query<ClinicModuleRow>(
        `select m.id,
                m.key,
                m.name,
                m.category::text as category,
                cm.source::text as source,
                cm.enabled,
                cm.price::text as price,
                m.is_core
           from clinic_modules cm
           join modules m on m.id = cm.module_id
          where cm.clinic_id = $1
          order by m.sort_order, m.name`,
        [clinicId],
      ),
      tx.query<ClinicInvoiceRow>(
        `select id, amount::text as amount, due_date, paid_at, status::text as status, created_at
           from subscription_invoices
          where clinic_id = $1
          order by due_date desc
          limit 12`,
        [clinicId],
      ),
    ]);

    return {
      clinic,
      units,
      admins,
      subscription: subscriptionRows[0] ?? null,
      modules,
      invoices,
    };
  });
}

export interface PlanListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthly_price: string;
  annual_price: string;
  user_limit: number;
  professional_limit: number;
  unit_limit: number;
  patient_limit: number;
  storage_gb: number;
  ai_interaction_limit: number;
  message_limit: number;
  trial_days: number;
  is_active: boolean;
  sort_order: number;
  module_count: number;
  active_subscriptions: number;
}

export async function listPlans(userId: string): Promise<PlanListItem[]> {
  return withPlatform(userId, async (tx) => {
    return tx.query<PlanListItem>(
      `select p.id,
              p.name,
              p.slug,
              p.description,
              p.monthly_price::text as monthly_price,
              p.annual_price::text as annual_price,
              p.user_limit,
              p.professional_limit,
              p.unit_limit,
              p.patient_limit,
              p.storage_gb,
              p.ai_interaction_limit,
              p.message_limit,
              p.trial_days,
              p.is_active,
              p.sort_order,
              (select count(*)::int from plan_modules pm where pm.plan_id = p.id) as module_count,
              (select count(*)::int from subscriptions s
                where s.plan_id = p.id and s.status = 'ativa') as active_subscriptions
         from plans p
        order by p.sort_order, p.name`,
    );
  });
}

export interface PlanModuleItem {
  planId: string;
  moduleId: string;
}

export async function listPlanModules(userId: string): Promise<PlanModuleItem[]> {
  return withPlatform(userId, async (tx) => {
    return tx.query<PlanModuleItem>(
      `select plan_id as "planId", module_id as "moduleId" from plan_modules`,
    );
  });
}

export interface ModuleCatalogItem {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  audience: string;
  icon: string | null;
  route: string | null;
  is_core: boolean;
  is_plan: boolean;
  is_active: boolean;
  sort_order: number;
  adoption: number;
  features: Array<{ id: string; name: string; description: string | null }>;
}

export async function listModuleCatalog(userId: string): Promise<ModuleCatalogItem[]> {
  return withPlatform(userId, async (tx) => {
    const modules = await tx.query<Omit<ModuleCatalogItem, 'features' | 'adoption'>>(
      `select m.id, m.key, m.name, m.description, m.category::text as category,
              m.audience::text as audience, m.icon, m.route, m.is_core, m.is_plan,
              m.is_active, m.sort_order
         from modules m
        where m.audience = 'clinica'
        order by m.category, m.sort_order, m.name`,
    );

    if (modules.length === 0) return [];

    const ids = modules.map((module) => module.id);

    const [features, adoptionRows] = await Promise.all([
      tx.query<{ module_id: string; id: string; name: string; description: string | null }>(
        `select module_id, id, name, description
           from module_features
          where module_id = any($1::uuid[])
          order by sort_order, name`,
        [ids],
      ),
      tx.query<{ module_id: string; adoption: number }>(
        `select module_id, count(*)::int as adoption
           from clinic_modules
          where enabled = true
          group by module_id`,
      ),
    ]);

    const featuresByModule = new Map<string, ModuleCatalogItem['features']>();
    for (const feature of features) {
      const list = featuresByModule.get(feature.module_id) ?? [];
      list.push(feature);
      featuresByModule.set(feature.module_id, list);
    }

    const adoptionByModule = new Map(
      adoptionRows.map((row) => [row.module_id, row.adoption]),
    );

    return modules.map((module) => ({
      ...module,
      adoption: adoptionByModule.get(module.id) ?? 0,
      features: featuresByModule.get(module.id) ?? [],
    }));
  });
}

export interface SubscriptionListItem {
  id: string;
  clinic_id: string;
  clinic_name: string;
  plan_id: string;
  plan_name: string;
  plan_slug: string;
  status: string;
  periodicity: string;
  price: string;
  started_at: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  open_invoice_id: string | null;
}

export interface SubscriptionListFilters {
  search: string;
  status: string;
  page: number;
  pageSize: number;
}

export async function listSubscriptions(
  userId: string,
  filters: SubscriptionListFilters,
): Promise<{ items: SubscriptionListItem[]; total: number; page: number; pageSize: number }> {
  const { search, status, page, pageSize } = filters;
  const offset = (page - 1) * pageSize;

  return withPlatform(userId, async (tx) => {
    const where = `
      where ($1 = ''
             or c.display_name ilike '%' || $1 || '%'
             or c.legal_name  ilike '%' || $1 || '%'
             or c.cnpj = $1)
        and ($2 = '' or s.status::text = $2)`;

    const countRows = await tx.query<{ total: number }>(
      `select count(*)::int as total
         from subscriptions s
         join clinics c on c.id = s.clinic_id
         ${where}`,
      [search, status],
    );

    const items = await tx.query<SubscriptionListItem>(
      `select s.id,
              s.clinic_id,
              c.display_name as clinic_name,
              s.plan_id,
              p.name as plan_name,
              p.slug as plan_slug,
              s.status::text as status,
              s.periodicity::text as periodicity,
              s.price::text as price,
              s.started_at,
              s.trial_ends_at,
              s.current_period_end,
              (
                select i.id
                  from subscription_invoices i
                 where i.subscription_id = s.id
                   and i.status in ('aberta', 'vencida')
                 order by i.due_date
                 limit 1
              ) as open_invoice_id
         from subscriptions s
         join clinics c on c.id = s.clinic_id
         join plans p on p.id = s.plan_id
         ${where}
        order by s.current_period_end nulls last, c.display_name
        limit $3 offset $4`,
      [search, status, pageSize, offset],
    );

    return { items, total: countRows[0]?.total ?? 0, page, pageSize };
  });
}

export interface InvoiceListItem {
  id: string;
  clinic_id: string;
  clinic_name: string;
  plan_name: string;
  amount: string;
  due_date: string;
  paid_at: string | null;
  status: string;
}

export interface InvoiceSummary {
  openTotal: number;
  openAmount: number;
  overdueTotal: number;
  overdueAmount: number;
  paidMonth: number;
  paidMonthAmount: number;
}

export async function listInvoices(
  userId: string,
  filters: { status: string; search: string; page: number; pageSize: number },
): Promise<{ items: InvoiceListItem[]; total: number; page: number; pageSize: number }> {
  const { status, search, page, pageSize } = filters;
  const offset = (page - 1) * pageSize;

  return withPlatform(userId, async (tx) => {
    const where = `
      where ($1 = '' or i.status::text = $1)
        and ($2 = ''
             or c.display_name ilike '%' || $2 || '%'
             or c.legal_name  ilike '%' || $2 || '%')`;

    const countRows = await tx.query<{ total: number }>(
      `select count(*)::int as total
         from subscription_invoices i
         join clinics c on c.id = i.clinic_id
         ${where}`,
      [status, search],
    );

    const items = await tx.query<InvoiceListItem>(
      `select i.id,
              i.clinic_id,
              c.display_name as clinic_name,
              p.name as plan_name,
              i.amount::text as amount,
              i.due_date,
              i.paid_at,
              i.status::text as status
         from subscription_invoices i
         join clinics c on c.id = i.clinic_id
         join subscriptions s on s.id = i.subscription_id
         join plans p on p.id = s.plan_id
         ${where}
        order by i.due_date desc
        limit $3 offset $4`,
      [status, search, pageSize, offset],
    );

    return { items, total: countRows[0]?.total ?? 0, page, pageSize };
  });
}

export async function getInvoiceSummary(userId: string): Promise<InvoiceSummary> {
  return withPlatform(userId, async (tx) => {
    const rows = await tx.query<{
      open_total: number;
      open_amount: string;
      overdue_total: number;
      overdue_amount: string;
      paid_month: number;
      paid_month_amount: string;
    }>(
      `select
         count(*) filter (where status in ('aberta', 'vencida'))::int as open_total,
         coalesce(sum(amount) filter (where status in ('aberta', 'vencida')), 0)::text as open_amount,
         count(*) filter (where status = 'vencida')::int as overdue_total,
         coalesce(sum(amount) filter (where status = 'vencida'), 0)::text as overdue_amount,
         count(*) filter (where status = 'paga' and paid_at >= date_trunc('month', current_date)::date)::int as paid_month,
         coalesce(sum(amount) filter (where status = 'paga' and paid_at >= date_trunc('month', current_date)::date), 0)::text as paid_month_amount
       from subscription_invoices`,
    );
    const row = rows[0];
    return {
      openTotal: row?.open_total ?? 0,
      openAmount: Number(row?.open_amount ?? 0),
      overdueTotal: row?.overdue_total ?? 0,
      overdueAmount: Number(row?.overdue_amount ?? 0),
      paidMonth: row?.paid_month ?? 0,
      paidMonthAmount: Number(row?.paid_month_amount ?? 0),
    };
  });
}

export interface PlatformReportData {
  mrrByPlan: Array<{ name: string; slug: string; subscriptions: number; mrr: string }>;
  subscriptionsByStatus: Array<{ status: string; count: number }>;
  moduleAdoption: Array<{ name: string; key: string; adoption: number }>;
  renewals30: Array<{
    clinic_name: string;
    plan_name: string;
    periodicity: string;
    current_period_end: string | null;
    amount: string;
  }>;
}

export async function getPlatformReports(userId: string): Promise<PlatformReportData> {
  return withPlatform(userId, async (tx) => {
    const [mrrByPlan, subscriptionsByStatus, moduleAdoption, renewals30] = await Promise.all([
      tx.query<{ name: string; slug: string; subscriptions: number; mrr: string }>(
        `select p.name,
                p.slug,
                count(s.id) filter (where s.status = 'ativa')::int as subscriptions,
                coalesce(sum(
                  case when periodicity = 'anual' then price / 12 else price end
                ) filter (where s.status = 'ativa'), 0)::text as mrr
           from plans p
           left join subscriptions s on s.plan_id = p.id
          group by p.id, p.name, p.slug, p.sort_order
          order by p.sort_order`,
      ),
      tx.query<{ status: string; count: number }>(
        `select status::text as status, count(*)::int as count
           from subscriptions
          group by status
          order by status`,
      ),
      tx.query<{ name: string; key: string; adoption: number }>(
        `select m.name,
                m.key,
                count(cm.id) filter (where cm.enabled)::int as adoption
           from modules m
           left join clinic_modules cm on cm.module_id = m.id
          where m.audience = 'clinica'
          group by m.id, m.name, m.key, m.sort_order
          order by adoption desc, m.sort_order
          limit 12`,
      ),
      tx.query<{
        clinic_name: string;
        plan_name: string;
        periodicity: string;
        current_period_end: string | null;
        amount: string;
      }>(
        `select c.display_name as clinic_name,
                p.name as plan_name,
                s.periodicity::text as periodicity,
                s.current_period_end,
                s.price::text as amount
           from subscriptions s
           join clinics c on c.id = s.clinic_id
           join plans p on p.id = s.plan_id
          where s.status in ('ativa', 'em_teste', 'inadimplente', 'vencida')
            and s.current_period_end between current_date and current_date + 30
          order by s.current_period_end`,
      ),
    ]);

    return { mrrByPlan, subscriptionsByStatus, moduleAdoption, renewals30 };
  });
}

export interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  defaultTrialDays: number;
  defaultGateway: string;
  defaultPeriodicity: string;
  whatsappMode: string;
  aiGuardrails: { diagnosis: boolean; prescribing: boolean; human_review: boolean };
}

export async function getPlatformSettings(userId: string): Promise<PlatformSettings> {
  return withPlatform(userId, async (tx) => {
    const rows = await tx.query<{ key: string; value: Record<string, unknown> }>(
      `select key, value from platform_settings`,
    );

    const map = new Map(rows.map((row) => [row.key, row.value]));
    const str = (key: string, fallback: string) =>
      String((map.get(key)?.value as string | number | undefined) ?? fallback);
    const num = (key: string, fallback: number) =>
      Number((map.get(key)?.value as string | number | undefined) ?? fallback);

    const guardrails = (map.get('platform.ai_guardrails') ?? {}) as Record<string, unknown>;

    return {
      platformName: str('platform.name', 'ClinicOS'),
      supportEmail: str('platform.support_email', ''),
      defaultTrialDays: num('platform.default_trial_days', 14),
      defaultGateway: str('platform.default_gateway', 'manual'),
      defaultPeriodicity: str('platform.default_periodicity', 'mensal'),
      whatsappMode: str('platform.whatsapp_mode', 'manual'),
      aiGuardrails: {
        diagnosis: Boolean(guardrails.diagnosis ?? false),
        prescribing: Boolean(guardrails.prescribing ?? false),
        human_review: Boolean(guardrails.human_review ?? true),
      },
    };
  });
}

export async function getAddableModules(
  userId: string,
  clinicId: string,
): Promise<Array<{ id: string; key: string; name: string; category: string }>> {
  return withPlatform(userId, async (tx) => {
    return tx.query(
      `select m.id, m.key, m.name, m.category::text as category
         from modules m
        where m.audience = 'clinica'
          and m.is_active = true
          and m.is_core = false
          and not exists (
            select 1
              from clinic_modules cm
             where cm.clinic_id = $1
               and cm.module_id = m.id
               and cm.enabled = true
          )
        order by m.sort_order, m.name`,
      [clinicId],
    );
  });
}
