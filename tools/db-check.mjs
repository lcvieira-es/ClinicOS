import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(here, '..', 'db', 'migrations');

const files = (await readdir(migrationsDir))
  .filter((f) => f.endsWith('.sql'))
  .sort();

const db = new PGlite();
let applied = 0;

for (const file of files) {
  const sql = await readFile(path.join(migrationsDir, file), 'utf8');
  try {
    await db.exec(sql);
    applied += 1;
    console.log(`OK   ${file}`);
  } catch (error) {
    console.error(`FAIL ${file}`);
    console.error(error.message);
    if (error.position) console.error('position:', error.position);
    process.exitCode = 1;
    break;
  }
}

if (process.exitCode !== 1) {
  const tables = await db.query(`
    select count(*)::int as total
    from pg_tables
    where schemaname = 'public'
  `);
  const policies = await db.query(`
    select count(*)::int as total
    from pg_policies
    where schemaname = 'public'
  `);
  const modules = await db.query('select count(*)::int as total from modules');
  const plans = await db.query('select count(*)::int as total from plans');
  const permissions = await db.query('select count(*)::int as total from permissions');

  console.log('');
  console.log(`Migrations aplicadas: ${applied}/${files.length}`);
  console.log(`Tabelas: ${tables.rows[0].total}`);
  console.log(`Policies: ${policies.rows[0].total}`);
  console.log(`Módulos: ${modules.rows[0].total}`);
  console.log(`Planos: ${plans.rows[0].total}`);
  console.log(`Permissões: ${permissions.rows[0].total}`);

  const entitlements = await db.query(`
    select p.slug, count(pm.module_id)::int as modules
    from plans p
    left join plan_modules pm on pm.plan_id = p.id
    group by p.slug
    order by p.slug
  `);
  console.log('Módulos por plano:', entitlements.rows.map((r) => `${r.slug}=${r.modules}`).join(', '));
}

await db.close();
