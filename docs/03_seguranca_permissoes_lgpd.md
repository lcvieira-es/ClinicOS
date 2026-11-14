# 03 · Segurança, permissões e LGPD

## 1. Modelo de ameaça

| Ameaça | Controle |
|---|---|
| Acesso a dados de outra clínica | `clinic_id` da sessão, repositórios tenant-aware, RLS, FKs compostas, testes de isolamento |
| Escalada de privilégio | RBAC no servidor, `app_has_permission`, RLS por papel, revisão de memberships |
| Vazamento por interface | Projeções por papel, mascaramento de CPF, respostas 404 para recursos de outro tenant |
| Alteração indevida de prontuário | Assinatura, hash, versionamento, trilha de auditoria, imutabilidade após assinatura |
| Vazamento de segredos | Vault do provedor, backend-only, rotação periódica, varredura de dependências |
| Webhook falso | Assinatura HMAC, `gateway_events` idempotente, validação de payload |
| Abuso de IA | Guardrails, minimização de PII, limite por plano, revisão humana, auditoria |
| Exportação massiva | Permissão específica, rate limit, marca d’água, auditoria e alerta |
| Sessão roubada | Cookie httpOnly/Secure, rotação, revogação, MFA para admin |

## 2. Papéis

| Papel | Escopo | Resumo |
|---|---|---|
| `platform_admin` | Plataforma | Gerencia clínicas, planos, módulos, assinaturas, pagamentos e configurações. Não acessa dados clínicos. |
| `clinic_admin` | Clínica | Administra a clínica, equipe, unidades, configurações e todos os módulos contratados. |
| `doctor` | Clínica | Agenda, atendimentos, prontuário, prescrições e exames dos próprios atendimentos. |
| `receptionist` | Clínica | Agenda, pacientes, check-in, convênios (leitura) e mensagens. Sem prontuário/financeiro. |
| `finance` | Clínica | Financeiro, convênios, estoque e relatórios. Sem dados clínicos sensíveis. |
| `patient` | Portal | Somente os próprios dados, consultas, resultados e documentos liberados. |

## 3. Matriz de permissões por módulo

Legenda: **A** = administra; **E** = edita/opera; **R** = somente leitura; **P** = próprios registros; **—** = sem acesso.

| Módulo | Plataforma | Admin clínica | Médico | Recepção | Financeiro | Paciente |
|---|---|---|---|---|---|---|
| Painel | — | A | R | R | R | — |
| Agenda | — | A | E | A | R | P |
| Consultas | — | A | E | E | R | P |
| Prontuários | — | A | E (próprios) | — | — | — |
| Prescrições | — | A | E (próprias) | R | R | P |
| Exames | — | A | E | E | R | P |
| Financeiro | — | A | — | — | A | — |
| Convênios | — | A | R | R | A | — |
| Estoque | — | A | R | R | A | — |
| Pacientes | — | A | R | E | R | P |
| Médicos | — | A | R | R | R | — |
| Unidades | — | A | R | R | R | — |
| IA | — | A | E | — | — | — |
| WhatsApp | — | A | E | E | R | — |
| Portal | — | A | — | — | — | P |
| Usuários | — | A | — | — | — | — |
| Assinatura | — | R | — | — | R | — |
| Configurações | — | A | R | R | R | P (perfil) |
| Relatórios | — | A | R | R | A | — |
| Administração da plataforma | A | — | — | — | — | — |

> A matriz é aplicada por `permissions` + `role_permissions` e replicada nas policies. A interface apenas reflete o resultado.

## 4. RLS: como funciona

### 4.1 Contexto

```sql
select set_config('app.user_id', '<uuid>', true);
select set_config('app.clinic_id', '<uuid>', true);
```

### 4.2 Funções

| Função | Uso |
|---|---|
| `app_current_user_id()` | Usuário da transação |
| `app_current_clinic_id()` | Clínica ativa |
| `app_is_platform_admin()` | Superadministrador ativo |
| `app_is_member_of_clinic(uuid)` | Membership ativa |
| `app_has_any_role(uuid, text[])` | Papel exigido |
| `app_has_permission(uuid, text)` | Permissão granular |
| `app_professional_id(uuid)` | Profissional vinculado ao usuário |
| `app_owns_patient(uuid)` | Acesso do paciente ao próprio registro |
| `app_shares_clinic_with_user(uuid)` | Administrador vê usuários da própria clínica |

### 4.3 Regras por tabela

- **Genéricas:** `SELECT` por papéis de leitura; `INSERT/UPDATE/DELETE` por papéis de escrita; tudo limitado ao `clinic_id` da sessão.
- **Prontuário/notas:** leitura por `clinic_admin` e `doctor`; escrita apenas pelo profissional responsável (ou admin).
- **Prescrições:** leitura pela equipe; emissão/assinatura apenas pelo profissional responsável.
- **Financeiro:** somente `clinic_admin` e `finance`.
- **Auditoria:** leitura apenas por `clinic_admin`; inserção exclusiva por trigger `SECURITY DEFINER`.
- **Plataforma:** `platform_admin` gerencia catálogo e assinaturas; clínicas não escrevem no catálogo.
- **Portal:** policies específicas por `patient_portal_access`; nenhuma membership é necessária.

### 4.4 Teste automatizado

`npm run rls:check` cria duas clínicas sintéticas e comprova:

