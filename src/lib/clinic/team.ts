import 'server-only';

import { withTenant } from '@/lib/db';

export interface MemberItem {
  membership_id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  job_title: string | null;
  hired_at: string | null;
  units: Array<{ id: string; name: string }>;
  created_at: string;
}

export interface InviteItem {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export async function listMembers(
  userId: string,
  clinicId: string,
): Promise<MemberItem[]> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const rows = await tx.query<{
      membership_id: string;
      user_id: string;
      full_name: string;
      email: string;
      role: string;
      status: string;
      job_title: string | null;
      hired_at: string | null;
      created_at: string;
    }>(
      `select m.id as membership_id,
              u.id as user_id,
              u.full_name,
              u.email,
              m.role::text as role,
              m.status::text as status,
              m.job_title,
              m.hired_at::text as hired_at,
              m.created_at::text as created_at
         from clinic_memberships m
         join users u on u.id = m.user_id
        where m.clinic_id = $1
        order by m.created_at`,
      [clinicId],
    );

    // Unidades (RLS pode ocultar para perfis não administradores).
    const unitRows = await tx.query<{
      membership_id: string;
      unit_id: string;
      unit_name: string;
    }>(
      `select mu.membership_id, mu.unit_id, cu.name as unit_name
         from membership_units mu
         join clinic_units cu on cu.id = mu.unit_id
        where mu.clinic_id = $1`,
      [clinicId],
    );

    const unitsByMembership = new Map<string, Array<{ id: string; name: string }>>();
    for (const unit of unitRows) {
      if (!unitsByMembership.has(unit.membership_id)) {
        unitsByMembership.set(unit.membership_id, []);
      }
      unitsByMembership.get(unit.membership_id)!.push({
        id: unit.unit_id,
        name: unit.unit_name,
      });
    }

    return rows.map((row) => ({
      ...row,
      units: unitsByMembership.get(row.membership_id) ?? [],
    }));
  });
}

export async function listInvites(
  userId: string,
  clinicId: string,
): Promise<InviteItem[]> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<InviteItem>(
      `select id,
              email,
              full_name,
              role::text as role,
              status::text as status,
              expires_at::text as expires_at,
              accepted_at::text as accepted_at,
              created_at::text as created_at
         from user_invites
        where clinic_id = $1
        order by created_at desc`,
      [clinicId],
    );
  });
}

export async function listUnitOptionsForTeam(
  userId: string,
  clinicId: string,
): Promise<Array<{ id: string; name: string }>> {
  return withTenant({ userId, clinicId }, async (tx) => {
    return tx.query<{ id: string; name: string }>(
      `select id, name from clinic_units where status = 'ativa' order by name`,
    );
  });
}
