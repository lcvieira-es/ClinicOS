import 'server-only';

import { withTenant } from '@/lib/db';

export interface PatientListItem {
  id: string;
  full_name: string;
  social_name: string | null;
  /** CPF já mascarado pelo banco para quem não tem `pacientes:view_sensitive`. */
  cpf: string | null;
  birth_date: string | null;
  sex: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  status: string;
  insurance_provider_name: string | null;
  lgpd_consent_at: string | null;
  created_at: string;
}

export interface PatientDetail extends PatientListItem {
  gender: string | null;
  cep: string | null;
  address: string | null;
  address_number: string | null;
  complement: string | null;
  neighborhood: string | null;
  insurance_provider_id: string | null;
  insurance_member_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  preferred_unit_id: string | null;
  notes: string | null;
  lgpd_consent_by: string | null;
  updated_at: string;
}

export interface PatientListResult {
  items: PatientListItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PatientAppointmentItem {
  id: string;
  scheduled_start: string;
  status: string;
  type: string;
  amount: string;
  professional_name: string;
  unit_name: string;
}

export interface PatientConsentItem {
  id: string;
  type: string;
  granted: boolean;
  granted_at: string | null;
  revoked_at: string | null;
  document_version: string | null;
  created_at: string;
}

const LIST_COLUMNS = `
  v.id,
  v.full_name,
  v.social_name,
  v.cpf,
  v.birth_date::text as birth_date,
  v.sex::text as sex,
  v.phone,
  v.whatsapp,
  v.email,
  v.city,
  v.state,
  v.status::text as status,
  v.insurance_provider_name,
  v.lgpd_consent_at::text as lgpd_consent_at,
  v.created_at::text as created_at
`;

const STATUS_VALUES = new Set(['ativo', 'inativo', 'arquivado']);

/**
 * Lista paginada de pacientes. A view `v_patients_directory` mascara o CPF no
 * próprio banco quando o papel não tem `pacientes:view_sensitive`.
 */
export async function listPatients(
  userId: string,
  clinicId: string,
  options: {
    search?: string;
    status?: string;
    page: number;
    pageSize: number;
    canSeeSensitive: boolean;
  },
): Promise<PatientListResult> {
  const { search = '', status = '', page, pageSize, canSeeSensitive } = options;

  return withTenant({ userId, clinicId }, async (tx) => {
    const params: unknown[] = [];
    const push = (value: unknown) => {
      params.push(value);
      return `$${params.length}`;
    };

    const conditions: string[] = [];
    const term = search.trim();

    if (term) {
      const like = push(`%${term}%`);
      const digits = term.replace(/\D/g, '');
      const clauses = [`v.full_name ilike ${like}`, `v.email ilike ${like}`];

      if (digits.length >= 7) {
        const phone = push(`%${digits}%`);
        clauses.push(`v.phone ilike ${phone}`);
        clauses.push(`v.whatsapp ilike ${phone}`);
      }
      if (digits.length === 11 && canSeeSensitive) {
        clauses.push(`p.cpf = ${push(digits)}`);
      }

      conditions.push(`(${clauses.join(' or ')})`);
    }

    if (status && STATUS_VALUES.has(status)) {
      conditions.push(`v.status = ${push(status)}`);
    }

    const where = conditions.length ? `where ${conditions.join(' and ')}` : '';
    const from = `from v_patients_directory v join patients p on p.id = v.id ${where}`;

    const countRows = await tx.query<{ total: number }>(
      `select count(*)::int as total ${from}`,
      params,
    );

    const limit = push(pageSize);
    const offset = push((page - 1) * pageSize);

    const rows = await tx.query<PatientListItem>(
      `select ${LIST_COLUMNS} ${from}
        order by v.full_name
        limit ${limit} offset ${offset}`,
      params,
    );

    return {
      items: rows,
      page,
      pageSize,
      total: countRows[0]?.total ?? 0,
    };
  });
}

export async function getPatient(
  userId: string,
  clinicId: string,
  patientId: string,
): Promise<PatientDetail | null> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const rows = await tx.query<PatientDetail>(
      `select ${LIST_COLUMNS},
              p.gender,
              p.cep,
              p.address,
              p.address_number,
              p.complement,
              p.neighborhood,
              p.insurance_provider_id,
              p.insurance_member_number,
              p.emergency_contact_name,
              p.emergency_contact_phone,
              p.preferred_unit_id,
              p.notes,
              p.lgpd_consent_by::text as lgpd_consent_by,
              p.updated_at::text as updated_at
         from v_patients_directory v
         join patients p on p.id = v.id
        where v.id = $1`,
      [patientId],
    );
    return rows[0] ?? null;
  });
}

export async function getPatientAppointments(
  userId: string,
  clinicId: string,
  patientId: string,
): Promise<PatientAppointmentItem[]> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<PatientAppointmentItem>(
      `select a.id,
              a.scheduled_start::text as scheduled_start,
              a.status::text as status,
              a.type::text as type,
              a.amount::text as amount,
              pr.full_name as professional_name,
              u.name as unit_name
         from appointments a
         join professionals pr on pr.id = a.professional_id
         join clinic_units u on u.id = a.unit_id
        where a.patient_id = $1
        order by a.scheduled_start desc
        limit 25`,
      [patientId],
    );
  });
}

export async function getPatientConsents(
  userId: string,
  clinicId: string,
  patientId: string,
): Promise<PatientConsentItem[]> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<PatientConsentItem>(
      `select id,
              type::text as type,
              granted,
              granted_at::text as granted_at,
              revoked_at::text as revoked_at,
              document_version,
              created_at::text as created_at
         from patient_consents
        where patient_id = $1
        order by created_at desc`,
      [patientId],
    );
  });
}

/** Convênios: prioriza os contratos ativos da clínica; senão, o catálogo global. */
export async function listInsuranceOptions(
  userId: string,
  clinicId: string,
): Promise<Array<{ id: string; name: string }>> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const contracted = await tx.query<{ id: string; name: string }>(
      `select distinct ip.id, ip.name
         from clinic_insurance_contracts c
         join insurance_providers ip on ip.id = c.provider_id
        where c.clinic_id = $1
          and c.status = 'ativo'
          and ip.status = 'ativo'
        order by ip.name`,
      [clinicId],
    );

    if (contracted.length > 0) return contracted;

    return tx.query<{ id: string; name: string }>(
      `select id, name
         from insurance_providers
        where status = 'ativo'
        order by name`,
    );
  });
}

export interface PatientSummary {
  total: number;
  active: number;
  inactive: number;
  archived: number;
  pendingConsent: number;
}

export async function listPatientOptions(
  userId: string,
  clinicId: string,
): Promise<Array<{ id: string; name: string }>> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<{ id: string; name: string }>(
      `select id, full_name as name from patients where status <> 'arquivado' order by full_name`,
    );
  });
}
export async function getPatientSummary(
  userId: string,
  clinicId: string,
): Promise<PatientSummary> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const rows = await tx.query<{
      total: number;
      active: number;
      inactive: number;
      archived: number;
      pending_consent: number;
    }>(
      `select count(*)::int as total,
              count(*) filter (where status = 'ativo')::int as active,
              count(*) filter (where status = 'inativo')::int as inactive,
              count(*) filter (where status = 'arquivado')::int as archived,
              count(*) filter (where lgpd_consent_at is null)::int as pending_consent
         from patients`,
    );

    const row = rows[0];
    return {
      total: row?.total ?? 0,
      active: row?.active ?? 0,
      inactive: row?.inactive ?? 0,
      archived: row?.archived ?? 0,
      pendingConsent: row?.pending_consent ?? 0,
    };
  });
}
