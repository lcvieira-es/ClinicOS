'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { requirePlatformAdmin } from '@/lib/auth/guards';
import { withPlatform } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';

export interface WizardState {
  error?: string;
  success?: boolean;
  temporaryPassword?: string | null;
  passwordCreated?: boolean;
  clinicId?: string;
  clinicName?: string;
  adminEmail?: string;
}

const wizardSchema = z.object({
  clinic: z.object({
    legalName: z.string().trim().min(3, 'Razão social obrigatória.'),
    tradeName: z.string().trim().optional(),
    displayName: z.string().trim().min(2, 'Nome de exibição obrigatório.'),
    cnpj: z
      .string()
      .trim()
      .regex(/^\d{14}$/, 'CNPJ deve conter 14 dígitos.')
      .or(z.literal(''))
      .optional(),
    email: z.string().trim().email('E-mail inválido.').or(z.literal('')).optional(),
    phone: z.string().trim().optional(),
    whatsapp: z.string().trim().optional(),
    cep: z.string().trim().optional(),
    address: z.string().trim().min(3, 'Endereço obrigatório.'),
    addressNumber: z.string().trim().min(1, 'Número obrigatório.'),
    neighborhood: z.string().trim().optional(),
    city: z.string().trim().min(2, 'Cidade obrigatória.'),
    state: z.string().trim().regex(/^[A-Z]{2}$/, 'UF inválida (2 letras).'),
    notes: z.string().trim().optional(),
  }),
  unit: z.object({
    name: z.string().trim().min(2, 'Nome da unidade obrigatório.'),
    internalCode: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    email: z.string().trim().email('E-mail da unidade inválido.').or(z.literal('')).optional(),
    cep: z.string().trim().optional(),
    address: z.string().trim().optional(),
    addressNumber: z.string().trim().optional(),
    neighborhood: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z
      .string()
      .trim()
      .regex(/^[A-Z]{2}$/, 'UF inválida.')
      .or(z.literal(''))
      .optional(),
    openingHours: z.string().trim().optional(),
  }),
  admin: z.object({
    fullName: z.string().trim().min(3, 'Nome do administrador obrigatório.'),
    email: z.string().trim().email('E-mail do administrador inválido.'),
  }),
  subscription: z.object({
    planSlug: z.string().trim().min(1, 'Selecione um plano.'),
    periodicity: z.enum(['mensal', 'anual']),
  }),
});

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function generateTemporaryPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  const bytes = randomBytes(16);
  let password = '';
  for (const byte of bytes) {
    password += alphabet[byte % alphabet.length];
  }
  return password;
}

