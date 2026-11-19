-- =============================================================================
-- ClinicOS · 017 · Renomeia "Clientes" para "Clínicas" na plataforma
-- =============================================================================
-- A área de gestão de tenants da plataforma passa a se chamar "Clínicas" em
-- rotas, rótulos, catálogo de módulos e permissões. Esta migration é
-- idempotente: em instalações novas (011/012 já renomeados) nada é alterado.

-- Catálogo de módulos da plataforma -----------------------------------------
update modules
   set key = 'plataforma-clinicas',
       name = 'Clínicas',
       description = 'Cadastro e contratação de clínicas.',
       route = '/admin/clinicas',
       updated_at = now()
 where key = 'plataforma-clientes';

-- Funcionalidades do módulo ------------------------------------------------
update module_features
   set key = 'visao-clinicas'
 where key = 'visao-clientes';

update module_features
   set name = 'Visão de clínicas'
 where name = 'Visão de clientes';

-- Permissões (RBAC) --------------------------------------------------------
update permissions
   set key = replace(key, 'plataforma-clientes:', 'plataforma-clinicas:'),
       description = case key
         when 'plataforma-clientes:view' then 'Visualizar clínicas'
         when 'plataforma-clientes:create' then 'Criar clínica'
         when 'plataforma-clientes:edit' then 'Editar clínica'
         else description
       end
 where key like 'plataforma-clientes:%';
