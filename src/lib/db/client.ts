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
  const hyperdrive = (process.env as any)?.HYPERDRIVE ?? (globalThis as any)?.HYPERDRIVE;
  if (hyperdrive && typeof hyperdrive.connectionString === 'string') return true;
  return Boolean(process.env.DATABASE_URL || process.env.APP_DATABASE_URL);
}

function resolveHyperdriveConnectionString(): string | undefined {
  try {
    const hd = (process.env as any)?.HYPERDRIVE ?? (globalThis as any)?.HYPERDRIVE;
    if (hd && typeof hd.connectionString === 'string') {
      return hd.connectionString;
    }
  } catch {
    // ignore
  }
  return undefined;
}

function resolveConnectionString(preferApp: boolean): string | undefined {
  const hd = resolveHyperdriveConnectionString();
  if (hd) return hd;
  if (preferApp) {
    return process.env.APP_DATABASE_URL ?? process.env.DATABASE_URL;
  }
  return process.env.DATABASE_URL ?? process.env.APP_DATABASE_URL;
}

function pgliteDataDir(): string {
  const configured = process.env.PGLITE_DATA_DIR ?? '.data/clinicos';
  return path.isAbsolute(configured)
    ? configured
    : path.join(/*turbopackIgnore: true*/ process.cwd(), configured);
}

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

function buildSsl(connectionString: string): { rejectUnauthorized: boolean } | false | undefined {
  const isLocal =
    connectionString.includes('localhost') ||
    connectionString.includes('127.0.0.1');
  if (isLocal) return false;

  const forced = process.env.DB_SSL === 'true';
  const fromUrl = /sslmode=require/i.test(connectionString);
  if (!forced && !fromUrl) return undefined;
  return {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };
}

function stripSslMode(connectionString: string): string {
  return connectionString
    .replace(/[?&]sslmode=[^&]*/gi, (match) => (match.startsWith('?') ? '?' : ''))
    .replace(/\?$/, '');
}

function getAppPool(): Pool {
  const raw = resolveConnectionString(true);
  if (!raw) {
    throw new Error('APP_DATABASE_URL, DATABASE_URL ou HYPERDRIVE não configurada.');
  }
  const connectionString = stripSslMode(raw);
  if (!globalForDb.__clinicosAppPool) {
    globalForDb.__clinicosAppPool = new Pool({
      connectionString,
      max: Number(process.env.DATABASE_POOL_MAX ?? 1),
      idleTimeoutMillis: 10_000,
      options: '-c timezone=America/Sao_Paulo',
      ssl: buildSsl(raw),
    });

    globalForDb.__clinicosAppPool.on('error', (error) => {
      console.error('[ClinicOS][APP_POOL]', error.message);
    });
  }
  return globalForDb.__clinicosAppPool;
}

function getAdminPool(): Pool {
  const raw = resolveConnectionString(false);
  if (!raw) {
    throw new Error('DATABASE_URL, APP_DATABASE_URL ou HYPERDRIVE não configurada.');
  }
  const connectionString = stripSslMode(raw);
  if (!globalForDb.__clinicosAdminPool) {
    globalForDb.__clinicosAdminPool = new Pool({
      connectionString,
      max: 1,
      idleTimeoutMillis: 10_000,
      options: '-c timezone=America/Sao_Paulo',
      ssl: buildSsl(raw),
    });

    globalForDb.__clinicosAdminPool.on('error', (error) => {
      console.error('[ClinicOS][ADMIN_POOL]', error.message);
    });
  }
  return globalForDb.__clinicosAdminPool;
}

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
