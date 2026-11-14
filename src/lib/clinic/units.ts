import 'server-only';

import { withTenant } from '@/lib/db';

export interface UnitListItem {
  id: string;
  name: string;
  type: string;
  internal_code: string | null;
  phone: string | null;
  email: string | null;
  cep: string | null;
  address: string | null;
  address_number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  manager_name: string | null;
  opening_hours: string | null;
  is_headquarters: boolean;
  status: string;
  professional_count: number;
}

export interface UnitDetail extends UnitListItem {
  created_at: string;
  updated_at: string;
}

export async function listUnits(
  userId: string,
  clinicId: string,
): Promise<UnitListItem[]> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<UnitListItem>(
      `select u.id,
              u.name,
              u.type::text as type,
              u.internal_code,
              u.phone,
              u.email,
              u.cep,
              u.address,
              u.address_number,
              u.complement,
              u.neighborhood,
              u.city,
              u.state::text as state,
              u.manager_name,
              u.opening_hours,
              u.is_headquarters,
              u.status::text as status,
              (select count(*)::int
                 from professional_units pu
                where pu.unit_id = u.id) as professional_count
         from clinic_units u
        order by u.is_headquarters desc, u.name`,
    );
  });
}

export async function getUnit(
  userId: string,
  clinicId: string,
  unitId: string,
): Promise<UnitDetail | null> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const rows = await tx.query<UnitDetail>(
      `select u.id,
              u.name,
              u.type::text as type,
              u.internal_code,
              u.phone,
              u.email,
              u.cep,
              u.address,
              u.address_number,
              u.complement,
              u.neighborhood,
              u.city,
              u.state::text as state,
              u.manager_name,
              u.opening_hours,
              u.is_headquarters,
              u.status::text as status,
              (select count(*)::int
                 from professional_units pu
                where pu.unit_id = u.id) as professional_count,
              u.created_at::text as created_at,
              u.updated_at::text as updated_at
         from clinic_units u
        where u.id = $1`,
      [unitId],
    );
    return rows[0] ?? null;
  });
}

export async function listUnitOptions(
  userId: string,
  clinicId: string,
): Promise<Array<{ id: string; name: string }>> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<{ id: string; name: string }>(
      `select id, name from clinic_units where status = 'ativa' order by name`,
    );
  });
}