1. Admin da clínica A só vê pacientes e clínicas da A.
2. `INSERT` com `clinic_id` da B é rejeitado pela RLS.
3. Médico vê pacientes, mas não lançamentos financeiros.
4. Cadeia de auditoria da clínica A está íntegra.

## 5. Segurança em nível de campo

| Dado | Regra |
|---|---|
| CPF do paciente | Mascarado (`***.***.***-XX`) sem `pacientes:view_sensitive`; view `v_patients_directory` |
| Endereço/telefone | Visível para recepção, médico e admin; financeiro vê apenas o necessário |
| Prontuário | Projeção restrita; conteúdo não sai em listagens |
| Financeiro | Somente admin/financeiro; nunca em endpoints de agenda |
| Documentos assinados | Metadados visíveis; download exige permissão e gera log |
| Credenciais | Nunca retornadas; hash Argon2id |
| IDs internos | UUIDs; nenhum sequencial exposto |

O backend seleciona colunas explicitamente por papel. Não há `select *` em endpoints.

## 6. LGPD

### 6.1 Bases legais e finalidade

- **Tratamento de saúde:** tutela da saúde por profissionais (art. 11, II, “f”) e execução de contrato.
- **Dados cadastrais/financeiros:** execução de contrato e obrigação legal.
- **Marketing:** consentimento específico e revogável.
- **Compartilhamento com convênio:** execução de contrato e obrigação regulatória.

Cada finalidade tem registro de consentimento ou base legal em `patient_consents`.

### 6.2 Direitos do titular

| Direito | Implementação |
|---|---|
| Confirmação e acesso | Portal do paciente + exportação autenticada |
| Correção | Edição com trilha de auditoria |
| Anonimização/bloqueio | Job de anonimização com retenção legal |
| Portabilidade | Exportação JSON/CSV assinada |
| Eliminação | Fluxo com verificação de retenção médica/legal |
| Informação sobre compartilhamento | Relatório de acessos e convênios |
| Revogação de consentimento | `patient_consents.revoked_at` |

### 6.3 Retenção

- Prontuário: mínimo de **20 anos**, conforme normas do CFM, salvo prazo legal maior.
- Documentos fiscais: 5 anos.
- Logs de auditoria: mínimo de 2 anos, configurável.
- Dados de marketing: até revogação.
- Backups: rotação definida; restauração testada.

> Prazos devem ser validados pelo jurídico/DPO da clínica antes da produção.

### 6.4 Segurança

- Criptografia em trânsito (TLS 1.2+) e em repouso (banco e bucket).
- Minimização de PII em logs e prompts de IA.
- Controle de acesso por papel e registro.
- Plano de resposta a incidentes com notificação à ANPD e titulares quando aplicável.
- DPO/encarregado com canal publicado.
- Treinamento periódico da equipe.

## 7. Documentos médicos e autenticidade

- Hash SHA-256 do conteúdo no momento da assinatura.
- `verification_code` único e consultável publicamente (sem exibir dados clínicos).
- Registro de `signed_at`, `signed_by`, `signature_method`.
- Versões imutáveis: retificação gera novo registro (`version`, `parent_id`), preservando o anterior.
- Assinatura digital ICP-Brasil pode ser integrada; o modelo já acomoda `icp_brasil` e `certificado_digital`.
- PDF gerado no backend, com QR Code de verificação e marca d’água.
- Download e impressão auditados.
- Prescrição de controle especial segue regras específicas da Anvisa/CFM.

## 8. Guardrails de IA

**A IA não pode:**

- emitir diagnóstico;
- prescrever medicamentos;
- finalizar, assinar ou alterar prontuário autonomamente;
- tomar decisão clínica sem revisão humana;
- receber PII desnecessária.

**A IA pode:**

- resumir texto já registrado;
- sugerir redação e organização;
- localizar informações;
- apontar pendências documentais;
- responder perguntas administrativas.

Controles:

- chamada somente no backend;
- prompt com instrução explícita de não diagnosticar/prescrever;
- filtro de entrada e saída;
- `safety_flags` e status `bloqueada` quando necessário;
- revisão humana obrigatória;
- limite por plano;
- `ai_interactions` auditável, com retenção configurável.

## 9. WhatsApp e comunicações

- Opt-in e opt-out registrados.
- Templates aprovados pela Meta para mensagens fora da janela.
- Nenhum dado clínico sensível no corpo da mensagem.
- Status de envio/entrega/leitura persistido.
- Falha de integração não bloqueia a operação: modo manual com histórico.
- Número e token ficam no backend, nunca no frontend.

## 10. Pagamentos

- Dados de cartão nunca passam pelo servidor ClinicOS; o gateway tokeniza.
- Webhooks com validação de assinatura e idempotência (`gateway_events`).
- Segredos e chaves somente em variáveis de ambiente do backend.
- Conciliação e baixa manual auditadas.
- Bloqueio de acesso operacional por inadimplência é regra de negócio, aplicada no servidor, com aviso prévio.

## 11. Checklist antes de produção

- [ ] Revisão jurídica de contratos, termos e política de privacidade.
- [ ] DPO nomeado e canal publicado.
- [ ] Teste de restauração de backup.
- [ ] Pentest de autorização horizontal e vertical.
- [ ] MFA obrigatório para plataforma.
- [ ] Rate limiting e WAF.
- [ ] Varredura de dependências e segredos.
- [ ] Plano de incidentes e contatos ANPD.
- [ ] Retenção e anonimização validada.
- [ ] Logs sem PII.
- [ ] Auditoria de acessos e exportações.