export async function createClinicAction(
  _previous: WizardState,
  formData: FormData,
): Promise<WizardState> {
  const user = await requirePlatformAdmin();

  let payload: unknown;
  try {
    payload = JSON.parse(String(formData.get('payload') ?? ''));
  } catch {
    return { error: 'Dados do assistente inválidos.' };
  }

  const parsed = wizardSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  const { clinic, unit, admin, subscription } = parsed.data;

  try {
    const result = await withPlatform(user.id, async (tx) => {
      const planRows = await tx.query<{
        id: string;
        name: string;
        monthly_price: string;
        annual_price: string;
        trial_days: number;
        is_active: boolean;
      }>(
        `select id, name, monthly_price::text as monthly_price, annual_price::text as annual_price,
                trial_days, is_active
           from plans
          where slug = $1
          limit 1`,
        [subscription.planSlug],
      );
      const plan = planRows[0];
      if (!plan || !plan.is_active) {
        throw new Error('Plano selecionado não está disponível.');
      }

      const portalSlug = `${slugify(clinic.displayName) || 'clinica'}-${randomBytes(3).toString('hex')}`;

      const clinicRows = await tx.query<{ id: string }>(
        `insert into clinics
           (legal_name, trade_name, display_name, cnpj, email, phone, whatsapp,
            cep, address, address_number, neighborhood, city, state,
            status, portal_slug, notes, settings)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::char(2),
                 'em_implantacao', $14, $15, '{"demo": false}'::jsonb)
         returning id`,
        [
          clinic.legalName,
          clinic.tradeName || null,
          clinic.displayName,
          clinic.cnpj || null,
          clinic.email || null,
          clinic.phone || null,
          clinic.whatsapp || null,
          clinic.cep || null,
          clinic.address,
          clinic.addressNumber,
          clinic.neighborhood || null,
          clinic.city,
          clinic.state,
          portalSlug,
          clinic.notes || null,
        ],
      );
      const clinicId = clinicRows[0].id;

      const unitRows = await tx.query<{ id: string }>(
        `insert into clinic_units
           (clinic_id, name, type, internal_code, phone, email,
            cep, address, address_number, neighborhood, city, state,
            opening_hours, is_headquarters, status)
         values ($1, $2, 'matriz', $3, $4, $5,
                 $6, $7, $8, $9, $10, $11::char(2),
                 $12, true, 'ativa')
         returning id`,
        [
          clinicId,
          unit.name,
          unit.internalCode || 'MATRIZ-01',
          unit.phone || null,
          unit.email || null,
          unit.cep || null,
          unit.address || clinic.address,
          unit.addressNumber || clinic.addressNumber,
          unit.neighborhood || clinic.neighborhood || null,
          unit.city || clinic.city,
          unit.state || clinic.state,
          unit.openingHours || 'Segunda a sexta, 08h às 18h',
        ],
      );
      const unitId = unitRows[0].id;

      // Administrador: reutiliza usuário existente ou cria um novo com senha temporária.
      let adminUserId: string;
      let temporaryPassword: string | null = null;
      let passwordCreated = false;

      const existing = await tx.query<{ id: string }>(
        `select id from users where lower(email) = lower($1) limit 1`,
        [admin.email],
      );

      if (existing[0]) {
        adminUserId = existing[0].id;
      } else {
        temporaryPassword = generateTemporaryPassword();
        const passwordHash = await hashPassword(temporaryPassword);
        const created = await tx.query<{ id: string }>(
          `insert into users (email, password_hash, full_name, status)
           values (lower($1), $2, $3, 'ativo')
           returning id`,
          [admin.email, passwordHash, admin.fullName],
        );
        adminUserId = created[0].id;
        passwordCreated = true;
      }

      const membershipRows = await tx.query<{ id: string }>(
        `insert into clinic_memberships (clinic_id, user_id, role, status, job_title, hired_at, invited_by)
         values ($1, $2, 'clinic_admin', 'ativo', 'Administrador(a)', current_date, $3)
         on conflict (clinic_id, user_id) do update
           set status = 'ativo',
               role = 'clinic_admin',
               updated_at = now()
         returning id`,
        [clinicId, adminUserId, user.id],
      );
      const membershipId = membershipRows[0].id;

      await tx.query(
        `insert into membership_units (membership_id, unit_id, clinic_id)
         values ($1, $2, $3)
         on conflict do nothing`,
        [membershipId, unitId, clinicId],
      );

      const monthlyPrice =
        subscription.periodicity === 'anual'
          ? Number(plan.annual_price)
          : Number(plan.monthly_price);

      await tx.query(
        `insert into subscriptions
           (clinic_id, plan_id, status, periodicity, price, started_at,
            current_period_start, current_period_end, trial_ends_at, gateway, created_by)
         values ($1, $2, 'em_teste', $3::billing_period, $4, current_date,
                 current_date, current_date + $5::int, current_date + $5::int, 'manual', $6)`,
        [
          clinicId,
          plan.id,
          subscription.periodicity,
          monthlyPrice,
          plan.trial_days,
          user.id,
        ],
      );

      // Módulos do plano → entitlements da clínica
      await tx.query(
        `insert into clinic_modules (clinic_id, module_id, enabled, source, price, activated_at, created_by)
         select $1, pm.module_id, true, 'plano', 0, now(), $2
           from plan_modules pm
          where pm.plan_id = $3
         on conflict (clinic_id, module_id) do update
           set enabled = true,
               source = 'plano',
               activated_at = coalesce(clinic_modules.activated_at, now())`,
        [clinicId, user.id, plan.id],
      );

      return { clinicId, temporaryPassword, passwordCreated };
    });

    revalidatePath('/admin/clinicas');
    revalidatePath('/admin');

    return {
      success: true,
      clinicId: result.clinicId,
      clinicName: clinic.displayName,
      adminEmail: admin.email.toLowerCase(),
      temporaryPassword: result.temporaryPassword,
      passwordCreated: result.passwordCreated,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? `Não foi possível criar a clínica: ${error.message}`
          : 'Não foi possível criar a clínica.',
    };
  }
}

