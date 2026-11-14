import 'server-only';

import { withTenant } from '@/lib/db';

export interface ProfessionalListItem {
  id: string;
  full_name: string;
  council: string | null;
  council_number: string | null;
  council_state: string | null;
  specialties: string[] | null;
  phone: string | null;
  email: string | null;
  consultation_price: string;
  default_duration_min: number;
  commission_percent: string;
  calendar_color: string;
  status: string;
  unit_ids: string[];
  unit_names: string[];
}

export interface ProfessionalDetail extends ProfessionalListItem {
  user_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function listProfessionals(
  userId: string,
  clinicId: string,
): Promise<ProfessionalListItem[]> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const rows = await tx.query<{
      id: string;
      full_name: string;
      council: string | null;
      council_number: string | null;
      council_state: string | null;
      specialties: string[] | null;
      phone: string | null;
      email: string | null;
      consultation_price: string;
      default_duration_min: number;
      commission_percent: string;
      calendar_color: string;
      status: string;
      unit_ids: string[] | null;
      unit_names: string[] | null;
    }>(
      `select p.id,
              p.full_name,
              p.council,
              p.council_number,
              p.council_state,
              p.specialties,
              p.phone,
              p.email,
              p.consultation_price::text as consultation_price,
              p.default_duration_min,
              p.commission_percent::text as commission_percent,
              p.calendar_color,
              p.status::text as status,
              coalesce(array_agg(pu.unit_id) filter (where pu.unit_id is not null), '{}') as unit_ids,
              coalesce(array_agg(u.name) filter (where u.name is not null), '{}') as unit_names
         from professionals p
         left join professional_units pu on pu.professional_id = p.id
         left join clinic_units u on u.id = pu.unit_id
        group by p.id
        order by p.full_name`,
    );

    return rows.map((row) => ({
      ...row,
      unit_ids: row.unit_ids ?? [],
      unit_names: row.unit_names ?? [],
    }));
  });
}

export async function getProfessional(
  userId: string,
  clinicId: string,
  professionalId: string,
): Promise<ProfessionalDetail | null> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const rows = await tx.query<{
      id: string;
      full_name: string;
      council: string | null;
      council_number: string | null;
      council_state: string | null;
      specialties: string[] | null;
      phone: string | null;
      email: string | null;
      consultation_price: string;
      default_duration_min: number;
      commission_percent: string;
      calendar_color: string;
      status: string;
      user_id: string | null;
      notes: string | null;
      unit_ids: string[] | null;
      unit_names: string[] | null;
      created_at: string;
      updated_at: string;
    }>(
      `select p.id,
              p.full_name,
              p.council,
              p.council_number,
              p.council_state,
              p.specialties,
              p.phone,
              p.email,
              p.consultation_price::text as consultation_price,
              p.default_duration_min,
              p.commission_percent::text as commission_percent,
              p.calendar_color,
              p.status::text as status,
              p.user_id::text as user_id,
              p.notes,
              coalesce(array_agg(pu.unit_id) filter (where pu.unit_id is not null), '{}') as unit_ids,
              coalesce(array_agg(u.name) filter (where u.name is not null), '{}') as unit_names,
              p.created_at::text as created_at,
              p.updated_at::text as updated_at
         from professionals p
         left join professional_units pu on pu.professional_id = p.id
         left join clinic_units u on u.id = pu.unit_id
        where p.id = $1
        group by p.id`,
      [professionalId],
    );

    const row = rows[0];
    if (!row) return null;
    return {
      ...row,
      unit_ids: row.unit_ids ?? [],
      unit_names: row.unit_names ?? [],
    };
  });
}

export async function listProfessionalOptions(
  userId: string,
  clinicId: string,
): Promise<Array<{ id: string; name: string }>> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<{ id: string; name: string }>(
      `select id, full_name as name
         from professionals
        where status = 'ativo'
        order by full_name`,
    );
  });
}
