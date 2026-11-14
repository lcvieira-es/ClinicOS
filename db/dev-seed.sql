-- =============================================================================
-- ClinicOS · Seed de desenvolvimento
-- ATENÇÃO: dados fictícios, exclusivos para demonstração local.
-- A clínica criada é explicitamente rotulada "Clínica Demonstração" e a UI
-- exibe um aviso de ambiente de demonstração. Nunca usar em produção.
-- =============================================================================

begin;

insert into users (id, email, password_hash, full_name, status, email_verified_at)
values
  ('00000000-0000-4000-8000-000000000001', 'super@clinicos.dev', '__DEMO_PASSWORD_HASH__', 'Administrador da Plataforma', 'ativo', now()),
  ('11111111-1111-4111-8111-111111111111', 'admin@clinicos.dev', '__DEMO_PASSWORD_HASH__', 'Ana Ribeiro', 'ativo', now()),
  ('22222222-2222-4222-8222-222222222222', 'medico@clinicos.dev', '__DEMO_PASSWORD_HASH__', 'Dra. Helena Martins', 'ativo', now()),
  ('33333333-3333-4333-8333-333333333333', 'recepcao@clinicos.dev', '__DEMO_PASSWORD_HASH__', 'Bruno Costa', 'ativo', now()),
  ('44444444-4444-4444-8444-444444444444', 'financeiro@clinicos.dev', '__DEMO_PASSWORD_HASH__', 'Carla Nunes', 'ativo', now()),
  ('55555555-5555-4555-8555-555555555555', 'paciente@clinicos.dev', '__DEMO_PASSWORD_HASH__', 'Mariana Alves Souza', 'ativo', now());

insert into platform_admins (user_id, status)
values ('00000000-0000-4000-8000-000000000001', 'ativo');

insert into clinics
  (id, legal_name, trade_name, display_name, cnpj, email, phone, whatsapp,
   cep, address, address_number, neighborhood, city, state, status,
   portal_slug, notes)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Clínica Demonstração Ltda', 'Clínica Demonstração', 'Clínica Demonstração',
   '12345678000190', 'contato@clinica.demo', '(11) 4000-0000', '(11) 90000-0000',
   '01310100', 'Avenida Paulista', '1000', 'Bela Vista', 'São Paulo', 'SP', 'ativa',
   'clinica-demonstracao',
   'Registro fictício criado pelo seed de desenvolvimento. Não contém dados reais.');

insert into clinic_units
  (id, clinic_id, name, type, internal_code, phone, email,
   cep, address, address_number, neighborhood, city, state,
   manager_name, opening_hours, is_headquarters, status)
values
  ('aaaaaaaa-0000-4000-8000-000000000001',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Unidade Paulista', 'matriz', 'MATRIZ-01', '(11) 4000-0000', 'unidade@clinica.demo',
   '01310100', 'Avenida Paulista', '1000', 'Bela Vista', 'São Paulo', 'SP',
   'Ana Ribeiro', 'Segunda a sexta, 08h às 19h', true, 'ativa');

insert into clinic_memberships (clinic_id, user_id, role, status, job_title, hired_at)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'clinic_admin', 'ativo', 'Administradora', current_date - 400),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '22222222-2222-4222-8222-222222222222', 'doctor', 'ativo', 'Médica clínica', current_date - 380),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '33333333-3333-4333-8333-333333333333', 'receptionist', 'ativo', 'Recepcionista', current_date - 300),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '44444444-4444-4444-8444-444444444444', 'finance', 'ativo', 'Analista financeiro', current_date - 250);

insert into membership_units (membership_id, unit_id, clinic_id)
select m.id, 'aaaaaaaa-0000-4000-8000-000000000001', m.clinic_id
from clinic_memberships m
where m.clinic_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

insert into professionals
  (id, clinic_id, user_id, full_name, council, council_number, council_state,
   specialties, phone, email, consultation_price, default_duration_min,
   commission_percent, calendar_color, status, notes)
values
  ('aaaaaaaa-0000-4000-8000-000000000003',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '22222222-2222-4222-8222-222222222222',
   'Dra. Helena Martins', 'CRM', '123456', 'SP',
   array['Clínica Médica', 'Medicina do Trabalho'],
   '(11) 98888-0001', 'helena@clinica.demo', 350.00, 30, 30.00, '#0EA5E9',
   'ativo', 'Profissional fictícia do ambiente de demonstração.');

