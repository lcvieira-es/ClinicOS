import { hash } from '@node-rs/argon2';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL ?? process.env.APP_DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL (ou APP_DATABASE_URL) não configurada.');
  process.exit(1);
}

const email = process.env.PROD_ADMIN_EMAIL ?? 'admin@platform.clinicos';
const password = process.env.PROD_ADMIN_PASSWORD;
if (!password || password.length < 8) {
  console.error('Defina PROD_ADMIN_PASSWORD com pelo menos 8 caracteres.');
  process.exit(1);
}

const pool = new Pool({ connectionString, max: 2 });
try {
  const client = await pool.connect();
  await client.query(`set timezone to 'America/Sao_Paulo'`);

  // verifica se o usuário já existe
  const existing = await client.query(
    `select id from users where email = $1`,
    [email],
  );

  let userId;
  if (existing.rows.length > 0) {
    userId = existing.rows[0].id;
    console.log(`Usuário ${email} já existe (id=${userId}).`);
  } else {
    const passwordHash = await hash(password, {
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });
    const inserted = await client.query(
      `insert into users (full_name, email, password_hash, status)
       values ($1, $2, $3, 'ativo')
       returning id`,
      ['Administrador da Plataforma', email, passwordHash],
    );
    userId = inserted.rows[0].id;
    console.log(`Usuário de plataforma criado: ${email} (id=${userId})`);
  }

  // garante o vínculo de platform_admin
  const pa = await client.query(
    `select 1 from platform_admins where user_id = $1`,
    [userId],
  );
  if (pa.rows.length === 0) {
    await client.query(
      `insert into platform_admins (user_id, is_active) values ($1, true)`,
      [userId],
    );
    console.log('Vínculo platform_admin criado.');
  } else {
    console.log('Vínculo platform_admin já existe.');
  }

  // garante platform_settings
  const ps = await client.query(`select 1 from platform_settings where key = 'platform'`);
  if (ps.rows.length === 0) {
    await client.query(
      `insert into platform_settings (key, value) values ('platform', '{}'::jsonb)`,
    );
    console.log('platform_settings criado.');
  }

  console.log('Seed de produção concluído (sem dados de demonstração).');
  client.release();
} catch (error) {
  console.error('Falha no seed de produção:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
