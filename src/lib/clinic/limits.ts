import 'server-only';

import { withTenant, type Queryable } from '@/lib/db';

export type LimitKind = 'patient' | 'professional' | 'unit' | 'user';

export interface PlanLimits {
  planName: string | null;
  userLimit: number;
  professionalLimit: number;
  unitLimit: number;
  patientLimit: number;
}

export interface UsageCounts {
  patient: number;
  professional: number;
  unit: number;
  user: number;
}

const limitLabels: Record<LimitKind, string> = {
  patient: 'pacientes',
  professional: 'profissionais',
  unit: 'unidades',
  user: 'usuários',
};

const limitField: Record<LimitKind, keyof PlanLimits> = {
  patient: 'patientLimit',
  professional: 'professionalLimit',
  unit: 'unitLimit',
  user: 'userLimit',
};

const unlimited: PlanLimits = {
  planName: null,
  userLimit: 0,
  professionalLimit: 0,
  unitLimit: 0,
  patientLimit: 0,
};

/**
 * Limites do plano vigente. A função `app_plan_limits` (SECURITY DEFINER)
 * expõe apenas os números do plano — não dados de cobrança — porque a RLS
 * restringe `subscriptions` a administrador/financeiro e o recepcionista
 * também precisa conferir a cota de pacientes.
 * Limite `0` (ou ausência de assinatura) significa "sem cota configurada".
 */
export async function readPlanLimits(
  tx: Queryable,
  clinicId: string,
): Promise<PlanLimits> {
  const rows = await tx.query<{
    plan_name: string | null;
    user_limit: number;
    professional_limit: number;
    unit_limit: number;
    patient_limit: number;
  }>(`select * from app_plan_limits($1)`, [clinicId]);

  const row = rows[0];
  if (!row) return { ...unlimited };

  return {
    planName: row.plan_name,
    userLimit: Number(row.user_limit ?? 0),
    professionalLimit: Number(row.professional_limit ?? 0),
    unitLimit: Number(row.unit_limit ?? 0),
    patientLimit: Number(row.patient_limit ?? 0),
  };
}

/** Versão para uso fora de uma transação existente (renderização de página). */
export async function getPlanLimits(
  userId: string,
  clinicId: string,
): Promise<PlanLimits> {
  return withTenant({ userId, clinicId }, (tx) => readPlanLimits(tx, clinicId));
}

/** Contagem atual por recurso, sempre dentro da transação do tenant. */
export async function getUsage(tx: Queryable): Promise<UsageCounts> {
  const rows = await tx.query<{
    patients: number;
    professionals: number;
    units: number;
    users: number;
  }>(
    `select
       (select count(*)::int from patients) as patients,
       (select count(*)::int from professionals) as professionals,
       (select count(*)::int from clinic_units) as units,
       (select count(*)::int from clinic_memberships
         where status in ('ativo', 'convidado')) +
       (select count(*)::int from user_invites
         where status = 'pendente' and expires_at > now()) as users`,
  );

  const row = rows[0];
  return {
    patient: row?.patients ?? 0,
    professional: row?.professionals ?? 0,
    unit: row?.units ?? 0,
    user: row?.users ?? 0,
  };
}

/** Versão de página (abre a própria transação do tenant). */
export async function getUsageFor(
  userId: string,
  clinicId: string,
): Promise<UsageCounts> {
  return withTenant({ userId, clinicId }, (tx) => getUsage(tx));
}

/** Mensagem de erro quando a cota está esgotada; `null` quando há espaço. */
export function limitError(
  kind: LimitKind,
  limits: PlanLimits,
  usage: UsageCounts,
): string | null {
  const limit = Number(limits[limitField[kind]]);
  if (!limit || limit <= 0) return null;

  const used = usage[kind];
  if (used < limit) return null;

  const plan = limits.planName ? ` do plano ${limits.planName}` : '';
  return `Limite de ${limitLabels[kind]} atingido${plan}: ${used}/${limit}. ` +
    `Atualize a assinatura para cadastrar novos registros.`;
}

/** Texto exibido no cabeçalho das listas (ex.: "37/2.000 pacientes"). */
export function limitLabel(
  kind: LimitKind,
  limits: PlanLimits,
  usage: UsageCounts,
): string {
  const limit = Number(limits[limitField[kind]]);
  if (!limit || limit <= 0) {
    return `${usage[kind]} ${limitLabels[kind]} · sem cota configurada`;
  }
  return `${usage[kind]}/${limit} ${limitLabels[kind]}`;
}
