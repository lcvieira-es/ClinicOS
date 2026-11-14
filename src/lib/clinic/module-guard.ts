import 'server-only';

import { notFound, redirect } from 'next/navigation';
import { requireClinicUser } from '@/lib/auth/guards';
import { loadClinicContext } from '@/lib/tenant/context';
import { modulePages, type ModulePageConfig } from '@/lib/modules';
import { errorMessage, isRedirectError } from '@/lib/clinic/validation';
import type { ClinicSessionUser } from '@/lib/auth/types';

export interface ModuleAccess {
  user: ClinicSessionUser;
  config: ModulePageConfig;
  /** Perfil ativo na clínica (papel do membership ativo). */
  role: ClinicSessionUser['activeMembership']['role'];
  permissions: Set<string>;
  modules: Set<string>;
  /** Módulo liberado no plano E permissão do papel conferidas no servidor. */
  allowed: boolean;
}

/**
 * Carrega o contexto de um módulo clínico: sessão, entitlements do plano e
 * permissões do papel. Retorna `null` para slug inexistente (=> notFound).
 * A UI escondida nunca substitui esta verificação: toda página e toda action
 * chamam este guard (ou `hasPermission`) no servidor.
 */
export async function loadModuleAccess(slug: string): Promise<ModuleAccess | null> {
  const config = modulePages[slug];
  if (!config) return null;

  const user = await requireClinicUser();
  const { modules, permissions } = await loadClinicContext(
    user.id,
    user.activeClinicId,
    user.activeMembership.role,
  );

  return {
    user,
    config,
    role: user.activeMembership.role,
    permissions,
    modules,
    allowed: modules.has(config.moduleKey) && permissions.has(config.permission),
  };
}

/** Conveniência para páginas: falha com 404 quando o módulo não existe. */
export async function requireModule(slug: string): Promise<ModuleAccess> {
  const access = await loadModuleAccess(slug);
  if (!access) notFound();
  return access;
}

/**
 * Guard de server action: confere entitlements do plano e permissão do papel
 * antes de tocar no banco. `permission` opcional permite exigir uma ação
 * específica (ex.: `pacientes:create`) além da permissão de visualização.
 */
export async function requireModulePermission(
  slug: string,
  permission?: string,
): Promise<ModuleAccess> {
  const access = await loadModuleAccess(slug);
  if (!access) throw new Error('Módulo inexistente.');
  if (!access.allowed) {
    throw new Error('Módulo indisponível para o plano ou perfil ativo.');
  }
  const required = permission ?? access.config.permission;
  if (!access.permissions.has(required)) {
    throw new Error('Perfil sem permissão para esta ação.');
  }
  return access;
}

/**
 * Guard para ações "void" (`<form action={...}>` sem estado): em caso de
 * falha redireciona para `fallbackPath` com a mensagem na query string.
 * Redirecionamentos internos do Next (login) são preservados.
 */
export async function guardAction(
  slug: string,
  permission: string,
  fallbackPath: string,
): Promise<ModuleAccess> {
  try {
    return await requireModulePermission(slug, permission);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const separator = fallbackPath.includes('?') ? '&' : '?';
    redirect(
      `${fallbackPath}${separator}erro=${encodeURIComponent(errorMessage(error))}`,
    );
  }
}
