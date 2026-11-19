-- =============================================================================
-- ClinicOS · 014 · Operação da clínica: limites de plano e aceite de convite
-- =============================================================================
-- O acesso a `subscriptions` é restrito a admin/financeiro por RLS, mas a
-- aplicação precisa dos limites do plano para qualquer perfil que cria
-- registros (ex.: recepcionista criando pacientes). Em vez de abrir a tabela,
-- expomos uma função SECURITY DEFINER guardada por vínculo ativo na clínica.
-- =============================================================================

create or replace function app_plan_limits(p_clinic uuid)
returns table (
  plan_name          text,
  user_limit         integer,
  professional_limit integer,
  unit_limit         integer,
  patient_limit      integer
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.name::text,
         p.user_limit,
         p.professional_limit,
         p.unit_limit,
         p.patient_limit
    from subscriptions s
    join plans p on p.id = s.plan_id
   where s.clinic_id = p_clinic
     and s.status in ('em_teste', 'ativa', 'inadimplente', 'vencida')
     and app_is_member_of_clinic(p_clinic)
   order by (s.status = 'ativa') desc,
            s.current_period_end desc nulls last,
            s.started_at desc
   limit 1;
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'clinicos_app') then
    grant execute on function app_plan_limits(uuid) to clinicos_app;
  end if;
end $$;

-- Diretório de pacientes: expõe colunas não sensíveis e mantém o CPF mascarado
-- no banco para perfis sem `pacientes:view_sensitive`. Colunas novas são
-- acrescentadas ao final para permitir `create or replace view`.
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
  ip.name as insurance_provider_name,
  p.lgpd_consent_at,
  p.created_at,
  p.updated_at
from patients p
left join insurance_providers ip on ip.id = p.insurance_provider_id;

-- Aceite de convite -----------------------------------------------------------
-- O convite é validado no banco (token, uso único e expiração) porque quem
-- aceita ainda não é membro da clínica: nenhuma política de RLS o deixaria
-- criar o próprio vínculo. A função é chamada pela aplicação com o hash do
-- token; o link contém o token em claro, exibido uma única vez ao convidar.
create or replace function app_accept_invite(
  p_token_hash    text,
  p_full_name     text,
  p_password_hash text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invite    user_invites%rowtype;
  v_user_id   uuid;
  v_user_name text;
  v_existing  users%rowtype;
begin
  select * into v_invite
    from user_invites
   where token_hash = p_token_hash
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalido');
  end if;

  if v_invite.status <> 'pendente' then
    return jsonb_build_object('ok', false, 'error', 'utilizado');
  end if;

  if v_invite.expires_at <= now() then
    update user_invites set status = 'expirado' where id = v_invite.id;
    return jsonb_build_object('ok', false, 'error', 'expirado');
  end if;

  v_user_name := coalesce(nullif(trim(p_full_name), ''), v_invite.full_name);

  if v_user_name is null or length(v_user_name) < 3 then
    return jsonb_build_object('ok', false, 'error', 'nome');
  end if;

  if p_password_hash is null or length(p_password_hash) < 20 then
    return jsonb_build_object('ok', false, 'error', 'senha');
  end if;

  select * into v_existing
    from users
   where lower(email) = lower(v_invite.email)
   limit 1;

  if v_existing.id is not null then
    v_user_id := v_existing.id;
  else
    insert into users (email, password_hash, full_name, status, email_verified_at)
    values (lower(v_invite.email), p_password_hash, v_user_name, 'ativo', now())
    returning id into v_user_id;
  end if;

  -- Quem aceita passa a ser o ator da própria admissão (auditoria).
  perform set_config('app.user_id', v_user_id::text, true);
  perform set_config('app.clinic_id', v_invite.clinic_id::text, true);

  insert into clinic_memberships (clinic_id, user_id, role, status, invited_by)
  values (v_invite.clinic_id, v_user_id, v_invite.role, 'ativo', v_invite.invited_by)
  on conflict (clinic_id, user_id) do update
    set role = excluded.role,
        status = 'ativo',
        updated_at = now();

  -- Atribuição padrão: todas as unidades ativas da clínica.
  insert into membership_units (membership_id, unit_id, clinic_id)
  select m.id, u.id, m.clinic_id
    from clinic_memberships m
    join clinic_units u
      on u.clinic_id = m.clinic_id
     and u.status = 'ativa'
   where m.clinic_id = v_invite.clinic_id
     and m.user_id = v_user_id
  on conflict do nothing;

  update user_invites
     set status = 'aceito',
         accepted_at = now()
   where id = v_invite.id;

  return jsonb_build_object(
    'ok', true,
    'userId', v_user_id,
    'clinicId', v_invite.clinic_id,
    'email', lower(v_invite.email),
    'existingUser', v_existing.id is not null
  );
end;
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'clinicos_app') then
    grant execute on function app_accept_invite(text, text, text) to clinicos_app;
  end if;
end $$;
