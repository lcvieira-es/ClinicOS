-- =============================================================================
-- ClinicOS · 004 · Financeiro, estoque, comunicação, assinaturas e auditoria
-- =============================================================================

create table financial_categories (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid references clinics(id) on delete cascade,
  name        text not null,
  type        transaction_type not null,
  is_system   boolean not null default false,
  created_at  timestamptz not null default now()
);
create unique index financial_categories_clinic_uidx
  on financial_categories (clinic_id, lower(name), type) where clinic_id is not null;
create unique index financial_categories_global_uidx
  on financial_categories (lower(name), type) where clinic_id is null;

create table insurance_claims (
  id                uuid primary key default gen_random_uuid(),
  clinic_id         uuid not null references clinics(id) on delete cascade,
  patient_id        uuid not null references patients(id) on delete restrict,
  provider_id       uuid not null references insurance_providers(id) on delete restrict,
  appointment_id    uuid references appointments(id) on delete set null,
  guide_number      text not null,
  tuss_code         text,
  procedure_name    text,
  presented_amount  numeric(12,2) not null default 0 check (presented_amount >= 0),
  approved_amount   numeric(12,2) check (approved_amount is null or approved_amount >= 0),
  status            claim_status not null default 'rascunho',
  sent_at           date,
  approved_at       date,
  paid_at           date,
  notes             text,
  created_by        uuid references users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (clinic_id, provider_id, guide_number)
);

