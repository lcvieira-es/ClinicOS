import 'server-only';

import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { Pool, type PoolClient } from 'pg';

export type DbRow = Record<string, unknown>;
export interface Queryable {
  query<T = DbRow>(sql: string, params?: unknown[]): Promise<T[]>;
}

type SessionQuery = (sql: string, params?: unknown[]) => Promise<DbRow[]>;

const globalForDb = globalThis as unknown as {
  __clinicosPglite?: unknown;
  __clinicosAppPool?: Pool;
  __clinicosAdminPool?: Pool;
  __clinicosPgliteModule?: Promise<{ PGlite: new (dataDir: string) => unknown }>;
};

export function isPostgres(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Produção/PostgreSQL: DATABASE_URL presente -> nunca toca em PGlite.
 * Desenvolvimento: usa PGlite local em .data/clinicos.
 */
function pgliteDataDir(): string {
  const configured = process.env.PGLITE_DATA_DIR ?? '.data/clinicos';
  return path.isAbsolute(configured)
    ? configured
    : path.join(/*turbopackIgnore: true*/ process.cwd(), configured);
}

// Importação LAZY: o módulo PGlite (WASM) só é carregado em desenvolvimento,
// nunca no bundle de produção do Vercel.
async function loadPgliteModule(): Promise<{ PGlite: new (dataDir: string) => any }> {
  if (!globalForDb.__clinicosPgliteModule) {
    globalForDb.__clinicosPgliteModule = import('@electric-sql/pglite') as Promise<any>;
  }
  return globalForDb.__clinicosPgliteModule;
}

export async function getPglite(): Promise<any> {
  if (isPostgres()) {
    throw new Error(
      'PGlite não pode ser usado quando DATABASE_URL está definida (produção).',
    );
  }
  if (globalForDb.__clinicosPglite) {
    return globalForDb.__clinicosPglite;
  }
  const { PGlite } = await loadPgliteModule();
  const dataDir = pgliteDataDir();
  mkdirSync(dataDir, { recursive: true });
  globalForDb.__clinicosPglite = new PGlite(dataDir);
  return globalForDb.__clinicosPglite;
}

function getAppPool(): Pool {
  const connectionString =
    process.env.APP_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('APP_DATABASE_URL ou DATABASE_URL não configurada.');
  }
  if (!globalForDb.__clinicosAppPool) {
    globalForDb.__clinicosAppPool = new Pool({
      connectionString,
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
      idleTimeoutMillis: 30_000,
      options: '-c timezone=America/Sao_Paulo',
    });
  }
  return globalForDb.__clinicosAppPool;
}

function getAdminPool(): Pool {
  const connectionString =
    process.env.DATABASE_URL ?? process.env.APP_DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL não configurada.');
  }
  if (!globalForDb.__clinicosAdminPool) {
    globalForDb.__clinicosAdminPool = new Pool({
      connectionString,
      max: 2,
      idleTimeoutMillis: 30_000,
      options: '-c timezone=America/Sao_Paulo',
    });
  }
  return globalForDb.__clinicosAdminPool;
}

/**
 * Consulta privilegiada, usada somente para bootstrap de autenticação
 * (localizar usuário por e-mail, memberships e vínculo de plataforma).
 * Nunca expõe dados clínicos: os casos de uso operacionais passam por
 * `withTenant`, que ativa a RLS.
 */
export async function rawTrustedQuery<T = DbRow>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (!isPostgres()) {
    const db = await getPglite();
    const result = await db.query(sql, params);
    return result.rows as T[];
  }
  const result = await getAdminPool().query(sql, params);
  return result.rows as T[];
}

export interface TenantContext {
  userId: string;
  clinicId?: string | null;
}

async function configureSession(query: SessionQuery, context: TenantContext) {
  // Em produção o pool de aplicação já conecta como clinicos_app.
  // No PGlite local conectamos como owner, então trocamos de papel para
  // que a RLS seja realmente aplicada.
  if (!isPostgres()) {
    await query('set local role clinicos_app');
  } else if (process.env.DB_SET_ROLE !== 'false') {
    await query('set local role clinicos_app');
  }
  await query(`select set_config('app.user_id', $1, true)`, [context.userId]);
  await query(`select set_config('app.clinic_id', $1, true)`, [
    context.clinicId ?? '',
  ]);
}

export async function rawTransaction<T>(
  context: TenantContext,
  callback: (tx: Queryable) => Promise<T>,
): Promise<T> {
  if (!isPostgres()) {
    const db = await getPglite();
    return db.transaction(async (transaction: any) => {
      const query: SessionQuery = async (sql, params = []) => {
        const result = await transaction.query(sql, params);
        return result.rows as DbRow[];
      };
      await configureSession(query, context);
      return callback({
        query: async <T = DbRow>(sql: string, params: unknown[] = []) =>
          (await query(sql, params)) as T[],
      });
    });
  }

  const client: PoolClient = await getAppPool().connect();
  try {
    await client.query('begin');
    const query: SessionQuery = async (sql, params = []) => {
      const result = await client.query(sql, params);
      return result.rows as DbRow[];
    };
    await configureSession(query, context);
    const result = await callback({
      query: async <T = DbRow>(sql: string, params: unknown[] = []) =>
        (await query(sql, params)) as T[],
    });
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function closeDatabase(): Promise<void> {
  if (globalForDb.__clinicosPglite) {
    await (globalForDb.__clinicosPglite as any).close();
    globalForDb.__clinicosPglite = undefined;
  }
  await globalForDb.__clinicosAppPool?.end();
  await globalForDb.__clinicosAdminPool?.end();
  globalForDb.__clinicosAppPool = undefined;
  globalForDb.__clinicosAdminPool = undefined;
}
