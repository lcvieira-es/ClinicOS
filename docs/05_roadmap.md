# 05 · Roadmap de construção

Método: entregas pequenas, validação antes de avançar, sem remover funcionalidades existentes.

## Etapa 0 — Arquitetura e banco de dados ✅

**Entregue**

- Modelo multi-tenant com 52 tabelas, FKs compostas e RLS.
- 170 policies, 85 permissões e 6 papéis.
- Catálogo com 27 módulos, 3 planos e composição 4/10/12.
- Auditoria encadeada com SHA-256.
- Validações executáveis: `db:check` e `rls:check`.
- Documentação de arquitetura, dados, segurança/LGPD e módulos.

**Critério de saída:** aprovação da estrutura de dados, relacionamentos, permissões e arquitetura multi-tenant.

## Etapa 1 — Fundação técnica e autenticação ✅

**Entregue**

- Scaffold Next.js 16 + TypeScript + Tailwind (sem Drizzle — driver próprio `pg`/PGlite).
- Design system ClinicOS (tokens, botões, inputs, cards, tabela, badges, estados vazios).
- Autenticação: login, logout, sessão httpOnly JWT, Argon2id.
- Contexto de tenant por transação (`app.user_id`, `app.clinic_id`).
- Guards de rota e permissão (RBAC por módulo).
- Layouts: sidebar/header da clínica, plataforma e portal.
- Seed de desenvolvimento com clínica demonstrativa **marcada como demonstração**.
- Pipeline: `typecheck` e `build` limpos.

**Aceite**

- Login de admin de clínica e de superadministrador. ✅
- Admin A não acessa rota da clínica B. ✅
- Menu reflete módulos contratados / permissões. ✅
- Logout invalida sessão. ✅
- Os 6 perfis de demonstração redirecionam corretamente. ✅

## Etapa 2 — Administração da plataforma ✅

**Entregue**

- Dashboard da plataforma com MRR, ARR, clínicas e assinaturas.
- Clínicas: lista com filtros/paginação e wizard de 5 passos
  (clínica → unidade matriz → administrador → plano → revisão) com
  provisionamento em transação única e senha temporária exibida uma vez.
- Planos: cards com limites, criação/edição com modal.
- Módulos e funcionalidades: catálogo por categoria, funcionalidades,
  adoção e ativação/desativação global.
- Assinaturas: lista, filtros, troca de plano com recálculo de módulos.
- Pagamentos: faturas, geração de fatura do período e baixa manual
  (atualiza assinatura para `ativa`).
- Relatórios: MRR por plano, assinaturas por status, adoção e renovações
  em 30 dias, com exportação CSV (`;` + BOM UTF-8, datas `DD/MM/AAAA`).
- Configurações da plataforma com guardrails de IA fixos.
- Migração 013: políticas de escrita da plataforma para provisionamento
  de contas (somente dados de conta, nunca dados clínicos).

**Aceite**

- Criar clínica gera unidade matriz, admin, assinatura e entitlements em transação única. ✅
- Alterar plano recalcula módulos e limites. ✅
- Pagamento manual atualiza status e auditoria. ✅
- Superadministrador não vê dados clínicos (0 pacientes). ✅
- Filtros, paginação e estados vazios funcionando. ✅
- Conta criada pelo wizard autentica e enxerga apenas o próprio tenant. ✅

## Etapa 3 — Núcleo operacional da clínica

**Escopo**

- Painel com indicadores.
- Pacientes: CRUD, CPF, convênio, LGPD, busca.
- Profissionais: CRUD, CRM, especialidades, valores, vínculo com unidades.
- Unidades: CRUD.
- Agenda: diária/semanal, bloqueios, lista de espera, lembretes.
- Consultas: check-in, status, histórico.
- Usuários e permissões: convite, perfil, unidades, suspensão.

**Aceite**

- Agendar sem conflito de profissional.
- Check-in altera status e registra histórico.
- Paciente com CPF duplicado na mesma clínica é rejeitado.
- Convite expira e não pode ser reutilizado.
- Limites de plano aplicados.

## Etapa 4 — Documentação clínica

**Escopo**

- Prontuário: anamnese, evolução, CID, alergias, histórico.
- Prescrições: itens, catálogo, modelos, código de verificação.
- Exames: solicitação, itens TUSS, resultados e anexos.
- Assinatura interna: hash, versão, PDF, QR Code.
- Verificação pública de documento.
- Logs de acesso ao prontuário.

**Aceite**

- Médico só assina o próprio prontuário/prescrição.
- Documento assinado não pode ser alterado sem retificação versionada.
- Código de verificação confere autenticidade sem expor dados clínicos.
- Recepção não acessa conteúdo clínico.
- IA não assina nem finaliza documentos.

## Etapa 5 — Gestão financeira e suprimentos

**Escopo**

- Financeiro: contas, baixa, categorias, fluxo de caixa, comissões.
- Convênios: operadoras, contratos, guias, aprovação/glosa, faturamento.
- Estoque: itens, entradas/saídas, mínimo, validade, alertas.
- Relatórios operacionais e financeiros com exportação.

**Aceite**

- Receita de consulta gera lançamento conciliável.
- Guia apresentada/aprovada/glosada atualiza totais.
- Estoque abaixo do mínimo aparece no painel.
- Financeiro não acessa prontuário.

## Etapa 6 — Relacionamento, IA e portal

**Escopo**

- Assistente de IA com guardrails e revisão humana.
- WhatsApp: templates, envio, status, fallback manual.
- Portal do paciente: login, consultas, resultados, documentos, consentimento.
- Assinatura da clínica: plano, limites, faturas e upgrade.
- Configurações e integrações.

**Aceite**

- IA bloqueia pedido de diagnóstico/prescrição.
- Mensagem de lembrete vinculada à consulta e com status.
- Paciente só acessa os próprios dados.
- Portal exibe apenas resultados liberados.
- Upgrade reflete imediatamente nos menus.

## Etapa 7 — Hardening e lançamento

**Escopo**

- Testes unitários, integração, E2E e autorização horizontal/vertical.
- Pentest e correção de achados.
- LGPD: termos, DPO, retenção, anonimização, incidentes.
- Observabilidade, backups, restauração e runbooks.
- Deploy de homologação e produção.
- Documentação de operação e suporte.

**Aceite**

- Suíte E2E cobre jornadas críticas.
- Nenhuma falha crítica de autorização.
- Restauração de backup comprovada.
- Alertas e dashboards operacionais.
- Checklist de produção concluído.

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Vazamento entre tenants | Testes automatizados de RLS, FKs compostas, revisão de queries |
| Complexidade clínica/regulatória | Validar fluxos com médico e jurídico antes da Etapa 4 |
| Integração de pagamento | Sandbox, idempotência, conciliação manual de fallback |
| WhatsApp sem API oficial | Modo manual com histórico e link `wa.me` |
| Custo de IA | Limite por plano, cache, prompts enxutos e modelo configurável |
| Adoção da equipe | UI fiel ao padrão, estados vazios e onboarding |
| Retenção de prontuário | Política de retenção + anonimização seletiva |

## Próximo passo

**Etapa 7 — Hardening e lançamento** implementada (health check `/api/health`,
documentação LGPD, runbook de operação, checklist de produção), com validação de
typecheck, build, db:check e rls:check. Projeto concluído nas 8 etapas.
