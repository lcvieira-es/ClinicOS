-- =============================================================================
-- ClinicOS · 011 · Catálogo inicial (módulos, funcionalidades, planos)
-- Dados de referência — não são dados fictícios de pacientes/clínicas.
-- =============================================================================

insert into modules
  (key, name, description, category, audience, icon, route, is_core, is_plan, is_active, sort_order)
values
  ('painel', 'Painel', 'Visão geral da operação da clínica.', 'operacao', 'clinica', 'layout-dashboard', '/app/painel', false, true, true, 10),
  ('agenda', 'Agenda', 'Agendamentos, confirmações e lista de espera.', 'operacao', 'clinica', 'calendar-days', '/app/agenda', false, true, true, 20),
  ('consultas', 'Consultas', 'Registro e acompanhamento dos atendimentos.', 'operacao', 'clinica', 'stethoscope', '/app/consultas', false, true, true, 30),
  ('prontuarios', 'Prontuários', 'Documentação clínica do paciente.', 'clinico', 'clinica', 'file-text', '/app/prontuarios', false, true, true, 40),
  ('prescricoes', 'Prescrições', 'Receitas, catálogo e assinatura digital.', 'clinico', 'clinica', 'pill', '/app/prescricoes', false, true, true, 50),
  ('exames', 'Exames', 'Solicitações, resultados e pendências.', 'clinico', 'clinica', 'flask-conical', '/app/exames', false, true, true, 60),
  ('financeiro', 'Financeiro', 'Contas, faturamento e fluxo de caixa.', 'gestao', 'clinica', 'wallet', '/app/financeiro', false, true, true, 70),
  ('convenios', 'Convênios', 'Operadoras, guias, faturamento e glosas.', 'gestao', 'clinica', 'shield-check', '/app/convenios', false, true, true, 80),
  ('estoque', 'Estoque', 'Produtos, movimentações e estoque mínimo.', 'gestao', 'clinica', 'package', '/app/estoque', false, true, true, 90),
  ('pacientes', 'Pacientes', 'Cadastro, histórico e consentimento LGPD.', 'cadastros', 'clinica', 'users', '/app/pacientes', false, true, true, 100),
  ('medicos', 'Médicos e profissionais', 'Corpo clínico, conselho e especialidades.', 'cadastros', 'clinica', 'user-round-cog', '/app/profissionais', false, true, true, 110),
  ('unidades', 'Unidades', 'Matriz, filiais e consultórios.', 'cadastros', 'clinica', 'building-2', '/app/unidades', false, true, true, 120),
  ('ia', 'Assistente de IA', 'Apoio à documentação e organização clínica.', 'relacionamento', 'clinica', 'sparkles', '/app/ia', false, true, true, 130),
  ('whatsapp', 'WhatsApp', 'Lembretes, templates e histórico de mensagens.', 'relacionamento', 'clinica', 'message-circle', '/app/whatsapp', false, true, true, 140),
  ('portal', 'Portal do paciente', 'Acesso do paciente a consultas e documentos.', 'relacionamento', 'clinica', 'globe', '/portal', false, true, true, 150),
  ('usuarios', 'Usuários e permissões', 'Equipe, perfis e auditoria de acessos.', 'sistema', 'clinica', 'user-cog', '/app/usuarios', true, false, true, 160),
  ('assinatura', 'Assinatura', 'Plano, limites, faturas e upgrade.', 'sistema', 'clinica', 'credit-card', '/app/assinatura', true, false, true, 170),
  ('configuracoes', 'Configurações', 'Dados da clínica, preferências e integrações.', 'sistema', 'clinica', 'settings', '/app/configuracoes', true, false, true, 180),
  ('relatorios', 'Relatórios', 'Indicadores operacionais e financeiros.', 'sistema', 'clinica', 'bar-chart-3', '/app/relatorios', true, false, true, 190),
  ('plataforma-dashboard', 'Dashboard da plataforma', 'Visão consolidada de clínicas e receita.', 'plataforma', 'plataforma', 'layout-dashboard', '/admin', true, false, true, 200),
  ('plataforma-clinicas', 'Clínicas', 'Cadastro e contratação de clínicas.', 'plataforma', 'plataforma', 'building-2', '/admin/clinicas', true, false, true, 210),
  ('plataforma-planos', 'Planos de assinatura', 'Catálogo comercial, limites e preços.', 'plataforma', 'plataforma', 'layers', '/admin/planos', true, false, true, 220),
  ('plataforma-modulos', 'Módulos e funcionalidades', 'Catálogo de módulos e adoção.', 'plataforma', 'plataforma', 'boxes', '/admin/modulos', true, false, true, 230),
  ('plataforma-assinaturas', 'Assinaturas', 'Contratos, status e renovações.', 'plataforma', 'plataforma', 'file-badge', '/admin/assinaturas', true, false, true, 240),
  ('plataforma-pagamentos', 'Pagamentos', 'Faturas e registro de pagamentos.', 'plataforma', 'plataforma', 'wallet', '/admin/pagamentos', true, false, true, 250),
  ('plataforma-relatorios', 'Relatórios', 'Receita, planos e adoção de módulos.', 'plataforma', 'plataforma', 'bar-chart-3', '/admin/relatorios', true, false, true, 260),
  ('plataforma-configuracoes', 'Configurações da plataforma', 'Padrões, gateway e contato comercial.', 'plataforma', 'plataforma', 'settings', '/admin/configuracoes', true, false, true, 270)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  audience = excluded.audience,
  icon = excluded.icon,
  route = excluded.route,
  is_core = excluded.is_core,
  is_plan = excluded.is_plan,
  sort_order = excluded.sort_order;

