import 'server-only';

import { withPlatform, withTenant } from '@/lib/db';
import type { ClinicRole } from '@/lib/auth/types';

export async function hasPermission(
  userId: string,
  clinicId: string,
  permission: string,
): Promise<boolean> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const rows = await tx.query<{ allowed: boolean }>(
      `select app_has_permission($1, $2) as allowed`,
      [clinicId, permission],
    );
    return Boolean(rows[0]?.allowed);
  });
}

export async function getRolePermissions(
  userId: string,
  clinicId: string,
  role: ClinicRole,
): Promise<Set<string>> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const rows = await tx.query<{ key: string }>(
      `select p.key
         from permissions p
         join role_permissions rp on rp.permission_id = p.id
        where rp.role = $1
        order by p.key`,
      [role],
    );
    return new Set(rows.map((row) => row.key));
  });
}

export function can(
  permissions: Set<string>,
  permission: string,
): boolean {
  return permissions.has(permission);
}

export async function getPlatformPermissions(userId: string): Promise<Set<string>> {
  return withPlatform(userId, async (tx) => {
    const rows = await tx.query<{ key: string }>(
      `select p.key
         from permissions p
         join role_permissions rp on rp.permission_id = p.id
        where rp.role = 'platform_admin'
        order by p.key`,
    );
    return new Set(rows.map((row) => row.key));
  });
}