export interface SimpleState {
  error?: string;
  success?: string;
}

export async function toggleClinicStatusAction(formData: FormData): Promise<void> {
  const user = await requirePlatformAdmin();
  const clinicId = String(formData.get('clinicId') ?? '');
  const next = String(formData.get('next') ?? '');

  if (!clinicId || (next !== 'ativa' && next !== 'suspensa')) return;

  await withPlatform(user.id, async (tx) => {
    await tx.query(
      `update clinics set status = $2::clinic_status, updated_at = now() where id = $1`,
      [clinicId, next],
    );
    await tx.query(
      `update subscriptions
          set status = case when $2 = 'suspensa'
                            then 'suspensa'::subscription_status
                            else 'ativa'::subscription_status
                       end,
              updated_at = now()
        where clinic_id = $1
          and status in ('ativa', 'em_teste', 'suspensa')`,
      [clinicId, next],
    );
  });

  revalidatePath(`/admin/clinicas/${clinicId}`);
  revalidatePath('/admin/clinicas');
  revalidatePath('/admin');
}

const changePlanSchema = z.object({
  clinicId: z.string().uuid(),
  planId: z.string().uuid(),
  periodicity: z.enum(['mensal', 'anual']),
});

export async function changeSubscriptionPlanAction(
  _previous: SimpleState,
  formData: FormData,
): Promise<SimpleState> {
  const user = await requirePlatformAdmin();

  const parsed = changePlanSchema.safeParse({
    clinicId: formData.get('clinicId'),
    planId: formData.get('planId'),
    periodicity: formData.get('periodicity'),
  });
  if (!parsed.success) return { error: 'Dados inválidos.' };

  const { clinicId, planId, periodicity } = parsed.data;

  try {
    await withPlatform(user.id, async (tx) => {
      const planRows = await tx.query<{
        monthly_price: string;
        annual_price: string;
        is_active: boolean;
      }>(
        `select monthly_price::text as monthly_price, annual_price::text as annual_price, is_active
           from plans where id = $1 limit 1`,
        [planId],
      );
      const plan = planRows[0];
      if (!plan || !plan.is_active) {
        throw new Error('Plano não disponível.');
      }
      const price =
        periodicity === 'anual' ? Number(plan.annual_price) : Number(plan.monthly_price);

      const updated = await tx.query(
        `update subscriptions
            set plan_id = $2, periodicity = $3::billing_period, price = $4, updated_at = now()
          where clinic_id = $1`,
        [clinicId, planId, periodicity, price],
      );
      void updated;

      await tx.query(
        `delete from clinic_modules
          where clinic_id = $1 and source = 'plano'`,
        [clinicId],
      );

      await tx.query(
        `insert into clinic_modules (clinic_id, module_id, enabled, source, price, activated_at, created_by)
         select $1, pm.module_id, true, 'plano', 0, now(), $2
           from plan_modules pm
          where pm.plan_id = $3`,
        [clinicId, user.id, planId],
      );
    });

    revalidatePath(`/admin/clinicas/${clinicId}`);
    revalidatePath('/admin/assinaturas');
    revalidatePath('/admin');
    return { success: 'Plano atualizado. Módulos recalculados.' };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? `Não foi possível alterar o plano: ${error.message}`
          : 'Não foi possível alterar o plano.',
    };
  }
}

