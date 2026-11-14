import { requirePortalUser } from '@/lib/auth/guards';
import { portalNav } from '@/lib/navigation';
import { PortalShell } from '@/components/layout/portal-shell';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePortalUser();
  const access =
    user.portalAccess.find((item) => item.clinicId === user.activeClinicId) ??
    user.portalAccess[0];

  return (
    <PortalShell
      patientName={access.patientName}
      clinicName={access.clinicName}
      nav={portalNav}
    >
      {children}
    </PortalShell>
  );
}
