import 'server-only';

import { cache } from 'react';
import { readSession } from './session';
import { trustedQuery } from '@/lib/db';
import type {
  ClinicRole,
  CurrentUser,
  MembershipInfo,
  PortalAccessInfo,
} from './types';

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  status: string;
  is_platform_admin: boolean;
}

interface MembershipRow {
  membership_id: string;
  clinic_id: string;
  clinic_name: string;
  clinic_status: string;
  role: ClinicRole;
  unit_id: string | null;
}

interface PortalRow {
  clinic_id: string;
  clinic_name: string;
  patient_id: string;
  patient_name: string;
}

async function loadCurrentUser(): Promise<CurrentUser | null> {
  const session = await readSession();
  if (!session) return null;

  const user = (
    await trustedQuery<UserRow>(
      `select u.id, u.email, u.full_name, u.avatar_url, u.status,
              exists (
                select 1 from platform_admins pa
                where pa.user_id = u.id and pa.status = 'ativo'
              ) as is_platform_admin
         from users u
        where u.id = $1
        limit 1`,
      [session.userId],
    )
  )[0];

  if (!user || user.status !== 'ativo') return null;

  const [membershipRows, portalRows] = await Promise.all([
    trustedQuery<MembershipRow>(
      `select m.id as membership_id,
              m.clinic_id,
              c.display_name as clinic_name,
              c.status::text as clinic_status,
              m.role::text as role,
              (
                select mu.unit_id
                  from membership_units mu
                 where mu.membership_id = m.id
                 order by mu.unit_id
                 limit 1
              ) as unit_id
         from clinic_memberships m
         join clinics c on c.id = m.clinic_id
        where m.user_id = $1
          and m.status = 'ativo'
        order by c.display_name`,
      [user.id],
    ),
    trustedQuery<PortalRow>(
      `select a.clinic_id,
              c.display_name as clinic_name,
              a.patient_id,
              p.full_name as patient_name
         from patient_portal_access a
         join clinics c on c.id = a.clinic_id
         join patients p on p.id = a.patient_id
        where a.user_id = $1
          and a.status = 'ativo'
        order by c.display_name`,
      [user.id],
    ),
  ]);

  const memberships: MembershipInfo[] = membershipRows.map((row) => ({
    membershipId: row.membership_id,
    clinicId: row.clinic_id,
    clinicName: row.clinic_name,
    clinicStatus: row.clinic_status,
    role: row.role,
    unitId: row.unit_id,
  }));

  const portalAccess: PortalAccessInfo[] = portalRows.map((row) => ({
    clinicId: row.clinic_id,
    clinicName: row.clinic_name,
    patientId: row.patient_id,
    patientName: row.patient_name,
  }));

  const requestedClinic =
    session.clinicId && memberships.some((item) => item.clinicId === session.clinicId)
      ? session.clinicId
      : (memberships[0]?.clinicId ?? null);

  const activeMembership =
    memberships.find((item) => item.clinicId === requestedClinic) ?? null;

  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    avatarUrl: user.avatar_url,
    isPlatformAdmin: user.is_platform_admin,
    memberships,
    portalAccess,
    activeClinicId: requestedClinic,
    activeMembership,
    activeClinicName: activeMembership?.clinicName ?? null,
  };
}

export const getCurrentUser = cache(loadCurrentUser);
