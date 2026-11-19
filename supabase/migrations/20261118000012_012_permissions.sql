-- =============================================================================
-- ClinicOS · 012 · Permissões (RBAC)
-- =============================================================================

insert into permissions (module_id, key, action, description)
select m.id, m.key || ':' || v.action, v.action, v.description
from (
  values
    ('painel', 'view', 'Visualizar painel'),
    ('agenda', 'view', 'Visualizar agenda'),
    ('agenda', 'create', 'Criar agendamento'),
    ('agenda', 'edit', 'Editar agendamento'),
    ('agenda', 'delete', 'Cancelar/excluir agendamento'),
    ('consultas', 'view', 'Visualizar consultas'),
    ('consultas', 'create', 'Registrar consulta'),
    ('consultas', 'edit', 'Editar consulta'),
    ('prontuarios', 'view', 'Visualizar prontuário'),
    ('prontuarios', 'create', 'Criar prontuário'),
    ('prontuarios', 'edit', 'Editar prontuário'),
    ('prontuarios', 'sign', 'Assinar prontuário'),
    ('prontuarios', 'export', 'Exportar prontuário'),
    ('prescricoes', 'view', 'Visualizar prescrições'),
    ('prescricoes', 'create', 'Emitir prescrição'),
    ('prescricoes', 'sign', 'Assinar prescrição'),
    ('prescricoes', 'cancel', 'Cancelar prescrição'),
    ('exames', 'view', 'Visualizar exames'),
    ('exames', 'create', 'Solicitar exames'),
    ('exames', 'result', 'Liberar resultado'),
    ('exames', 'delete', 'Excluir solicitação'),
    ('financeiro', 'view', 'Visualizar financeiro'),
    ('financeiro', 'create', 'Criar lançamento'),
    ('financeiro', 'edit', 'Editar lançamento'),
    ('financeiro', 'delete', 'Excluir lançamento'),
    ('financeiro', 'export', 'Exportar financeiro'),
    ('convenios', 'view', 'Visualizar convênios'),
    ('convenios', 'create', 'Criar guia'),
    ('convenios', 'edit', 'Editar guia'),
    ('convenios', 'approve', 'Aprovar/glosar guia'),
    ('estoque', 'view', 'Visualizar estoque'),
    ('estoque', 'create', 'Criar item'),
    ('estoque', 'edit', 'Editar item/movimentar'),
    ('estoque', 'delete', 'Excluir item'),
    ('pacientes', 'view', 'Visualizar pacientes'),
    ('pacientes', 'view_sensitive', 'Visualizar CPF e dados sensíveis'),
    ('pacientes', 'create', 'Criar paciente'),
    ('pacientes', 'edit', 'Editar paciente'),
    ('pacientes', 'delete', 'Excluir paciente'),
    ('pacientes', 'export', 'Exportar pacientes'),
    ('medicos', 'view', 'Visualizar profissionais'),
    ('medicos', 'create', 'Criar profissional'),
    ('medicos', 'edit', 'Editar profissional'),
    ('medicos', 'delete', 'Excluir profissional'),
    ('unidades', 'view', 'Visualizar unidades'),
    ('unidades', 'create', 'Criar unidade'),
    ('unidades', 'edit', 'Editar unidade'),
    ('unidades', 'delete', 'Excluir unidade'),
    ('ia', 'use', 'Usar assistente de IA'),
    ('whatsapp', 'view', 'Visualizar mensagens'),
    ('whatsapp', 'send', 'Enviar mensagens'),
    ('portal', 'view', 'Acessar portal'),
    ('portal', 'appointments', 'Visualizar consultas no portal'),
    ('portal', 'results', 'Visualizar resultados no portal'),
    ('portal', 'documents', 'Visualizar documentos no portal'),
    ('usuarios', 'view', 'Visualizar usuários'),
    ('usuarios', 'invite', 'Convidar usuário'),
    ('usuarios', 'edit', 'Editar permissões'),
    ('usuarios', 'delete', 'Remover usuário'),
    ('assinatura', 'view', 'Visualizar assinatura'),
    ('assinatura', 'manage', 'Gerenciar assinatura'),
    ('configuracoes', 'view', 'Visualizar configurações'),
    ('configuracoes', 'edit', 'Editar configurações'),
    ('relatorios', 'view', 'Visualizar relatórios'),
    ('relatorios', 'export', 'Exportar relatórios'),
    ('plataforma-dashboard', 'view', 'Visualizar dashboard da plataforma'),
    ('plataforma-clinicas', 'view', 'Visualizar clínicas'),
    ('plataforma-clinicas', 'create', 'Criar clínica'),
    ('plataforma-clinicas', 'edit', 'Editar clínica'),
    ('plataforma-clinicas', 'manage', 'Gerenciar módulos e assinatura'),
    ('plataforma-planos', 'view', 'Visualizar planos'),
    ('plataforma-planos', 'create', 'Criar plano'),
    ('plataforma-planos', 'edit', 'Editar plano'),
    ('plataforma-planos', 'delete', 'Desativar plano'),
    ('plataforma-modulos', 'view', 'Visualizar módulos'),
    ('plataforma-modulos', 'edit', 'Editar módulos e funcionalidades'),
    ('plataforma-assinaturas', 'view', 'Visualizar assinaturas'),
    ('plataforma-assinaturas', 'edit', 'Editar assinatura'),
    ('plataforma-assinaturas', 'manage', 'Gerenciar pagamentos e renovação'),
    ('plataforma-pagamentos', 'view', 'Visualizar pagamentos'),
    ('plataforma-pagamentos', 'manage', 'Registrar pagamento'),
    ('plataforma-relatorios', 'view', 'Visualizar relatórios da plataforma'),
    ('plataforma-relatorios', 'export', 'Exportar relatórios da plataforma'),
    ('plataforma-configuracoes', 'view', 'Visualizar configurações da plataforma'),
    ('plataforma-configuracoes', 'edit', 'Editar configurações da plataforma')
) as v(module_key, action, description)
join modules m on m.key = v.module_key
on conflict (key) do update set
  module_id = excluded.module_id,
  action = excluded.action,
  description = excluded.description;

