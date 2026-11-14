# ClinicOS · Conformidade LGPD (Etapa 7)

## Princípios aplicados
- **Minimização**: CPF e dados sensíveis só são exibidos a perfis com
  `pacientes:view_sensitive`. A mascaramento ocorre no próprio banco
  (`v_patients_directory` + `app_mask_cpf`), não apenas na UI.
- **Finalidade e necessidade**: cada módulo acessa apenas os dados necessários
  ao seu papel (RBAC por perfil + RLS por clínica).
- **Transparência**: ambiente de demonstração rotulado; termos de uso e
  política de privacidade devem ser aceitos no onboarding da clínica.
- **Consentimento**: `patient_consents` registra tipo, aceite, revogação,
  evidência (JSON) e versão do documento. Consentimento pode ser concedido
  ou revogado a qualquer momento, com trilha de auditoria.
- **Segurança**: isolamento por tenant (RLS), senhas com Argon2id, sessão
  JWT httpOnly (8h), auditoria encadeada por hash em tabelas sensíveis.

## Direitos do titular (art. 18)
- Acesso: exportação de dados do paciente (CSV com BOM, `;`).
- Correção: edição de cadastro com auditoria.
- Eliminação/anonimização: arquivamento (`status = arquivado`) e exclusão
  definitiva apenas quando não há vínculos (consultas, financeiro).
- Portabilidade: exportação CSV/PDF.
- Revogação de consentimento: `revokePatientConsentAction`.

## Retenção
- Prontuários e documentos assinados: retenção mínima de 20 anos (CFM).
- Dados financeiros: 5 anos (legislação tributária).
- Logs de auditoria: retenção de 5 anos, append-only.
- Dados de demonstração: não são dados reais; marcados como fictícios.

## DPO e incidentes
- Designar um Encarregado (DPO) por clínica no onboarding.
- Incidentes de segurança devem ser registrados e comunicados à ANPD em até
  72 horas, conforme art. 48.
- Checklist de resposta a incidentes em `docs/07_operacao.md`.

## Anonimização
- Pacientes arquivados podem ser anonimizados (substituição de nome/CPF/contato
  por valores genéricos) mantendo os registros clínicos vinculados.
- A anonimização é irreversível e deve ser registrada em `audit_logs`.
