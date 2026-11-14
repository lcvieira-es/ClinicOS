import 'server-only';

import { ensureDatabaseReady } from './bootstrap';
import {
  rawTransaction,
  rawTrustedQuery,
  type DbRow,
  type Queryable,
  type TenantContext,
} from './client';

export type { DbRow, Queryable, TenantContext };

/** Consulta privilegiada restrita ao bootstrap de autenticação. */
export async function trustedQuery<T = DbRow>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  await ensureDatabaseReady();
  return rawTrustedQuery<T>(sql, params);
}

export async function trustedQueryOne<T = DbRow>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await trustedQuery<T>(sql, params);
  return rows[0] ?? null;
}

/** Transação com contexto de tenant — a RLS é aplicada pelo banco. */
export async function withTenant<T>(
  context: TenantContext,
  callback: (tx: Queryable) => Promise<T>,
): Promise<T> {
  await ensureDatabaseReady();
  return rawTransaction(context, callback);
}

/** Transação de plataforma: identifica o usuário, sem clínica ativa. */
export async function withPlatform<T>(
  userId: string,
  callback: (tx: Queryable) => Promise<T>,
): Promise<T> {
  await ensureDatabaseReady();
  return rawTransaction({ userId, clinicId: null }, callback);
}
