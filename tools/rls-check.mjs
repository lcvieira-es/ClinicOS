import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(here, '..', 'db', 'migrations');
const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();

const db = new PGlite();
await db.exec('create role clinicos_app nologin;');

for (const file of files) {
  await db.exec(await readFile(path.join(migrationsDir, file), 'utf8'));
}

const ids = {
  platform: '00000000-0000-4000-8000-000000000001',
  adminA: '11111111-1111-4111-8111-111111111111',
  doctorA: '22222222-2222-4222-8222-222222222222',
  adminB: '33333333-3333-4333-8333-333333333333',
  portalA: '44444444-4444-4444-8444-444444444444',
  clinicA: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  clinicB: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  unitA: 'aaaaaaaa-0000-4000-8000-000000000001',
  unitB: 'bbbbbbbb-0000-4000-8000-000000000001',
  patientA: 'aaaaaaaa-0000-4000-8000-000000000002',
  patientB: 'bbbbbbbb-0000-4000-8000-000000000002',
  professionalA: 'aaaaaaaa-0000-4000-8000-000000000003',
};

await db.exec(`
  insert into users (id, email, full_name) values
    ('${ids.platform}', 'super@clinicos.test', 'Super Admin'),
    ('${ids.adminA}', 'admin.a@clinicos.test', 'Admin A'),
    ('${ids.doctorA}', 'doctor.a@clinicos.test', 'Dra. A'),
    ('${ids.adminB}', 'admin.b@clinicos.test', 'Admin B'),
    ('${ids.portalA}', 'paciente.a@clinicos.test', 'Paciente A');

  insert into platform_admins (user_id) values ('${ids.platform}');

  insert into clinics (id, legal_name, display_name, cnpj, status)
  values
    ('${ids.clinicA}', 'Clinica A Ltda', 'Clinica A', '11111111111111', 'ativa'),
    ('${ids.clinicB}', 'Clinica B Ltda', 'Clinica B', '22222222222222', 'ativa');

  insert into clinic_units (id, clinic_id, name, type, is_headquarters)
  values
    ('${ids.unitA}', '${ids.clinicA}', 'Unidade A', 'matriz', true),
    ('${ids.unitB}', '${ids.clinicB}', 'Unidade B', 'matriz', true);

  insert into clinic_memberships (clinic_id, user_id, role, status) values
    ('${ids.clinicA}', '${ids.adminA}', 'clinic_admin', 'ativo'),
    ('${ids.clinicA}', '${ids.doctorA}', 'doctor', 'ativo'),
    ('${ids.clinicB}', '${ids.adminB}', 'clinic_admin', 'ativo');

  insert into professionals (id, clinic_id, user_id, full_name, council, council_number, council_state)
  values ('${ids.professionalA}', '${ids.clinicA}', '${ids.doctorA}', 'Dra. A', 'CRM', '12345', 'ES');

  insert into patients (id, clinic_id, full_name, cpf) values
    ('${ids.patientA}', '${ids.clinicA}', 'Paciente da Clinica A', '12345678901'),
    ('${ids.patientB}', '${ids.clinicB}', 'Paciente da Clinica B', '98765432100');

  insert into patient_portal_access (clinic_id, patient_id, user_id)
  values ('${ids.clinicA}', '${ids.patientA}', '${ids.portalA}');

  insert into appointments
    (clinic_id, unit_id, patient_id, professional_id, scheduled_start, scheduled_end)
  values
    ('${ids.clinicA}', '${ids.unitA}', '${ids.patientA}', '${ids.professionalA}',
     now() + interval '1 day', now() + interval '1 day 30 minutes');
`);

console.log('Fixtures criadas.');

// Runtime: Admin da clínica A
await db.exec('set role clinicos_app;');
await db.exec(`select set_config('app.user_id', '${ids.adminA}', false);`);
await db.exec(`select set_config('app.clinic_id', '${ids.clinicA}', false);`);

const visible = await db.query('select clinic_id, full_name from patients order by full_name');
console.log('Admin A vê pacientes:', visible.rows);

const clinics = await db.query('select display_name from clinics order by display_name');
console.log('Admin A vê clínicas:', clinics.rows);

let crossTenantBlocked = false;
try {
  await db.exec(`
    insert into patients (clinic_id, full_name)
    values ('${ids.clinicB}', 'Tentativa entre tenants');
  `);
} catch (error) {
  crossTenantBlocked = /row-level security|violates/i.test(error.message);
  console.log('Insert cross-tenant bloqueado:', error.message.split('\n')[0]);
}

const audit = await db.query(`
  select checked, chain_valid
  from fn_verify_audit_chain('${ids.clinicA}')
`);
console.log('Cadeia de auditoria (clínica A):', audit.rows[0]);

// Runtime: médico da clínica A
await db.exec(`select set_config('app.user_id', '${ids.doctorA}', false);`);
const doctorPatients = await db.query('select full_name from patients');
console.log('Médico A vê pacientes:', doctorPatients.rows);

const doctorFinance = await db.query('select count(*)::int as total from financial_transactions');
console.log('Médico A vê lançamentos financeiros:', doctorFinance.rows[0].total);

// Portal: paciente A só vê o próprio registro
await db.exec(`select set_config('app.user_id', '${ids.portalA}', false);`);
const portalPatients = await db.query('select full_name from patients order by full_name');
console.log('Paciente A vê pacientes:', portalPatients.rows);

// Plataforma: superadministrador não acessa prontuário/pacientes por padrão
await db.exec(`select set_config('app.user_id', '${ids.platform}', false);`);
const platformPatients = await db.query('select count(*)::int as total from patients');
const platformClinics = await db.query('select count(*)::int as total from clinics');
console.log('Superadministrador vê pacientes:', platformPatients.rows[0].total);
console.log('Superadministrador vê clínicas:', platformClinics.rows[0].total);

await db.exec('reset role;');

const pass = visible.rows.length === 1
  && visible.rows[0].full_name === 'Paciente da Clinica A'
  && crossTenantBlocked
  && audit.rows[0].chain_valid === true
  && doctorPatients.rows.length === 1
  && doctorFinance.rows[0].total === 0
  && portalPatients.rows.length === 1
  && portalPatients.rows[0].full_name === 'Paciente da Clinica A'
  && platformPatients.rows[0].total === 0
  && platformClinics.rows[0].total === 2;

console.log('');
console.log(pass ? 'RLS CHECK: PASSOU' : 'RLS CHECK: FALHOU');
if (!pass) process.exitCode = 1;

await db.close();
