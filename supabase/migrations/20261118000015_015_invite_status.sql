-- =============================================================================
-- ClinicOS · 015 · Status do convite (página pública de aceite)
-- =============================================================================

create or replace function app_invite_status(p_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v record;
begin
  select status::text as status, email, full_name, expires_at
    into v
    from user_invites
   where token_hash = p_token_hash
   limit 1;

  if not found then
    return jsonb_build_object('found', false);
  end if;

  return jsonb_build_object(
    'found', true,
    'status', v.status,
    'email', v.email,
    'fullName', v.full_name,
    'expiresAt', v.expires_at,
    'valid', (v.status = 'pendente' and v.expires_at > now())
  );
end;
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'clinicos_app') then
    grant execute on function app_invite_status(text) to clinicos_app;
  end if;
end $$;
