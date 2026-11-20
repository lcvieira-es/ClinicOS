import { Pool } from 'pg';

const rawConnectionString = process.env.DATABASE_URL ?? process.env.APP_DATABASE_URL;
if (!rawConnectionString) {
  console.error('DATABASE_URL (ou APP_DATABASE_URL) não configurada.');
  process.exit(1);
}

// Remove sslmode da URL para evitar que o pg-connection-string sobrescreva a config de SSL.
const connectionString = rawConnectionString.replace(/[?&]sslmode=[^&]*/gi, (m) =>
  m.startsWith('?') ? '?' : '',
).replace(/\?$/, '');

const ssl =
  process.env.DB_SSL === 'true' || /sslmode=require/i.test(rawConnectionString)
    ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : undefined;

const pool = new Pool({ connectionString, max: 1, ssl });
try {
  const client = await pool.connect();
  const r = await client.query(`select now() as now, current_user as user, current_database() as db, version() as version`);
  console.log('Conexão OK:', r.rows[0]);
  const tables = await client.query(`select count(*)::int as n from information_schema.tables where table_schema = 'public'`);
  console.log('Tabelas públicas:', tables.rows[0].n);
  const migrations = await client.query(`select count(*)::int as n from schema_migrations`).catch(() => ({ rows: [{ n: 0 }] }));
  console.log('Migrations registradas:', migrations.rows[0].n);
  client.release();
  console.log('TESTE DE CONEXÃO: SUCESSO');
} catch (error) {
  console.error('TESTE DE CONEXÃO: FALHOU');
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
