-- =============================================================================
-- ClinicOS · 002 · Plataforma, organizações e pessoas
-- =============================================================================

-- Identidade global -----------------------------------------------------------
create table users (
  id                uuid primary key default gen_random_uuid(),
  email             text not null,
  password_hash     text,
  full_name         text not null,
  phone             text,
  avatar_url        text,
  status            text not null default 'ativo'
                    check (status in ('ativo', 'inativo', 'bloqueado')),
  email_verified_at timestamptz,
  last_login_at     timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create unique index users_email_uidx on users (lower(email));

create table platform_admins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references users(id) on delete cascade,
  status      text not null default 'ativo' check (status in ('ativo', 'inativo')),
  granted_by  uuid references users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Catálogo comercial ----------------------------------------------------------
create table plans (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  slug                  text not null unique,
  description           text,
  monthly_price         numeric(12,2) not null default 0 check (monthly_price >= 0),
  annual_price          numeric(12,2) not null default 0 check (annual_price >= 0),
  user_limit            integer not null default 0 check (user_limit >= 0),
  professional_limit    integer not null default 0 check (professional_limit >= 0),
  unit_limit            integer not null default 0 check (unit_limit >= 0),
  patient_limit         integer not null default 0 check (patient_limit >= 0),
  storage_gb            integer not null default 0 check (storage_gb >= 0),
  ai_interaction_limit  integer not null default 0 check (ai_interaction_limit >= 0),
  message_limit         integer not null default 0 check (message_limit >= 0),
  trial_days            integer not null default 14 check (trial_days >= 0),
  is_active             boolean not null default true,
  sort_order            integer not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table modules (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  name        text not null,
  description text,
  category    module_category not null,
  audience    module_audience not null default 'clinica',
  icon        text,
  route       text,
  is_core     boolean not null default false,
  is_plan     boolean not null default true,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table module_features (
  id          uuid primary key default gen_random_uuid(),
  module_id   uuid not null references modules(id) on delete cascade,
  key         text not null,
  name        text not null,
  description text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (module_id, key)
);

create table plan_modules (
  plan_id    uuid not null references plans(id) on delete cascade,
  module_id  uuid not null references modules(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (plan_id, module_id)
);

create table platform_settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_by  uuid references users(id) on delete set null,
  updated_at  timestamptz not null default now()
);

-- Organização (tenant) --------------------------------------------------------
create table clinics (
  id                              uuid primary key default gen_random_uuid(),
  legal_name                      text not null,
  trade_name                      text,
  display_name                    text not null,
  cnpj                            text,
  state_registration              text,
  email                           text,
  phone                           text,
  whatsapp                        text,
  cep                             text,
  address                         text,
  address_number                  text,
  complement                      text,
  neighborhood                    text,
  city                            text,
  state                           char(2),
  legal_representative_name       text,
  legal_representative_cpf        text,
  legal_representative_email      text,
  legal_representative_phone      text,
  status                          clinic_status not null default 'em_implantacao',
  portal_slug                     text unique,
  logo_url                        text,
  timezone                        text not null default 'America/Sao_Paulo',
  notes                           text,
  settings                        jsonb not null default '{}'::jsonb,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now(),
  constraint clinics_cnpj_fmt check (cnpj is null or cnpj ~ '^[0-9]{14}$'),
  constraint clinics_cpf_fmt check (legal_representative_cpf is null or legal_representative_cpf ~ '^[0-9]{11}$'),
  constraint clinics_state_fmt check (state is null or state ~ '^[A-Z]{2}$')
);

create table clinic_units (
  id             uuid primary key default gen_random_uuid(),
  clinic_id      uuid not null references clinics(id) on delete cascade,
  name           text not null,
  type           unit_type not null default 'filial',
  internal_code  text,
  phone          text,
  email          text,
  cep            text,
  address        text,
  address_number text,
  complement     text,
  neighborhood   text,
  city           text,
  state          char(2),
  manager_name   text,
  opening_hours  text,
  is_headquarters boolean not null default false,
  status         text not null default 'ativa' check (status in ('ativa', 'inativa')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint clinic_units_state_fmt check (state is null or state ~ '^[A-Z]{2}$')
);
create unique index clinic_units_internal_code_uidx
  on clinic_units (clinic_id, internal_code) where internal_code is not null;

create table clinic_memberships (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references clinics(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  role        app_role not null check (role in ('clinic_admin', 'doctor', 'receptionist', 'finance')),
  status      membership_status not null default 'convidado',
  job_title   text,
  hired_at    date,
  invited_by  uuid references users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (clinic_id, user_id)
);

create table membership_units (
  membership_id uuid not null references clinic_memberships(id) on delete cascade,
  unit_id       uuid not null references clinic_units(id) on delete cascade,
  clinic_id     uuid not null references clinics(id) on delete cascade,
  primary key (membership_id, unit_id)
);

create table user_invites (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references clinics(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        app_role not null check (role in ('clinic_admin', 'doctor', 'receptionist', 'finance')),
  token_hash  text not null unique,
  status      invite_status not null default 'pendente',
  expires_at  timestamptz not null,
  accepted_at timestamptz,
  invited_by  uuid references users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Profissionais ---------------------------------------------------------------
create table professionals (
  id                   uuid primary key default gen_random_uuid(),
  clinic_id            uuid not null references clinics(id) on delete cascade,
  user_id              uuid references users(id) on delete set null,
  full_name            text not null,
  council              text,
  council_number       text,
  council_state        char(2),
  specialties          text[] not null default '{}',
  phone                text,
  email                text,
  consultation_price   numeric(12,2) not null default 0 check (consultation_price >= 0),
  default_duration_min integer not null default 30 check (default_duration_min > 0),
  commission_percent   numeric(5,2) not null default 0 check (commission_percent between 0 and 100),
  calendar_color       text not null default '#0EA5E9',
  status               text not null default 'ativo' check (status in ('ativo', 'inativo')),
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint professionals_state_fmt check (council_state is null or council_state ~ '^[A-Z]{2}$')
);
create unique index professionals_council_uidx
  on professionals (clinic_id, council, council_number, council_state)
  where council is not null and council_number is not null and council_state is not null;

create table professional_units (
  professional_id uuid not null references professionals(id) on delete cascade,
  unit_id         uuid not null references clinic_units(id) on delete cascade,
  clinic_id       uuid not null references clinics(id) on delete cascade,
  primary key (professional_id, unit_id)
);

create table professional_schedules (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references clinics(id) on delete cascade,
  professional_id uuid not null references professionals(id) on delete cascade,
  unit_id       uuid not null references clinic_units(id) on delete cascade,
  weekday       smallint not null check (weekday between 0 and 6),
  start_time    time not null,
  end_time      time not null,
  slot_minutes  integer not null default 30 check (slot_minutes > 0),
  valid_from    date,
  valid_to      date,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  constraint professional_schedules_time_check check (end_time > start_time)
);

create table schedule_blocks (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references clinics(id) on delete cascade,
  professional_id uuid not null references professionals(id) on delete cascade,
  unit_id         uuid references clinic_units(id) on delete set null,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  reason          text,
  created_by      uuid references users(id) on delete set null,
  created_at      timestamptz not null default now(),
  constraint schedule_blocks_range_check check (ends_at > starts_at)
);

-- Convênios (catálogo global + contrato por clínica) --------------------------
create table insurance_providers (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  ans_registration  text unique,
  cnpj              text,
  contact_email     text,
  contact_phone     text,
  status            text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table clinic_insurance_contracts (
  id                  uuid primary key default gen_random_uuid(),
  clinic_id           uuid not null references clinics(id) on delete cascade,
  provider_id         uuid not null references insurance_providers(id) on delete restrict,
  status              text not null default 'ativo' check (status in ('ativo', 'inativo')),
  payment_term_days   integer not null default 30 check (payment_term_days >= 0),
  default_table       text,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (clinic_id, provider_id)
);

-- Pacientes -------------------------------------------------------------------
create table patients (
  id                      uuid primary key default gen_random_uuid(),
  clinic_id               uuid not null references clinics(id) on delete cascade,
  full_name               text not null,
  social_name             text,
  cpf                     text,
  birth_date              date,
  sex                     sex_type not null default 'nao_informado',
  gender                  text,
  email                   text,
  phone                   text,
  whatsapp                text,
  cep                     text,
  address                 text,
  address_number          text,
  complement              text,
  neighborhood            text,
  city                    text,
  state                   char(2),
  insurance_provider_id   uuid references insurance_providers(id) on delete set null,
  insurance_member_number text,
  emergency_contact_name  text,
  emergency_contact_phone text,
  notes                   text,
  status                  patient_status not null default 'ativo',
  preferred_unit_id       uuid references clinic_units(id) on delete set null,
  lgpd_consent_at         timestamptz,
  lgpd_consent_by         uuid references users(id) on delete set null,
  photo_url               text,
  created_by              uuid references users(id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint patients_cpf_fmt check (cpf is null or cpf ~ '^[0-9]{11}$'),
  constraint patients_state_fmt check (state is null or state ~ '^[A-Z]{2}$')
);
create unique index patients_clinic_cpf_uidx
  on patients (clinic_id, cpf) where cpf is not null;
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_trgm') then
    create index if not exists patients_name_trgm_idx on patients using gin (full_name gin_trgm_ops);
  else
    create index if not exists patients_name_idx on patients (full_name);
  end if;
end $$;

create table patient_portal_access (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references clinics(id) on delete cascade,
  patient_id  uuid not null references patients(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  status      text not null default 'ativo' check (status in ('ativo', 'revogado')),
  granted_at  timestamptz not null default now(),
  revoked_at  timestamptz,
  unique (patient_id, user_id)
);

create table patient_consents (
  id                uuid primary key default gen_random_uuid(),
  clinic_id         uuid not null references clinics(id) on delete cascade,
  patient_id        uuid not null references patients(id) on delete cascade,
  type              consent_type not null,
  granted           boolean not null default false,
  granted_at        timestamptz,
  revoked_at        timestamptz,
  evidence          jsonb not null default '{}'::jsonb,
  document_version  text,
  created_by        uuid references users(id) on delete set null,
  created_at        timestamptz not null default now()
);