-- Funcionalidades -------------------------------------------------------------
insert into module_features (module_id, key, name, description, sort_order)
select m.id, v.feature_key, v.name, v.description, v.sort_order
from (
  values
    ('painel', 'indicadores-operacionais', 'Indicadores operacionais', 'Consultas, faltas e cancelamentos do dia.', 10),
    ('painel', 'resumo-consultas', 'Resumo de consultas', 'Situação dos atendimentos em tempo real.', 20),
    ('painel', 'alertas', 'Alertas', 'Pendências financeiras e de exames.', 30),
    ('agenda', 'agenda-diaria', 'Agenda diária', 'Visualização por dia e profissional.', 10),
    ('agenda', 'agenda-semanal', 'Agenda semanal', 'Visualização consolidada da semana.', 20),
    ('agenda', 'bloqueio-horarios', 'Bloqueio de horários', 'Férias, ausências e intervalos.', 30),
    ('agenda', 'lista-espera', 'Lista de espera', 'Encaixe de pacientes por prioridade.', 40),
    ('agenda', 'confirmacao-automatica', 'Confirmação automática', 'Confirmação de presença por mensagem.', 50),
    ('agenda', 'lembretes', 'Lembretes', 'Avisos de consulta ao paciente.', 60),
    ('consultas', 'registro-atendimento', 'Registro de atendimento', 'Check-in, início e conclusão.', 10),
    ('consultas', 'historico-consultas', 'Histórico de consultas', 'Consulta por período e profissional.', 20),
    ('consultas', 'controle-atendimento', 'Controle de atendimento', 'Status e fila de espera.', 30),
    ('prontuarios', 'anamnese', 'Anamnese', 'Queixa principal e história da doença.', 10),
    ('prontuarios', 'evolucao-clinica', 'Evolução clínica', 'Notas e evolução por atendimento.', 20),
    ('prontuarios', 'historico-medico', 'Histórico médico', 'Registros anteriores do paciente.', 30),
    ('prontuarios', 'alergias', 'Alergias', 'Alergias e reações adversas.', 40),
    ('prontuarios', 'diagnosticos', 'Diagnósticos', 'CID-10 e hipóteses registradas.', 50),
    ('prescricoes', 'receitas', 'Receitas', 'Emissão e histórico de receitas.', 10),
    ('prescricoes', 'catalogo-medicamentos', 'Catálogo de medicamentos', 'Medicamentos e apresentações.', 20),
    ('prescricoes', 'modelos-prescricao', 'Modelos de prescrição', 'Modelos reutilizáveis.', 30),
    ('prescricoes', 'assinatura-documentos', 'Assinatura de documentos', 'Hash, código de verificação e assinatura.', 40),
    ('exames', 'solicitacoes', 'Solicitações', 'Pedidos de exames por paciente.', 10),
    ('exames', 'pedidos-medicos', 'Pedidos médicos', 'Catálogo TUSS e indicação clínica.', 20),
    ('exames', 'anexo-resultados', 'Anexação de resultados', 'Laudos e anexos.', 30),
    ('exames', 'acompanhamento-pendencias', 'Acompanhamento de pendências', 'Exames aguardando resultado.', 40),
    ('financeiro', 'contas-pagar', 'Contas a pagar', 'Despesas e vencimentos.', 10),
    ('financeiro', 'contas-receber', 'Contas a receber', 'Receitas e inadimplência.', 20),
    ('financeiro', 'fluxo-caixa', 'Fluxo de caixa', 'Entradas, saídas e saldo.', 30),
    ('financeiro', 'faturamento', 'Faturamento', 'Receitas por atendimento e convênio.', 40),
    ('financeiro', 'conciliacao', 'Conciliação', 'Baixa e conferência de pagamentos.', 50),
    ('financeiro', 'comissoes', 'Comissões', 'Repasses por profissional.', 60),
    ('financeiro', 'orcamentos', 'Orçamentos', 'Propostas e aprovações.', 70),
    ('financeiro', 'relatorios-financeiros', 'Relatórios financeiros', 'Indicadores e exportações.', 80),
    ('convenios', 'cadastro-convenios', 'Cadastro de convênios', 'Operadoras e contratos.', 10),
    ('convenios', 'guias', 'Guias', 'Emissão e acompanhamento.', 20),
    ('convenios', 'autorizacoes', 'Autorizações', 'Solicitações e respostas.', 30),
    ('convenios', 'faturamento-convenios', 'Faturamento', 'Apresentação e pagamento.', 40),
    ('convenios', 'glosas', 'Glosas', 'Recursos e ajustes.', 50),
    ('estoque', 'produtos-insumos', 'Produtos e insumos', 'Cadastro e categorias.', 10),
    ('estoque', 'entradas', 'Entradas', 'Compras e recebimentos.', 20),
    ('estoque', 'saidas', 'Saídas', 'Consumo e dispensação.', 30),
    ('estoque', 'estoque-minimo', 'Estoque mínimo', 'Alertas de reposição.', 40),
    ('estoque', 'relatorios-estoque', 'Relatórios', 'Posição e validade.', 50),
    ('pacientes', 'cadastro-pacientes', 'Cadastro', 'Dados pessoais e contato.', 10),
    ('pacientes', 'historico-paciente', 'Histórico', 'Atendimentos e documentos.', 20),
    ('pacientes', 'consentimento-lgpd', 'Consentimento LGPD', 'Autorização e evidências.', 30),
    ('pacientes', 'importacao', 'Importação', 'Carga controlada de pacientes.', 40),
    ('pacientes', 'relatorios-pacientes', 'Relatórios', 'Indicadores da base.', 50),
    ('medicos', 'cadastro-profissionais', 'Cadastro', 'Dados do profissional.', 10),
    ('medicos', 'crm-especialidades', 'CRM e especialidades', 'Conselho, UF e especialidades.', 20),
    ('medicos', 'valores-consulta', 'Valores por consulta', 'Preço e duração padrão.', 30),
    ('medicos', 'vinculo-unidades', 'Vínculo com unidades', 'Atuação por unidade.', 40),
    ('unidades', 'cadastro-unidades', 'Cadastro de unidades', 'Matriz, filiais e consultórios.', 10),
    ('unidades', 'enderecos', 'Endereços', 'Localização e CEP.', 20),
    ('unidades', 'telefones', 'Telefones', 'Contatos por unidade.', 30),
    ('unidades', 'vinculo-profissionais', 'Vínculo de profissionais', 'Equipe por unidade.', 40),
    ('ia', 'assistente-documentacao', 'Assistente de documentação', 'Apoio à redação, sem decisão clínica.', 10),
    ('ia', 'resumo-prontuario', 'Resumo de prontuário', 'Síntese para revisão humana.', 20),
    ('ia', 'busca-inteligente', 'Busca inteligente', 'Localização de informações.', 30),
    ('ia', 'protecao-dados', 'Proteção de dados', 'Minimização e trilha de uso.', 40),
    ('whatsapp', 'lembretes-whatsapp', 'Lembretes', 'Avisos de consulta.', 10),
    ('whatsapp', 'templates-mensagem', 'Templates', 'Modelos aprovados.', 20),
    ('whatsapp', 'historico-mensagens', 'Histórico', 'Mensagens e status.', 30),
    ('whatsapp', 'status-entrega', 'Status de entrega', 'Envio, entrega e leitura.', 40),
    ('portal', 'acesso-paciente', 'Acesso do paciente', 'Login e vínculo seguro.', 10),
    ('portal', 'consultas-portal', 'Consultas', 'Agenda e histórico.', 20),
    ('portal', 'resultados-portal', 'Resultados', 'Exames liberados.', 30),
    ('portal', 'documentos-portal', 'Documentos', 'Receitas e atestados.', 40),
    ('usuarios', 'convites', 'Convites', 'Envio e aceite.', 10),
    ('usuarios', 'perfis', 'Perfis', 'Papéis e vínculos.', 20),
    ('usuarios', 'permissoes', 'Permissões', 'Matriz de acesso.', 30),
    ('usuarios', 'auditoria', 'Auditoria', 'Trilha de ações.', 40),
    ('assinatura', 'plano-atual', 'Plano atual', 'Módulos e limites.', 10),
    ('assinatura', 'faturas', 'Faturas', 'Histórico de cobranças.', 20),
    ('assinatura', 'limites', 'Limites', 'Consumo do plano.', 30),
    ('assinatura', 'upgrade', 'Upgrade', 'Mudança de plano.', 40),
    ('configuracoes', 'dados-clinica', 'Dados da clínica', 'Identificação e endereço.', 10),
    ('configuracoes', 'preferencias', 'Preferências', 'Fuso, moeda e agenda.', 20),
    ('configuracoes', 'integracoes', 'Integrações', 'WhatsApp, pagamentos e IA.', 30),
    ('configuracoes', 'seguranca', 'Segurança', 'Sessões, LGPD e auditoria.', 40),
    ('relatorios', 'relatorios-operacionais', 'Operacionais', 'Agenda, faltas e produção.', 10),
    ('relatorios', 'relatorios-financeiros', 'Financeiros', 'Receita, despesa e convênios.', 20),
    ('relatorios', 'exportacao', 'Exportação', 'CSV e PDF.', 30),
    ('relatorios', 'agendados', 'Agendados', 'Envio periódico.', 40),
    ('plataforma-dashboard', 'visao-clinicas', 'Visão de clínicas', 'Clínicas, status e implantação.', 10),
    ('plataforma-dashboard', 'receita-recorrente', 'Receita recorrente', 'MRR, ARR e ticket médio.', 20),
    ('plataforma-dashboard', 'renovacoes', 'Renovações', 'Próximos vencimentos.', 30),
    ('plataforma-clinicas', 'cadastro-clinicas', 'Cadastro de clínicas', 'Dados, administrador e assinatura.', 10),
    ('plataforma-clinicas', 'modulos-contratados', 'Módulos contratados', 'Plano e adicionais.', 20),
    ('plataforma-clinicas', 'link-conta', 'Link da conta', 'Acesso ao ambiente da clínica.', 30),
    ('plataforma-planos', 'catalogo-planos', 'Catálogo', 'Planos comerciais.', 10),
    ('plataforma-planos', 'limites', 'Limites', 'Usuários, unidades e IA.', 20),
    ('plataforma-planos', 'precos', 'Preços', 'Mensal e anual.', 30),
    ('plataforma-modulos', 'catalogo-modulos', 'Catálogo', 'Módulos e categorias.', 10),
    ('plataforma-modulos', 'funcionalidades', 'Funcionalidades', 'Detalhe por módulo.', 20),
    ('plataforma-modulos', 'adocao', 'Adoção', 'Clínicas por módulo.', 30),
    ('plataforma-assinaturas', 'contratos', 'Contratos', 'Vigência e condições.', 10),
    ('plataforma-assinaturas', 'status', 'Status', 'Teste, ativa e inadimplente.', 20),
    ('plataforma-assinaturas', 'renovacoes', 'Renovações', 'Ciclos e vencimentos.', 30),
    ('plataforma-pagamentos', 'faturas', 'Faturas', 'Emissão e baixa.', 10),
    ('plataforma-pagamentos', 'registro-pagamentos', 'Registro de pagamentos', 'Baixa manual e conciliação.', 20),
    ('plataforma-pagamentos', 'gateway', 'Gateway', 'Stripe, Asaas e manual.', 30),
    ('plataforma-relatorios', 'receita', 'Receita', 'MRR, ARR e inadimplência.', 10),
    ('plataforma-relatorios', 'adocao-modulos', 'Adoção de módulos', 'Uso por clínica.', 20),
    ('plataforma-relatorios', 'exportacao', 'Exportação', 'CSV e PDF.', 30),
    ('plataforma-configuracoes', 'padroes-plataforma', 'Padrões', 'Teste, periodicidade e contato.', 10),
    ('plataforma-configuracoes', 'gateway', 'Gateway', 'Provedor padrão.', 20),
    ('plataforma-configuracoes', 'observacoes', 'Observações', 'Notas internas.', 30)
) as v(module_key, feature_key, name, description, sort_order)
join modules m on m.key = v.module_key
on conflict (module_id, key) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

