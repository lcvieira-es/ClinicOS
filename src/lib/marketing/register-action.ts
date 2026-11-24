'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { withPlatform } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import type { ClinicFormState } from '@/lib/clinic/form-state';
import { randomBytes } from 'crypto';

const PLATFORM_ADMIN_ID = '00000000-0000-4000-8000-000000000001';

const schema = z.object({
  fullName: z.string().trim().min(3, 'Nome completo obrigatório.'),
  phonePersonal: z.string().trim().optional(),
  emailPersonal: z.string().trim().email('E-mail particular inválido.'),
  clinicName: z.string().trim().min(2, 'Nome da clínica obrigatório.'),
  cnpj: z.string().trim().optional(),
  address: z.string().trim().min(3, 'Endereço completo obrigatório.'),
  addressNumber: z.string().trim().min(1, 'Número obrigatório.'),
  complement: z.string().trim().optional(),
  cep: z.string().trim().optional(),
  phoneProfessional: z.string().trim().optional(),
  emailProfessional: z.string().trim().email('E-mail profissional inválido.').or(z.literal('')).optional(),
  planSlug: z.string().trim().min(1, 'Selecione um plano.'),
  accessEmailChoice: z.enum(['personal', 'professional']),
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
  for (const byte of bytes) password += alphabet[byte % alphabet.length];
  return password;
}

export async function registerTrialClinicAction(
  _previous: ClinicFormState,
  formData: FormData,
): Promise<ClinicFormState & { temporaryPassword?: string; adminEmail?: string; clinicName?: string }> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const d = parsed.data;

  const adminEmail =
    d.accessEmailChoice === 'professional' && d.emailProfessional
      ? d.emailProfessional
      : d.emailPersonal;

  const planSlug = d.planSlug;

  try {
    const result = await withPlatform(PLATFORM_ADMIN_ID, async (tx) => {
      const planRows = await tx.query<{ id: string; name: string; monthly_price: string; annual_price: string; trial_days: number; is_active: boolean }>(
        `select id, name, monthly_price::text as monthly_price, annual_price::text as annual_price, trial_days, is_active from plans where slug = $1 limit 1`,
        [planSlug],
      );
      const plan = planRows[0];
      if (!plan || !plan.is_active) throw new Error('Plano selecionado não está disponível.');

      const portalSlug = `${slugify(d.clinicName) || 'clinica'}-${randomBytes(3).toString('hex')}`;

      const clinicRows = await tx.query<{ id: string }>(
        `insert into clinics (legal_name, trade_name, display_name, cnpj, email, phone, whatsapp, cep, address, address_number, neighborhood, city, state, status, portal_slug, notes, settings)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::char(2),'em_implantacao',$14,$15,'{"demo": false}'::jsonb) returning id`,
        [
          d.clinicName, d.clinicName, d.clinicName,
          d.cnpj ? d.cnpj.replace(/\D/g, '') || null : null,
          d.emailProfessional || d.emailPersonal,
          d.phoneProfessional || d.phonePersonal || null,
          d.phoneProfessional || d.phonePersonal || null,
          d.cep ? d.cep.replace(/\D/g, '') || null : null,
          d.address,
          d.addressNumber,
          d.complement || null,
          'Não informado',
          'SP',
          portalSlug,
          null,
        ],
      );
      const clinicId = clinicRows[0].id;

      const unitRows = await tx.query<{ id: string }>(
        `insert into clinic_units (clinic_id, name, type, internal_code, phone, email, cep, address, address_number, neighborhood, city, state, opening_hours, is_headquarters, status)
         values ($1,$2,'matriz',$3,$4,$5,$6,$7,$8,$9,$10,$11::char(2),$12,true,'ativa') returning id`,
        [
          clinicId, 'Matriz', 'MATRIZ-01',
          d.phoneProfessional || d.phonePersonal || null,
          d.emailProfessional || d.emailPersonal,
          d.cep ? d.cep.replace(/\D/g, '') || null : null,
          d.address, d.addressNumber, d.complement || null,
          'Não informado', 'SP',
          'Segunda a sexta, 08h às 18h',
        ],
      );
      const unitId = unitRows[0].id;

      // Admin user
      let adminUserId: string;
      let temporaryPassword: string | null = null;
      let passwordCreated = false;
      const existing = await tx.query<{ id: string }>(
        `select id from users where lower(email) = lower($1) limit 1`,
        [adminEmail],
      );
      if (existing[0]) {
        adminUserId = existing[0].id;
      } else {
        temporaryPassword = generateTemporaryPassword();
        const passwordHash = await hashPassword(temporaryPassword);
        const created = await tx.query<{ id: string }>(
          `insert into users (email, password_hash, full_name, status) values (lower($1), $2, $3, 'ativo') returning id`,
          [adminEmail, passwordHash, d.fullName],
        );
        adminUserId = created[0].id;
        passwordCreated = true;
      }

      const membershipRows = await tx.query<{ id: string }>(
        `insert into clinic_memberships (clinic_id, user_id, role, status, job_title, hired_at, invited_by)
         values ($1, $2, 'clinic_admin', 'ativo', 'Administrador(a)', current_date, $3)
         on conflict (clinic_id, user_id) do update set status='ativo', role='clinic_admin', updated_at=now() returning id`,
        [clinicId, adminUserId, PLATFORM_ADMIN_ID],
      );
      const membershipId = membershipRows[0].id;

      await tx.query(
        `insert into membership_units (membership_id, unit_id, clinic_id) values ($1,$2,$3) on conflict do nothing`,
        [membershipId, unitId, clinicId],
      );

      const monthlyPrice = Number(plan.monthly_price);
      await tx.query(
        `insert into subscriptions (clinic_id, plan_id, status, periodicity, price, started_at, current_period_start, current_period_end, trial_ends_at, gateway, created_by)
         values ($1,$2,'em_teste','mensal'::billing_period,$3,current_date,current_date,current_date + $4::int,current_date + $4::int,'manual',$5)`,
        [clinicId, plan.id, monthlyPrice, plan.trial_days, PLATFORM_ADMIN_ID],
      );

      await tx.query(
        `insert into clinic_modules (clinic_id, module_id, enabled, source, price, activated_at, created_by)
         select $1, pm.module_id, true, 'plano', 0, now(), $2 from plan_modules pm where pm.plan_id = $3
         on conflict (clinic_id, module_id) do update set enabled=true, source='plano', activated_at=coalesce(clinic_modules.activated_at, now())`,
        [clinicId, PLATFORM_ADMIN_ID, plan.id],
      );

      return { clinicId, temporaryPassword, passwordCreated, adminEmail };
    });

    revalidatePath('/admin/clinicas');
    return {
      success: 'Cadastro realizado com sucesso!',
      clinicName: d.clinicName,
      adminEmail: result.adminEmail,
      temporaryPassword: result.temporaryPassword ?? undefined,
    };
  } catch (error) {
    return { error: error instanceof Error ? `Não foi possível concluir o cadastro: ${error.message}` : 'Não foi possível concluir o cadastro.' };
  }
}
