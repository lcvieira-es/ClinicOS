-- =============================================================================
-- ClinicOS · 001 · Extensões e tipos enumerados
-- PostgreSQL 16+
-- =============================================================================

-- Extensões opcionais. Em produção (PostgreSQL/Supabase) todas devem existir.
-- O bloco tolera ambientes de teste embarcados que não as disponibilizam.
do $$
begin
  create extension if not exists pg_trgm;
exception when others then
  raise notice 'pg_trgm indisponível neste ambiente: %', sqlerrm;
end $$;

do $$
begin
  create extension if not exists btree_gist;
exception when others then
  raise notice 'btree_gist indisponível neste ambiente: %', sqlerrm;
end $$;

-- Perfis da plataforma -------------------------------------------------------
create type app_role as enum (
  'platform_admin',
  'clinic_admin',
  'doctor',
  'receptionist',
  'finance',
  'patient'
);

-- Plataforma / clínica -------------------------------------------------------
create type clinic_status as enum ('em_implantacao', 'ativa', 'suspensa', 'cancelada');
create type unit_type as enum ('matriz', 'filial', 'consultorio');
create type membership_status as enum ('convidado', 'ativo', 'suspenso', 'removido');
create type invite_status as enum ('pendente', 'aceito', 'expirado', 'cancelado');

-- Pessoas --------------------------------------------------------------------
create type patient_status as enum ('ativo', 'inativo', 'arquivado');
create type sex_type as enum ('feminino', 'masculino', 'intersexo', 'nao_informado');
create type consent_type as enum ('tratamento_dados', 'compartilhamento', 'telemedicina', 'marketing');

-- Agenda / atendimento -------------------------------------------------------
create type appointment_type as enum ('consulta', 'retorno', 'procedimento', 'teleconsulta', 'avaliacao');
create type appointment_status as enum (
  'agendada', 'confirmada', 'aguardando', 'em_atendimento',
  'realizada', 'cancelada', 'faltou'
);
create type payment_method as enum (
  'particular', 'pix', 'dinheiro', 'cartao_credito', 'cartao_debito',
  'boleto', 'convenio', 'transferencia', 'outro'
);

-- Documentação clínica -------------------------------------------------------
create type medical_record_status as enum ('rascunho', 'assinado', 'retificado', 'cancelado');
create type clinical_note_type as enum ('anamnese', 'evolucao', 'procedimento', 'adendo');
create type clinical_note_status as enum ('rascunho', 'assinado', 'retificado', 'cancelado');
create type allergy_severity as enum ('leve', 'moderada', 'grave');
create type prescription_type as enum ('simples', 'controle_especial', 'antimicrobiano', 'notificacao_a');
create type prescription_status as enum ('rascunho', 'emitida', 'cancelada');
create type signature_method as enum ('interno_hash', 'icp_brasil', 'certificado_digital');

-- Exames ---------------------------------------------------------------------
create type exam_priority as enum ('rotina', 'urgente', 'emergencia');
create type exam_order_status as enum ('solicitado', 'coletado', 'em_analise', 'resultado_disponivel', 'entregue', 'cancelado');
create type exam_item_status as enum ('solicitado', 'coletado', 'em_analise', 'resultado_disponivel', 'cancelado');
create type exam_result_status as enum ('preliminar', 'liberado', 'retificado', 'cancelado');

-- Convênios ------------------------------------------------------------------
create type claim_status as enum ('rascunho', 'enviada', 'em_analise', 'aprovada', 'glosada', 'paga', 'cancelada');

-- Financeiro / estoque -------------------------------------------------------
create type transaction_type as enum ('receita', 'despesa');
create type transaction_status as enum ('pendente', 'pago', 'atrasado', 'cancelado');
create type inventory_status as enum ('ativo', 'inativo');
create type inventory_movement_type as enum ('entrada', 'saida', 'ajuste', 'perda');

-- Assinaturas / plataforma ---------------------------------------------------
create type subscription_status as enum ('em_teste', 'ativa', 'inadimplente', 'suspensa', 'vencida', 'cancelada');
create type billing_period as enum ('mensal', 'anual');
create type gateway_type as enum ('manual', 'stripe', 'asaas', 'pagseguro', 'mercadopago');
create type invoice_status as enum ('aberta', 'paga', 'vencida', 'cancelada', 'reembolsada');
create type module_category as enum ('operacao', 'clinico', 'gestao', 'cadastros', 'relacionamento', 'sistema', 'plataforma');
create type module_audience as enum ('clinica', 'plataforma');
create type module_source as enum ('plano', 'adicional', 'cortesia');

-- Comunicação / IA / auditoria ----------------------------------------------
create type notification_type as enum ('consulta', 'financeiro', 'exame', 'sistema', 'whatsapp');
create type whatsapp_direction as enum ('enviada', 'recebida');
create type whatsapp_status as enum ('pendente', 'enviada', 'entregue', 'lida', 'erro');
create type ai_feature as enum ('resumo', 'apoio_documentacao', 'busca', 'organizacao', 'outro');
create type ai_status as enum ('pendente', 'concluida', 'erro', 'bloqueada');
create type audit_action as enum ('insert', 'update', 'delete', 'login', 'logout', 'view', 'export', 'sign', 'payment');