insert into professional_units (professional_id, unit_id, clinic_id)
values ('aaaaaaaa-0000-4000-8000-000000000003',
        'aaaaaaaa-0000-4000-8000-000000000001',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

insert into patients
  (id, clinic_id, full_name, social_name, cpf, birth_date, sex, gender,
   email, phone, whatsapp, city, state, status, preferred_unit_id,
   lgpd_consent_at, notes)
values
  ('aaaaaaaa-0000-4000-8000-000000000011', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Mariana Alves Souza', null, '00000000191', '1988-04-12', 'feminino', 'feminino',
   'mariana@exemplo.demo', '(11) 90000-0011', '(11) 90000-0011', 'São Paulo', 'SP',
   'ativo', 'aaaaaaaa-0000-4000-8000-000000000001', now() - interval '120 days',
   'Paciente fictícia do ambiente de demonstração.'),
  ('aaaaaaaa-0000-4000-8000-000000000012', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'João Pedro Lima', null, null, '1979-09-03', 'masculino', 'masculino',
   'joao@exemplo.demo', '(11) 90000-0012', '(11) 90000-0012', 'São Paulo', 'SP',
   'ativo', 'aaaaaaaa-0000-4000-8000-000000000001', now() - interval '90 days',
   'Paciente fictício do ambiente de demonstração.'),
  ('aaaaaaaa-0000-4000-8000-000000000013', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Beatriz Nogueira', null, null, '1995-01-27', 'feminino', 'feminino',
   'beatriz@exemplo.demo', '(11) 90000-0013', '(11) 90000-0013', 'São Paulo', 'SP',
   'ativo', 'aaaaaaaa-0000-4000-8000-000000000001', now() - interval '65 days',
   'Paciente fictícia do ambiente de demonstração.'),
  ('aaaaaaaa-0000-4000-8000-000000000014', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Carlos Eduardo Ramos', null, null, '1968-11-15', 'masculino', 'masculino',
   'carlos@exemplo.demo', '(11) 90000-0014', '(11) 90000-0014', 'São Paulo', 'SP',
   'ativo', 'aaaaaaaa-0000-4000-8000-000000000001', now() - interval '40 days',
   'Paciente fictício do ambiente de demonstração.'),
  ('aaaaaaaa-0000-4000-8000-000000000015', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Fernanda Ribeiro', null, null, '1992-06-08', 'feminino', 'feminino',
   'fernanda@exemplo.demo', '(11) 90000-0015', '(11) 90000-0015', 'São Paulo', 'SP',
   'ativo', 'aaaaaaaa-0000-4000-8000-000000000001', now() - interval '25 days',
   'Paciente fictícia do ambiente de demonstração.'),
  ('aaaaaaaa-0000-4000-8000-000000000016', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Lucas Martins', null, null, '2001-03-21', 'masculino', 'masculino',
   'lucas@exemplo.demo', '(11) 90000-0016', '(11) 90000-0016', 'São Paulo', 'SP',
   'ativo', 'aaaaaaaa-0000-4000-8000-000000000001', now() - interval '10 days',
   'Paciente fictício do ambiente de demonstração.');

insert into patient_portal_access (clinic_id, patient_id, user_id, status)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'aaaaaaaa-0000-4000-8000-000000000011',
        '55555555-5555-4555-8555-555555555555', 'ativo');

-- Assinatura e entitlements ---------------------------------------------------
insert into subscriptions
  (clinic_id, plan_id, status, periodicity, price, started_at,
   current_period_start, current_period_end, trial_ends_at, gateway)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   (select id from plans where slug = 'professional'),
   'ativa', 'mensal', 349.00, current_date - 120,
   date_trunc('month', current_date)::date,
   (date_trunc('month', current_date) + interval '1 month - 1 day')::date,
   null, 'manual');

insert into clinic_modules (clinic_id, module_id, enabled, source, activated_at)
select 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', pm.module_id, true, 'plano', now()
from plan_modules pm
join plans p on p.id = pm.plan_id
where p.slug = 'professional'
on conflict (clinic_id, module_id) do nothing;

-- Agenda de demonstração ------------------------------------------------------
insert into appointments
  (id, clinic_id, unit_id, patient_id, professional_id, type, status,
   scheduled_start, scheduled_end, checked_in_at, started_at, finished_at,
   payment_method, amount, created_by)
values
  ('aaaaaaaa-0000-4000-8000-000000000021', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000011',
   'aaaaaaaa-0000-4000-8000-000000000003', 'consulta', 'realizada',
   current_date + time '09:00', current_date + time '09:30',
   current_date + time '08:52', current_date + time '09:03', current_date + time '09:28',
   'pix', 350.00, '11111111-1111-4111-8111-111111111111'),
  ('aaaaaaaa-0000-4000-8000-000000000022', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000012',
   'aaaaaaaa-0000-4000-8000-000000000003', 'consulta', 'aguardando',
   current_date + time '10:00', current_date + time '10:30',
   current_date + time '09:47', null, null,
   'particular', 350.00, '33333333-3333-4333-8333-333333333333'),
  ('aaaaaaaa-0000-4000-8000-000000000023', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000013',
   'aaaaaaaa-0000-4000-8000-000000000003', 'retorno', 'confirmada',
   current_date + time '11:00', current_date + time '11:30',
   null, null, null,
   'particular', 180.00, '33333333-3333-4333-8333-333333333333'),
  ('aaaaaaaa-0000-4000-8000-000000000024', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000014',
   'aaaaaaaa-0000-4000-8000-000000000003', 'consulta', 'cancelada',
   current_date + time '14:00', current_date + time '14:30',
   null, null, null,
   'particular', 350.00, '33333333-3333-4333-8333-333333333333'),
  ('aaaaaaaa-0000-4000-8000-000000000025', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000015',
   'aaaaaaaa-0000-4000-8000-000000000003', 'consulta', 'faltou',
   current_date + time '15:00', current_date + time '15:30',
   null, null, null,
   'particular', 350.00, '33333333-3333-4333-8333-333333333333'),
  ('aaaaaaaa-0000-4000-8000-000000000026', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000016',
   'aaaaaaaa-0000-4000-8000-000000000003', 'consulta', 'agendada',
   current_date + interval '1 day' + time '09:00',
   current_date + interval '1 day' + time '09:30',
   null, null, null,
   'particular', 350.00, '33333333-3333-4333-8333-333333333333'),
  ('aaaaaaaa-0000-4000-8000-000000000027', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000011',
   'aaaaaaaa-0000-4000-8000-000000000003', 'retorno', 'realizada',
   current_date - interval '1 day' + time '10:00',
   current_date - interval '1 day' + time '10:30',
   current_date - interval '1 day' + time '09:55',
   current_date - interval '1 day' + time '10:02',
   current_date - interval '1 day' + time '10:26',
   'particular', 0.00, '33333333-3333-4333-8333-333333333333');

