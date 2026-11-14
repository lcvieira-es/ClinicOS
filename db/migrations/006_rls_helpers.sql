-- =============================================================================
-- ClinicOS · 006 · Catálogo de permissões, funções de sessão e views seguras
-- =============================================================================

create table permissions (
  id          uuid primary key default gen_random_uuid(),
  module_id   uuid references modules(id) on delete cascade,
  key         text not null unique,
  action      text not null,
  description text,
  created_at  timestamptz not null default now()
);

create table role_permissions (
  role          app_role not null,
  permission_id uuid not null references permissions(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (role, permission_id)
);

-- Contexto de sessão -----------------------------------------------------------
-- O backend define, por transação:
--   select set_config('app.user_id', '<uuid>', true);
--   select set_config('app.clinic_id', '<uuid>', true);
create or replace function app_current_user_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.user_id', true), '')::uuid
$$;

create or replace function app_current_clinic_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.clinic_id', true), '')::uuid
$$;

-- Helpers com SECURITY DEFINER para consultar vínculos sem recursão de RLS -----
create or replace function app_is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from platform_admins pa
    where pa.user_id = app_current_user_id()
      and pa.status = 'ativo'
  )
$$;

create or replace function app_is_member_of_clinic(p_clinic uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from clinic_memberships m
    where m.clinic_id = p_clinic
      and m.user_id = app_current_user_id()
      and m.status = 'ativo'
  )
$$;

create or replace function app_has_any_role(p_clinic uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from clinic_memberships m
    where m.clinic_id = p_clinic
      and m.user_id = app_current_user_id()
      and m.status = 'ativo'
      and m.role::text = any (p_roles)
  )
$$;

create or replace function app_has_permission(p_clinic uuid, p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from clinic_memberships m
    join role_permissions rp on rp.role = m.role
    join permissions p on p.id = rp.permission_id
    where m.clinic_id = p_clinic
      and m.user_id = app_current_user_id()
      and m.status = 'ativo'
      and p.key = p_permission
  )
$$;

create or replace function app_professional_id(p_clinic uuid)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select pr.id
  from professionals pr
  where pr.clinic_id = p_clinic
    and pr.user_id = app_current_user_id()
    and pr.status = 'ativo'
  limit 1
$$;

create or replace function app_owns_patient(p_patient uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from patient_portal_access a
    where a.patient_id = p_patient
      and a.user_id = app_current_user_id()
      and a.status = 'ativo'
  )
$$;

create or replace function app_shares_clinic_with_user(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from clinic_memberships me
    join clinic_memberships other on other.clinic_id = me.clinic_id
    where me.user_id = app_current_user_id()
      and me.status = 'ativo'
      and me.role = 'clinic_admin'
      and other.user_id = p_user
      and other.status = 'ativo'
  )
$$;

-- Mascaramento de CPF para perfis sem permissão de dado sensível ---------------
create or replace function app_mask_cpf(p_cpf text)
returns text
language sql
immutable
as $$
  select case
    when p_cpf is null or length(p_cpf) <> 11 then p_cpf
    else '***.***.***-' || right(p_cpf, 2)
  end
$$;

-- View de diretório com campo mascarado por perfil -----------------------------
create or replace view v_patients_directory
with (security_invoker = true)
as
select
  p.id,
  p.clinic_id,
  p.full_name,
  p.social_name,
  case
    when app_has_permission(p.clinic_id, 'pacientes:view_sensitive') then p.cpf
    else app_mask_cpf(p.cpf)
  end as cpf,
  p.birth_date,
  p.sex,
  p.email,
  p.phone,
  p.whatsapp,
  p.city,
  p.state,
  p.status,
  ip.name as insurance_provider_name
from patients p
left join insurance_providers ip on ip.id = p.insurance_provider_id;
