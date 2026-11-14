import 'server-only';

import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from './current-user';
import type {
  ClinicSessionUser,
  PlatformSessionUser,
  PortalSessionUser,
} from './types';

function fallbackDestination(user: {
  isPlatformAdmin: boolean;
  activeMembership: unknown;
  portalAccess: unknown[];
}): string {
  if (user.activeMembership) return '/app/painel';
  if (user.isPlatformAdmin) return '/admin';
  if (user.portalAccess.length > 0) return '/portal';
  return '/login?erro=sem-acesso';
}

export async function requireClinicUser(): Promise<ClinicSessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (!user.activeClinicId || !user.activeMembership) {
    if (user.isPlatformAdmin) redirect('/admin');
    if (user.portalAccess.length > 0) redirect('/portal');
    redirect('/login?erro=sem-acesso');
  }

  return user as ClinicSessionUser;
}

export async function requirePlatformAdmin(): Promise<PlatformSessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (!user.isPlatformAdmin) {
    redirect(fallbackDestination(user));
  }

  return user as PlatformSessionUser;
}

export async function requirePortalUser(): Promise<PortalSessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (user.portalAccess.length === 0) {
    redirect(fallbackDestination(user));
  }

  return user as PortalSessionUser;
}

export async function requirePermission(permission: string) {
  const user = await requireClinicUser();
  const { hasPermission } = await import('@/lib/permissions');
  const allowed = await hasPermission(user.id, user.activeClinicId, permission);
  if (!allowed) notFound();
  return user;
}
