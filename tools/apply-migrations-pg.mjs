import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';

const rawConnectionString = process.env.DATABASE_URL ?? process.env.APP_DATABASE_URL;
if (!rawConnectionString) {
  console.error('DATABASE_URL (ou APP_DATABASE_URL) não configurada.');
  process.exit(1);
}

const connectionString = rawConnectionString.replace(/[?&]sslmode=[^&]*/gi, (m) =>
  m.startsWith('?') ? '?' : '',
).replace(/\?$/, '');

const ssl =
  process.env.DB_SSL === 'true' || /sslmode=require/i.test(rawConnectionString)
    ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : undefined;

const seed = process.argv.includes('--seed');
const forceSeed = process.argv.includes('--force-seed');

const pool = new Pool({ connectionString, max: 1, ssl });

try {
  const client = await pool.connect();

  // timezone
  await client.query(`set timezone to 'America/Sao_Paulo'`);

  // role clinicos_app (best-effort)
  try {
    await client.query(`
      do $$
      begin
        if not exists (select 1 from pg_roles where rolname = 'clinicos_app') then
          create role clinicos_app nologin;
        end if;
      end $$;
    `);
  } catch (e) {
    console.warn('Aviso ao criar role clinicos_app:', e.message);
  }

  const migrationsDir = path.resolve(process.cwd(), 'db', 'migrations');
  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  console.log(`Aplicando ${files.length} migrations em ${connectionString.replace(/:[^:@]*@/, ':***@')}...`);
  for (const file of files) {
    const sql = await readFile(path.join(migrationsDir, file), 'utf8');
    await client.query(sql);
    console.log(`  OK ${file}`);
  }

  if (seed) {
    const existing = await client.query(
      `select to_regclass('public.users') is not null as present`,
    );
    const present = existing.rows[0]?.present;
    const usersCount = present
      ? (await client.query(`select count(*)::int as n from users`)).rows[0].n
      : 0;

    if (present && usersCount > 0 && !forceSeed) {
      console.log(`Seed ignorado: ${usersCount} usuário(s) já cadastrados. Use --force-seed para forçar.`);
    } else {
      const { hash } = await import('@node-rs/argon2');
      const DEMO_PASSWORD = 'Clinicos@2026';
      const passwordHash = await hash(DEMO_PASSWORD, {
        memoryCost: 19_456,
        timeCost: 2,
        parallelism: 1,
      });
      const seedSql = await readFile(
        path.resolve(process.cwd(), 'db', 'dev-seed.sql'),
        'utf8',
      );
      await client.query(seedSql.replaceAll('__DEMO_PASSWORD_HASH__', passwordHash));
      console.log('  OK dev-seed.sql (dados de demonstração)');
    }
  }

  console.log('Migrations aplicadas com sucesso.');
  client.release();
} catch (error) {
  console.error('Falha ao aplicar migrations:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