create table financial_transactions (
  id                 uuid primary key default gen_random_uuid(),
  clinic_id          uuid not null references clinics(id) on delete cascade,
  unit_id            uuid references clinic_units(id) on delete set null,
  category_id        uuid references financial_categories(id) on delete set null,
  type               transaction_type not null,
  description        text not null,
  amount             numeric(12,2) not null check (amount > 0),
  due_date           date not null,
  paid_at            date,
  status             transaction_status not null default 'pendente',
  payment_method     payment_method,
  patient_id         uuid references patients(id) on delete set null,
  appointment_id     uuid references appointments(id) on delete set null,
  professional_id    uuid references professionals(id) on delete set null,
  insurance_claim_id uuid references insurance_claims(id) on delete set null,
  invoice_number     text,
  notes              text,
  created_by         uuid references users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table inventory_items (
  id               uuid primary key default gen_random_uuid(),
  clinic_id        uuid not null references clinics(id) on delete cascade,
  unit_id          uuid references clinic_units(id) on delete set null,
  name             text not null,
  category         text,
  sku              text,
  quantity         numeric(14,3) not null default 0 check (quantity >= 0),
  minimum_quantity numeric(14,3) not null default 0 check (minimum_quantity >= 0),
  unit_of_measure  text not null default 'un',
  unit_cost        numeric(12,2) not null default 0 check (unit_cost >= 0),
  sale_price       numeric(12,2) check (sale_price is null or sale_price >= 0),
  supplier         text,
  batch            text,
  expires_at       date,
  location         text,
  status           inventory_status not null default 'ativo',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create unique index inventory_items_sku_uidx
  on inventory_items (clinic_id, sku) where sku is not null;

create table inventory_movements (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references clinics(id) on delete cascade,
  item_id       uuid not null references inventory_items(id) on delete cascade,
  type          inventory_movement_type not null,
  quantity      numeric(14,3) not null check (quantity > 0),
  unit_cost     numeric(12,2),
  reason        text,
  reference     text,
  performed_by  uuid references users(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- Documentos e integridade ----------------------------------------------------
create table documents (
  id                uuid primary key default gen_random_uuid(),
  clinic_id         uuid not null references clinics(id) on delete cascade,
  patient_id        uuid not null references patients(id) on delete restrict,
  medical_record_id uuid references medical_records(id) on delete set null,
  document_type     text not null,
  title             text not null,
  file_path         text not null,
  mime_type         text,
  file_size         bigint check (file_size is null or file_size >= 0),
  sha256            text,
  signed_at         timestamptz,
  signed_by         uuid references users(id) on delete set null,
  signature_method  signature_method,
  verification_code text unique,
  created_by        uuid references users(id) on delete set null,
  created_at        timestamptz not null default now()
);

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid references clinics(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  type       notification_type not null default 'sistema',
  title      text not null,
  body       text,
  data       jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create table whatsapp_messages (
  id             uuid primary key default gen_random_uuid(),
  clinic_id      uuid not null references clinics(id) on delete cascade,
  patient_id     uuid references patients(id) on delete set null,
  appointment_id uuid references appointments(id) on delete set null,
  user_id        uuid references users(id) on delete set null,
  direction      whatsapp_direction not null default 'enviada',
  template_key   text,
  body           text not null,
  status         whatsapp_status not null default 'pendente',
  external_id    text,
  error_message  text,
  sent_at        timestamptz,
  created_at     timestamptz not null default now()
);

create table ai_interactions (
  id               uuid primary key default gen_random_uuid(),
  clinic_id        uuid not null references clinics(id) on delete cascade,
  user_id          uuid not null references users(id) on delete restrict,
  patient_id       uuid references patients(id) on delete set null,
  feature          ai_feature not null,
  prompt           text not null,
  response         text,
  model            text,
  prompt_tokens    integer,
  completion_tokens integer,
  safety_flags     jsonb not null default '{}'::jsonb,
  status           ai_status not null default 'pendente',
  reviewed_by      uuid references users(id) on delete set null,
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now()
);

-- Assinaturas e entitlements --------------------------------------------------
create table subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  clinic_id               uuid not null unique references clinics(id) on delete cascade,
  plan_id                 uuid not null references plans(id) on delete restrict,
  status                  subscription_status not null default 'em_teste',
  periodicity             billing_period not null default 'mensal',
  price                   numeric(12,2) not null default 0 check (price >= 0),
  discount                numeric(12,2) not null default 0 check (discount >= 0),
  started_at              date not null default current_date,
  current_period_start    date,
  current_period_end      date,
  trial_ends_at           date,
  gateway                 gateway_type not null default 'manual',
  gateway_subscription_id text,
  cancelled_at            timestamptz,
  cancellation_reason     text,
  created_by              uuid references users(id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create table subscription_invoices (
  id               uuid primary key default gen_random_uuid(),
  clinic_id        uuid not null references clinics(id) on delete cascade,
  subscription_id  uuid not null references subscriptions(id) on delete cascade,
  amount           numeric(12,2) not null check (amount >= 0),
  due_date         date not null,
  paid_at          date,
  status           invoice_status not null default 'aberta',
  gateway          gateway_type not null default 'manual',
  external_id      text unique,
  receipt_url      text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table clinic_modules (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references clinics(id) on delete cascade,
  module_id    uuid not null references modules(id) on delete cascade,
  enabled      boolean not null default true,
  source       module_source not null default 'plano',
  price        numeric(12,2) not null default 0 check (price >= 0),
  activated_at timestamptz,
  expires_at   timestamptz,
  created_by   uuid references users(id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (clinic_id, module_id)
);

create table clinic_features (
  clinic_id  uuid not null references clinics(id) on delete cascade,
  feature_id uuid not null references module_features(id) on delete cascade,
  enabled    boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (clinic_id, feature_id)
);

create table gateway_events (
  id                uuid primary key default gen_random_uuid(),
  gateway           gateway_type not null,
  external_event_id text not null unique,
  event_type        text,
  payload           jsonb not null default '{}'::jsonb,
  processed_at      timestamptz,
  error             text,
  created_at        timestamptz not null default now()
);

-- Auditoria --------------------------------------------------------------------
create table audit_logs (
  id             bigint generated always as identity primary key,
  clinic_id      uuid references clinics(id) on delete set null,
  actor_user_id  uuid references users(id) on delete set null,
  actor_role     app_role,
  action         audit_action not null,
  entity         text not null,
  entity_id      text,
  before_data    jsonb,
  after_data     jsonb,
  ip             inet,
  user_agent     text,
  request_id     text,
  prev_hash      text,
  hash           text not null,
  created_at     timestamptz not null default now()
);
create index audit_logs_clinic_created_idx on audit_logs (clinic_id, created_at desc);

create table record_access_logs (
  id                bigint generated always as identity primary key,
  clinic_id         uuid not null references clinics(id) on delete cascade,
  medical_record_id uuid not null references medical_records(id) on delete cascade,
  user_id           uuid references users(id) on delete set null,
  action            text not null default 'view',
  ip                inet,
  created_at        timestamptz not null default now()
);