-- Planos ----------------------------------------------------------------------
insert into plans
  (name, slug, description, monthly_price, annual_price, user_limit, professional_limit,
   unit_limit, patient_limit, storage_gb, ai_interaction_limit, message_limit, trial_days, is_active, sort_order)
values
  ('Essencial', 'essential', 'Para consultórios que estão organizando a operação.',
   189.00, 1890.00, 3, 2, 1, 500, 5, 100, 200, 14, true, 10),
  ('Profissional', 'professional', 'Para clínicas com equipe, prontuário e convênios.',
   349.00, 3490.00, 10, 5, 2, 2000, 20, 500, 1000, 14, true, 20),
  ('Empresarial', 'enterprise', 'Para redes com várias unidades e alto volume.',
   690.00, 6900.00, 30, 15, 5, 10000, 100, 2000, 5000, 14, true, 30)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  monthly_price = excluded.monthly_price,
  annual_price = excluded.annual_price,
  user_limit = excluded.user_limit,
  professional_limit = excluded.professional_limit,
  unit_limit = excluded.unit_limit,
  patient_limit = excluded.patient_limit,
  storage_gb = excluded.storage_gb,
  ai_interaction_limit = excluded.ai_interaction_limit,
  message_limit = excluded.message_limit,
  trial_days = excluded.trial_days;