export async function addClinicModuleAction(
  _previous: SimpleState,
  formData: FormData,
): Promise<SimpleState> {
  const user = await requirePlatformAdmin();
  const clinicId = String(formData.get('clinicId') ?? '');
  const moduleId = String(formData.get('moduleId') ?? '');
  const price = Number(String(formData.get('price') ?? '0').replace(',', '.'));

  if (!clinicId || !moduleId || Number.isNaN(price) || price < 0) {
    return { error: 'Dados inválidos.' };
  }

  try {
    await withPlatform(user.id, async (tx) => {
      await tx.query(
        `insert into clinic_modules (clinic_id, module_id, enabled, source, price, activated_at, created_by)
         values ($1, $2, true, 'adicional', $3, now(), $4)
         on conflict (clinic_id, module_id) do update
           set enabled = true,
               source = 'adicional',
               price = excluded.price,
               expires_at = null,
               activated_at = coalesce(clinic_modules.activated_at, now())`,
        [clinicId, moduleId, price, user.id],
      );
    });

    revalidatePath(`/admin/clinicas/${clinicId}`);
    return { success: 'Módulo adicional ativado.' };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? `Não foi possível ativar o módulo: ${error.message}`
          : 'Não foi possível ativar o módulo.',
    };
  }
}

export async function removeClinicModuleAction(formData: FormData): Promise<void> {
  const user = await requirePlatformAdmin();
  const clinicId = String(formData.get('clinicId') ?? '');
  const moduleId = String(formData.get('moduleId') ?? '');
  if (!clinicId || !moduleId) return;

  await withPlatform(user.id, async (tx) => {
    await tx.query(
      `delete from clinic_modules
        where clinic_id = $1 and module_id = $2 and source = 'adicional'`,
      [clinicId, moduleId],
    );
  });

  revalidatePath(`/admin/clinicas/${clinicId}`);
}

export async function generateInvoiceAction(
  _previous: SimpleState,
  formData: FormData,
): Promise<SimpleState> {
  const user = await requirePlatformAdmin();
  const clinicId = String(formData.get('clinicId') ?? '');
  if (!clinicId) return { error: 'Clínica inválida.' };

  try {
    await withPlatform(user.id, async (tx) => {
      const subRows = await tx.query<{
        id: string;
        price: string;
        current_period_end: string | null;
      }>(
        `select id, price::text as price, current_period_end
           from subscriptions
          where clinic_id = $1
          limit 1`,
        [clinicId],
      );
      const subscription = subRows[0];
      if (!subscription) throw new Error('Nenhuma assinatura encontrada.');

      const open = await tx.query<{ id: string }>(
        `select id
           from subscription_invoices
          where subscription_id = $1
            and status in ('aberta', 'vencida')
          limit 1`,
        [subscription.id],
      );
      if (open[0]) {
        throw new Error('Já existe uma fatura aberta ou vencida para esta assinatura.');
      }

      await tx.query(
        `insert into subscription_invoices (clinic_id, subscription_id, amount, due_date, status, gateway)
         values ($1, $2, $3, coalesce($4::date, current_date + 30), 'aberta', 'manual')`,
        [clinicId, subscription.id, Number(subscription.price), subscription.current_period_end],
      );
    });

    revalidatePath(`/admin/clinicas/${clinicId}`);
    revalidatePath('/admin/pagamentos');
    return { success: 'Fatura gerada.' };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Não foi possível gerar a fatura.',
    };
  }
}

export async function registerPaymentAction(
  _previous: SimpleState,
  formData: FormData,
): Promise<SimpleState> {
  const user = await requirePlatformAdmin();
  const invoiceId = String(formData.get('invoiceId') ?? '');
  if (!invoiceId) return { error: 'Fatura inválida.' };

  try {
    await withPlatform(user.id, async (tx) => {
      const invoiceRows = await tx.query<{ id: string; subscription_id: string; clinic_id: string }>(
        `select id, subscription_id, clinic_id
           from subscription_invoices
          where id = $1
          limit 1`,
        [invoiceId],
      );
      const invoice = invoiceRows[0];
      if (!invoice) throw new Error('Fatura não encontrada.');

      await tx.query(
        `update subscription_invoices
            set status = 'paga',
                paid_at = current_date,
                updated_at = now()
          where id = $1
            and status in ('aberta', 'vencida')`,
        [invoiceId],
      );

      await tx.query(
        `update subscriptions
            set status = case
                           when status in ('em_teste', 'inadimplente', 'vencida') then 'ativa'::subscription_status
                           else status
                         end,
                updated_at = now()
          where id = $1`,
        [invoice.subscription_id],
      );
    });

    revalidatePath('/admin/pagamentos');
    revalidatePath('/admin/assinaturas');
    revalidatePath('/admin');
    return { success: 'Pagamento registrado.' };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Não foi possível registrar o pagamento.',
    };
  }
}

