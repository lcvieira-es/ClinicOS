import { requireClinicUser } from '@/lib/auth/guards';
import { loadClinicContext } from '@/lib/tenant/context';
import { buildClinicNav } from '@/lib/navigation';
import { getUnreadNotificationCount } from '@/lib/clinic/queries';
import { ClinicShell } from '@/components/layout/clinic-shell';
import { roleShortLabel } from '@/lib/roles';

export default async function ClinicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireClinicUser();

  const [{ modules, permissions }, notificationCount] = await Promise.all([
    loadClinicContext(user.id, user.activeClinicId, user.activeMembership.role),
    getUnreadNotificationCount(user.id, user.activeClinicId),
  ]);

  const nav = buildClinicNav(modules, permissions);

  return (
    <ClinicShell
      user={{
        name: user.fullName,
        email: user.email,
        role: roleShortLabel(user.activeMembership.role),
        isPlatformAdmin: user.isPlatformAdmin,
      }}
      clinic={{
        id: user.activeClinicId,
        name: user.activeClinicName,
        isDemo: user.activeClinicName.toLowerCase().includes('demonstra'),
      }}
      memberships={user.memberships.map((membership) => ({
        clinicId: membership.clinicId,
        clinicName: membership.clinicName,
      }))}
      nav={nav}
      notificationCount={notificationCount}
    >
      {children}
    </ClinicShell>
  );
}