-- Módulos por plano -----------------------------------------------------------
insert into plan_modules (plan_id, module_id)
select p.id, m.id
from (values
  ('essential', 'painel'), ('essential', 'agenda'), ('essential', 'consultas'), ('essential', 'pacientes'),
  ('professional', 'painel'), ('professional', 'agenda'), ('professional', 'consultas'), ('professional', 'pacientes'),
  ('professional', 'prontuarios'), ('professional', 'prescricoes'), ('professional', 'exames'),
  ('professional', 'financeiro'), ('professional', 'convenios'), ('professional', 'medicos'),
  ('enterprise', 'painel'), ('enterprise', 'agenda'), ('enterprise', 'consultas'), ('enterprise', 'pacientes'),
  ('enterprise', 'prontuarios'), ('enterprise', 'prescricoes'), ('enterprise', 'exames'),
  ('enterprise', 'financeiro'), ('enterprise', 'convenios'), ('enterprise', 'medicos'),
  ('enterprise', 'estoque'), ('enterprise', 'unidades')
) as v(plan_slug, module_key)
join plans p on p.slug = v.plan_slug
join modules m on m.key = v.module_key
on conflict (plan_id, module_id) do nothing;

-- Configurações iniciais da plataforma ----------------------------------------
insert into platform_settings (key, value) values
  ('platform.name', '{"value":"ClinicOS"}'::jsonb),
  ('platform.support_email', '{"value":"suporte@clinicos.app"}'::jsonb),
  ('platform.default_trial_days', '{"value":14}'::jsonb),
  ('platform.default_gateway', '{"value":"stripe"}'::jsonb),
  ('platform.default_periodicity', '{"value":"mensal"}'::jsonb),
  ('platform.whatsapp_mode', '{"value":"manual"}'::jsonb),
  ('platform.ai_guardrails', '{"diagnosis":false,"prescribing":false,"human_review":true}'::jsonb)
on conflict (key) do nothing;

-- Categorias financeiras padrão (globais) --------------------------------------
insert into financial_categories (clinic_id, name, type, is_system)
values
  (null, 'Consulta', 'receita', true),
  (null, 'Retorno', 'receita', true),
  (null, 'Procedimento', 'receita', true),
  (null, 'Exame', 'receita', true),
  (null, 'Convênio', 'receita', true),
  (null, 'Venda de produto', 'receita', true),
  (null, 'Salários', 'despesa', true),
  (null, 'Aluguel', 'despesa', true),
  (null, 'Materiais', 'despesa', true),
  (null, 'Impostos', 'despesa', true),
  (null, 'Marketing', 'despesa', true),
  (null, 'Outros', 'despesa', true)
on conflict do nothing;
