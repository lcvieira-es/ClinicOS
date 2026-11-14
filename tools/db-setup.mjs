import { mkdir, readdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { hash } from '@node-rs/argon2';

const DEMO_PASSWORD = 'Clinicos@2026';
const reset = process.argv.includes('--reset');
const dataDir = path.resolve(
  process.cwd(),
  process.env.PGLITE_DATA_DIR ?? '.data/clinicos',
);

if (reset) {
  console.log(`Removendo banco local em ${dataDir}…`);
  await rm(dataDir, { recursive: true, force: true });
}

// O PGlite exige que o diretório exista (não cria pais recursivamente).
await mkdir(dataDir, { recursive: true });

const db = new PGlite(dataDir);

await db.exec(`set timezone to 'America/Sao_Paulo'`);

const existing = await db.query(
  `select to_regclass('public.users') is not null as present`,
);

if (existing.rows[0]?.present) {
  console.log('Banco local já inicializado. Use --reset para recriar.');
  await db.close();
  process.exit(0);
}

console.log('Aplicando migrations…');
await db.exec(`
  do $$
  begin
    if not exists (select 1 from pg_roles where rolname = 'clinicos_app') then
      create role clinicos_app nologin;
    end if;
  end $$;
`);

const migrationsDir = path.resolve(process.cwd(), 'db', 'migrations');
const files = (await readdir(migrationsDir))
  .filter((file) => file.endsWith('.sql'))
  .sort();

for (const file of files) {
  const sql = await readFile(path.join(migrationsDir, file), 'utf8');
  await db.exec(sql);
  console.log(`  OK ${file}`);
}

console.log('Carregando dados de demonstração…');
const seedSql = await readFile(
  path.resolve(process.cwd(), 'db', 'dev-seed.sql'),
  'utf8',
);
const passwordHash = await hash(DEMO_PASSWORD, {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
});
await db.exec(seedSql.replaceAll('__DEMO_PASSWORD_HASH__', passwordHash));

const counts = await db.query(`
  select
    (select count(*)::int from users) as users,
    (select count(*)::int from clinics) as clinics,
    (select count(*)::int from patients) as patients,
    (select count(*)::int from appointments) as appointments
`);

console.log('');
console.log('Banco local pronto:', counts.rows[0]);
console.log('');
console.log('Credenciais de demonstração (senha única):', DEMO_PASSWORD);
console.log('  super@clinicos.dev       plataforma');
console.log('  admin@clinicos.dev       administrador da clínica');
console.log('  medico@clinicos.dev      médico');
console.log('  recepcao@clinicos.dev    recepção');
console.log('  financeiro@clinicos.dev  financeiro');
console.log('  paciente@clinicos.dev    portal do paciente');
console.log('');
console.log('Dados fictícios. Não use em produção.');

await db.close();
