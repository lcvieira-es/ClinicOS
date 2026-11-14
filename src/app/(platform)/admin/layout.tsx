import { requirePlatformAdmin } from '@/lib/auth/guards';
import { getPlatformPermissions } from '@/lib/permissions';
import { filterNav, platformNav } from '@/lib/navigation';
import { getPlatformNotificationCount } from '@/lib/platform/queries';
import { PlatformShell } from '@/components/layout/platform-shell';
import { roleLabel } from '@/lib/roles';

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePlatformAdmin();
  const [permissions, notificationCount] = await Promise.all([
    getPlatformPermissions(user.id),
    getPlatformNotificationCount(user.id),
  ]);

  const nav = filterNav(platformNav, permissions);

  return (
    <PlatformShell
      user={{
        name: user.fullName,
        email: user.email,
        role: roleLabel('platform_admin'),
      }}
      notificationCount={notificationCount}
      hasClinicAccess={user.memberships.length > 0}
    >
      {children}
    </PlatformShell>
  );
}