-- Administrador da clínica: todos os módulos de clínica ------------------------
insert into role_permissions (role, permission_id)
select 'clinic_admin', p.id
from permissions p
join modules m on m.id = p.module_id
where m.audience = 'clinica'
on conflict do nothing;

-- Médico -----------------------------------------------------------------------
insert into role_permissions (role, permission_id)
select 'doctor', p.id
from permissions p
where p.key = any (array[
  'painel:view',
  'agenda:view', 'agenda:create', 'agenda:edit',
  'consultas:view', 'consultas:create', 'consultas:edit',
  'prontuarios:view', 'prontuarios:create', 'prontuarios:edit', 'prontuarios:sign', 'prontuarios:export',
  'prescricoes:view', 'prescricoes:create', 'prescricoes:sign', 'prescricoes:cancel',
  'exames:view', 'exames:create', 'exames:result',
  'pacientes:view', 'pacientes:view_sensitive',
  'medicos:view', 'unidades:view', 'convenios:view', 'estoque:view',
  'relatorios:view', 'ia:use', 'whatsapp:view', 'whatsapp:send',
  'portal:view', 'configuracoes:view', 'usuarios:view'
])
on conflict do nothing;

-- Recepcionista ----------------------------------------------------------------
insert into role_permissions (role, permission_id)
select 'receptionist', p.id
from permissions p
where p.key = any (array[
  'painel:view',
  'agenda:view', 'agenda:create', 'agenda:edit', 'agenda:delete',
  'consultas:view', 'consultas:create',
  'pacientes:view', 'pacientes:view_sensitive', 'pacientes:create', 'pacientes:edit',
  'medicos:view', 'unidades:view', 'convenios:view', 'estoque:view',
  'exames:view', 'exames:create', 'prescricoes:view',
  'relatorios:view', 'whatsapp:view', 'whatsapp:send',
  'portal:view', 'configuracoes:view'
])
on conflict do nothing;

-- Financeiro -------------------------------------------------------------------
insert into role_permissions (role, permission_id)
select 'finance', p.id
from permissions p
where p.key = any (array[
  'painel:view',
  'financeiro:view', 'financeiro:create', 'financeiro:edit', 'financeiro:delete', 'financeiro:export',
  'convenios:view', 'convenios:create', 'convenios:edit', 'convenios:approve',
  'estoque:view', 'estoque:create', 'estoque:edit', 'estoque:delete',
  'pacientes:view', 'medicos:view', 'unidades:view',
  'agenda:view', 'consultas:view', 'exames:view', 'prescricoes:view',
  'relatorios:view', 'relatorios:export',
  'assinatura:view', 'configuracoes:view', 'whatsapp:view'
])
on conflict do nothing;

-- Paciente ---------------------------------------------------------------------
insert into role_permissions (role, permission_id)
select 'patient', p.id
from permissions p
where p.key = any (array[
  'portal:view', 'portal:appointments', 'portal:results', 'portal:documents',
  'configuracoes:view'
])
on conflict do nothing;

-- Superadministrador da plataforma ---------------------------------------------
insert into role_permissions (role, permission_id)
select 'platform_admin', p.id
from permissions p
join modules m on m.id = p.module_id
where m.audience = 'plataforma'
on conflict do nothing;
