import 'server-only';

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { hash } from '@node-rs/argon2';
import { getPglite, isPostgres } from './client';

export const DEMO_PASSWORD = 'Clinicos@2026';

const globalForBootstrap = globalThis as unknown as {
  __clinicosReady?: Promise<void>;
};

async function applyMigrations(): Promise<void> {
  const db = await getPglite();
  const migrationsDir = path.join(process.cwd(), 'db', 'migrations');

  await db.exec(`set timezone to 'America/Sao_Paulo'`);

  await db.exec(`
    do $$
    begin
      if not exists (select 1 from pg_roles where rolname = 'clinicos_app') then
        create role clinicos_app nologin;
      end if;
    end $$;
  `);

  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = await readFile(path.join(migrationsDir, file), 'utf8');
    await db.exec(sql);
  }
}

async function seedDemoData(): Promise<void> {
  const db = await getPglite();
  const seedPath = path.join(process.cwd(), 'db', 'dev-seed.sql');
  const seedSql = await readFile(seedPath, 'utf8');
  const passwordHash = await hash(DEMO_PASSWORD, {
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });
  await db.exec(seedSql.replaceAll('__DEMO_PASSWORD_HASH__', passwordHash));
}

async function bootstrapLocalDatabase(): Promise<void> {
  // Em produção (PostgreSQL externo) as migrations e o seed são aplicados
  // fora da aplicação (ver tools/apply-migrations-pg.mjs). Nada de PGlite.
  if (isPostgres()) {
    return;
  }

  const db = await getPglite();
  // A conexão PGlite é de sessão única; este ajuste vale para o processo inteiro.
  await db.exec(`set timezone to 'America/Sao_Paulo'`);

  const existing = await db.query(
    `select to_regclass('public.users') is not null as present`,
  );

  if (existing.rows[0]?.present) {
    return;
  }

  console.info('[clinicos] Inicializando banco local (PGlite) e dados de demonstração…');
  await applyMigrations();
  await seedDemoData();
  console.info('[clinicos] Banco local pronto.');
}

/**
 * Garante que o banco local PGlite exista e esteja migrado/semeado.
 * Em PostgreSQL de produção as migrations são aplicadas fora do app
 * (tools/apply-migrations-pg.mjs) e o bootstrap é no-op.
 */
export function ensureDatabaseReady(): Promise<void> {
  if (isPostgres()) {
    return Promise.resolve();
  }
  if (!globalForBootstrap.__clinicosReady) {
    globalForBootstrap.__clinicosReady = bootstrapLocalDatabase().catch((error) => {
      globalForBootstrap.__clinicosReady = undefined;
      throw error;
    });
  }
  return globalForBootstrap.__clinicosReady;
}
