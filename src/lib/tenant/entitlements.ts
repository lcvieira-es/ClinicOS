import 'server-only';

import { withTenant } from '@/lib/db';

export interface EntitlementModule {
  key: string;
  name: string;
  route: string | null;
  icon: string | null;
  category: string;
  isCore: boolean;
}

/**
 * Módulos efetivamente liberados:
 * módulos do plano ∪ adicionais ativos ∪ módulos de sistema (is_core).
 * A plataforma pode desativar um módulo globalmente via modules.is_active.
 */
export async function getClinicEntitlements(
  userId: string,
  clinicId: string,
): Promise<EntitlementModule[]> {
  return withTenant({ userId, clinicId }, async (tx) => {
    const rows = await tx.query<{
      key: string;
      name: string;
      route: string | null;
      icon: string | null;
      category: string;
      is_core: boolean;
    }>(
      `select distinct m.key, m.name, m.route, m.icon, m.category::text as category, m.is_core
         from modules m
        where m.audience = 'clinica'
          and m.is_active = true
          and (
            m.is_core = true
            or exists (
              select 1
                from clinic_modules cm
               where cm.clinic_id = $1
                 and cm.module_id = m.id
                 and cm.enabled = true
                 and (cm.expires_at is null or cm.expires_at > now())
            )
          )
        order by m.key`,
      [clinicId],
    );

    return rows.map((row) => ({
      key: row.key,
      name: row.name,
      route: row.route,
      icon: row.icon,
      category: row.category,
      isCore: row.is_core,
    }));
  });
}

export function entitledKeys(modules: EntitlementModule[]): Set<string> {
  return new Set(modules.map((module) => module.key));
}