update appointments
set cancellation_reason = 'Paciente solicitou reagendamento.'
where id = 'aaaaaaaa-0000-4000-8000-000000000024';

-- Financeiro de demonstração --------------------------------------------------
insert into financial_transactions
  (clinic_id, unit_id, category_id, type, description, amount, due_date,
   paid_at, status, payment_method, patient_id, appointment_id, professional_id,
   created_by)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-0000-4000-8000-000000000001',
   (select id from financial_categories where clinic_id is null and name = 'Consulta' and type = 'receita'),
   'receita', 'Consulta — Mariana Alves Souza', 350.00, current_date, current_date, 'pago', 'pix',
   'aaaaaaaa-0000-4000-8000-000000000011', 'aaaaaaaa-0000-4000-8000-000000000021',
   'aaaaaaaa-0000-4000-8000-000000000003', '44444444-4444-4444-8444-444444444444'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-0000-4000-8000-000000000001',
   (select id from financial_categories where clinic_id is null and name = 'Consulta' and type = 'receita'),
   'receita', 'Consulta — João Pedro Lima', 350.00, current_date + 7, null, 'pendente', 'particular',
   'aaaaaaaa-0000-4000-8000-000000000012', null,
   'aaaaaaaa-0000-4000-8000-000000000003', '44444444-4444-4444-8444-444444444444'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-0000-4000-8000-000000000001',
   (select id from financial_categories where clinic_id is null and name = 'Aluguel' and type = 'despesa'),
   'despesa', 'Aluguel da unidade Paulista', 4200.00, current_date + 5, null, 'pendente', 'boleto',
   null, null, null, '44444444-4444-4444-8444-444444444444'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-0000-4000-8000-000000000001',
   (select id from financial_categories where clinic_id is null and name = 'Materiais' and type = 'despesa'),
   'despesa', 'Materiais de consumo', 680.00, current_date - 2, current_date - 2, 'pago', 'cartao_credito',
   null, null, null, '44444444-4444-4444-8444-444444444444');

-- Exames pendentes de demonstração --------------------------------------------
insert into exam_orders
  (id, clinic_id, patient_id, professional_id, appointment_id, order_date,
   priority, status, laboratory, clinical_indication, verification_code, created_by)
values
  ('aaaaaaaa-0000-4000-8000-000000000031', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'aaaaaaaa-0000-4000-8000-000000000011', 'aaaaaaaa-0000-4000-8000-000000000003',
   'aaaaaaaa-0000-4000-8000-000000000021', now() - interval '2 days',
   'rotina', 'solicitado', 'Laboratório Demonstração', 'Acompanhamento clínico.',
   'DEMO-EX-001', '22222222-2222-4222-8222-222222222222'),
  ('aaaaaaaa-0000-4000-8000-000000000032', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'aaaaaaaa-0000-4000-8000-000000000012', 'aaaaaaaa-0000-4000-8000-000000000003',
   null, now() - interval '5 days',
   'urgente', 'em_analise', 'Laboratório Demonstração', 'Investigação de quadro agudo.',
   'DEMO-EX-002', '22222222-2222-4222-8222-222222222222');

insert into exam_order_items (clinic_id, exam_order_id, exam_name, tuss_code, status, sort_order)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-0000-4000-8000-000000000031', 'Hemograma completo', '40304361', 'solicitado', 10),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-0000-4000-8000-000000000031', 'Glicemia de jejum', '40302032', 'solicitado', 20),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-0000-4000-8000-000000000032', 'PCR — Proteína C reativa', '40316390', 'em_analise', 10);

-- Notificações de demonstração ------------------------------------------------
insert into notifications (clinic_id, user_id, type, title, body, data)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111',
   'consulta', 'Agenda do dia organizada', '5 consultas previstas para hoje na Unidade Paulista.',
   '{"demo": true}'::jsonb),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111',
   'financeiro', 'Contas a receber', '1 recebimento pendente nesta semana.',
   '{"demo": true}'::jsonb);

commit;
