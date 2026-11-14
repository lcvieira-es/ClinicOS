import 'server-only';

import { cache } from 'react';
import { getClinicEntitlements, entitledKeys } from './entitlements';
import { getRolePermissions } from '@/lib/permissions';
import type { ClinicRole } from '@/lib/auth/types';

export const loadClinicContext = cache(
  async (userId: string, clinicId: string, role: ClinicRole) => {
    const [entitlements, permissions] = await Promise.all([
      getClinicEntitlements(userId, clinicId),
      getRolePermissions(userId, clinicId, role),
    ]);

    return {
      entitlements,
      permissions,
      modules: entitledKeys(entitlements),
    };
  },
);