const planSchema = z.object({
  id: z.string().uuid().optional().or(z.literal('')),
  name: z.string().trim().min(2, 'Nome obrigatório.'),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug obrigatório.')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens.'),
  description: z.string().trim().optional(),
  monthlyPrice: z.coerce.number().min(0),
  annualPrice: z.coerce.number().min(0),
  userLimit: z.coerce.number().int().min(0),
  professionalLimit: z.coerce.number().int().min(0),
  unitLimit: z.coerce.number().int().min(0),
  patientLimit: z.coerce.number().int().min(0),
  storageGb: z.coerce.number().int().min(0),
  aiInteractionLimit: z.coerce.number().int().min(0),
  messageLimit: z.coerce.number().int().min(0),
  trialDays: z.coerce.number().int().min(0),
  sortOrder: z.coerce.number().int().min(0),
  isActive: z.coerce.boolean(),
});

export async function savePlanAction(
  _previous: SimpleState,
  formData: FormData,
): Promise<SimpleState> {
  const user = await requirePlatformAdmin();

  const parsed = planSchema.safeParse({
    id: formData.get('id') || undefined,
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') || undefined,
    monthlyPrice: formData.get('monthlyPrice'),
    annualPrice: formData.get('annualPrice'),
    userLimit: formData.get('userLimit'),
    professionalLimit: formData.get('professionalLimit'),
    unitLimit: formData.get('unitLimit'),
    patientLimit: formData.get('patientLimit'),
    storageGb: formData.get('storageGb'),
    aiInteractionLimit: formData.get('aiInteractionLimit'),
    messageLimit: formData.get('messageLimit'),
    trialDays: formData.get('trialDays'),
    sortOrder: formData.get('sortOrder'),
    isActive: formData.get('isActive') === 'on',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  const data = parsed.data;

  try {
    await withPlatform(user.id, async (tx) => {
      if (data.id) {
        await tx.query(
          `update plans
              set name = $2,
                  slug = $3,
                  description = $4,
                  monthly_price = $5,
                  annual_price = $6,
                  user_limit = $7,
                  professional_limit = $8,
                  unit_limit = $9,
                  patient_limit = $10,
                  storage_gb = $11,
                  ai_interaction_limit = $12,
                  message_limit = $13,
                  trial_days = $14,
                  is_active = $15,
                  sort_order = $16,
                  updated_at = now()
            where id = $1`,
          [
            data.id,
            data.name,
            data.slug,
            data.description ?? null,
            data.monthlyPrice,
            data.annualPrice,
            data.userLimit,
            data.professionalLimit,
            data.unitLimit,
            data.patientLimit,
            data.storageGb,
            data.aiInteractionLimit,
            data.messageLimit,
            data.trialDays,
            data.isActive,
            data.sortOrder,
          ],
        );
      } else {
        await tx.query(
          `insert into plans
             (name, slug, description, monthly_price, annual_price,
              user_limit, professional_limit, unit_limit, patient_limit,
              storage_gb, ai_interaction_limit, message_limit, trial_days,
              is_active, sort_order)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            data.name,
            data.slug,
            data.description ?? null,
            data.monthlyPrice,
            data.annualPrice,
            data.userLimit,
            data.professionalLimit,
            data.unitLimit,
            data.patientLimit,
            data.storageGb,
            data.aiInteractionLimit,
            data.messageLimit,
            data.trialDays,
            data.isActive,
            data.sortOrder,
          ],
        );
      }
    });

    revalidatePath('/admin/planos');
    return { success: data.id ? 'Plano atualizado.' : 'Plano criado.' };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message.includes('plans_slug_key')
            ? 'Já existe um plano com este slug.'
            : `Não foi possível salvar o plano: ${error.message}`
          : 'Não foi possível salvar o plano.',
    };
  }
}

export async function toggleModuleGlobalAction(formData: FormData): Promise<void> {
  const user = await requirePlatformAdmin();
  const moduleId = String(formData.get('moduleId') ?? '');
  const next = String(formData.get('next') ?? '');
  if (!moduleId || (next !== 'true' && next !== 'false')) return;

  await withPlatform(user.id, async (tx) => {
    await tx.query(
      `update modules set is_active = $2, updated_at = now() where id = $1`,
      [moduleId, next === 'true'],
    );
  });

  revalidatePath('/admin/modulos');
  revalidatePath('/admin');
  revalidatePath('/app', 'layout');
}

const settingsSchema = z.object({
  platformName: z.string().trim().min(2, 'Nome obrigatório.'),
  supportEmail: z.string().trim().email('E-mail de suporte inválido.'),
  defaultTrialDays: z.coerce.number().int().min(0),
  defaultGateway: z.enum(['manual', 'stripe', 'asaas', 'pagseguro', 'mercadopago']),
  defaultPeriodicity: z.enum(['mensal', 'anual']),
  whatsappMode: z.enum(['manual', 'meta']),
});

export async function savePlatformSettingsAction(
  _previous: SimpleState,
  formData: FormData,
): Promise<SimpleState> {
  const user = await requirePlatformAdmin();

  const parsed = settingsSchema.safeParse({
    platformName: formData.get('platformName'),
    supportEmail: formData.get('supportEmail'),
    defaultTrialDays: formData.get('defaultTrialDays'),
    defaultGateway: formData.get('defaultGateway'),
    defaultPeriodicity: formData.get('defaultPeriodicity'),
    whatsappMode: formData.get('whatsappMode'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  const data = parsed.data;

  const entries: Array<[string, Record<string, unknown>]> = [
    ['platform.name', { value: data.platformName }],
    ['platform.support_email', { value: data.supportEmail }],
    ['platform.default_trial_days', { value: data.defaultTrialDays }],
    ['platform.default_gateway', { value: data.defaultGateway }],
    ['platform.default_periodicity', { value: data.defaultPeriodicity }],
    ['platform.whatsapp_mode', { value: data.whatsappMode }],
  ];

  try {
    await withPlatform(user.id, async (tx) => {
      for (const [key, value] of entries) {
        await tx.query(
          `insert into platform_settings (key, value, updated_by, updated_at)
           values ($1, $2::jsonb, $3, now())
           on conflict (key) do update
             set value = excluded.value,
                 updated_by = excluded.updated_by,
                 updated_at = now()`,
          [key, JSON.stringify(value), user.id],
        );
      }
    });

    revalidatePath('/admin/configuracoes');
    return { success: 'Configurações salvas.' };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? `Não foi possível salvar: ${error.message}`
          : 'Não foi possível salvar as configurações.',
    };
  }
}


export async function suspendClinicMemberAction(formData: FormData): Promise<void> {
  const user = await requirePlatformAdmin();
  const clinicId = String(formData.get('clinicId') ?? '');
  const membershipId = String(formData.get('membershipId') ?? '');

  try {
    await withPlatform(user.id, async (tx) => {
      const target = await tx.query<{ role: string }>(
        "select role::text as role from clinic_memberships where id = $1 and clinic_id = $2",
        [membershipId, clinicId],
      );
      if (target[0]?.role === 'clinic_admin') {
        const admins = await tx.query<{ total: number }>(
          "select count(*)::int as total from clinic_memberships where clinic_id = $1 and role = 'clinic_admin' and status = 'ativo'",
          [clinicId],
        );
        if ((admins[0]?.total ?? 0) <= 1) {
          throw new Error('Nao e possivel suspender o ultimo administrador da clinica.');
        }
      }
      await tx.query(
        "update clinic_memberships set status = 'suspenso', updated_at = now() where id = $1 and clinic_id = $2",
        [membershipId, clinicId],
      );
    });
    revalidatePath('/admin/clinicas/' + clinicId);
  } catch {
    // noop
  }
}

export async function reactivateClinicMemberAction(formData: FormData): Promise<void> {
  const user = await requirePlatformAdmin();
  const clinicId = String(formData.get('clinicId') ?? '');
  const membershipId = String(formData.get('membershipId') ?? '');

  try {
    await withPlatform(user.id, async (tx) => {
      await tx.query(
        "update clinic_memberships set status = 'ativo', updated_at = now() where id = $1 and clinic_id = $2",
        [membershipId, clinicId],
      );
    });
    revalidatePath('/admin/clinicas/' + clinicId);
  } catch {
    // noop
  }
}
