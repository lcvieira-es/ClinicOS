export type ClinicRole =
  | 'clinic_admin'
  | 'doctor'
  | 'receptionist'
  | 'finance';

export type AppRole = ClinicRole | 'platform_admin' | 'patient';

export interface MembershipInfo {
  membershipId: string;
  clinicId: string;
  clinicName: string;
  clinicStatus: string;
  role: ClinicRole;
  unitId: string | null;
}

export interface PortalAccessInfo {
  clinicId: string;
  clinicName: string;
  patientId: string;
  patientName: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  isPlatformAdmin: boolean;
  memberships: MembershipInfo[];
  portalAccess: PortalAccessInfo[];
  activeClinicId: string | null;
  activeMembership: MembershipInfo | null;
  activeClinicName: string | null;
}

export interface ClinicSessionUser extends CurrentUser {
  activeClinicId: string;
  activeMembership: MembershipInfo;
  activeClinicName: string;
}

export interface PlatformSessionUser extends CurrentUser {
  isPlatformAdmin: true;
}

export interface PortalSessionUser extends CurrentUser {
  portalAccess: PortalAccessInfo[];
}
