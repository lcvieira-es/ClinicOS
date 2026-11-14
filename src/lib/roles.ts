import type { AppRole } from '@/lib/auth/types';

const labels: Record<AppRole, string> = {
  platform_admin: 'Superadministrador',
  clinic_admin: 'Administrador(a) da clínica',
  doctor: 'Médico(a)',
  receptionist: 'Recepção',
  finance: 'Financeiro',
  patient: 'Paciente',
};

export function roleLabel(role: AppRole | string): string {
  return labels[role as AppRole] ?? role;
}

export function roleShortLabel(role: AppRole | string): string {
  const short: Record<AppRole, string> = {
    platform_admin: 'Superadministrador',
    clinic_admin: 'Administrador(a)',
    doctor: 'Médico(a)',
    receptionist: 'Recepção',
    finance: 'Financeiro',
    patient: 'Paciente',
  };
  return short[role as AppRole] ?? role;
}

