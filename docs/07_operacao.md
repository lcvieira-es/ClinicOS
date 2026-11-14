# ClinicOS · Runbook de operação (Etapa 7)

## Backup
- PostgreSQL de produção: `pg_dump -Fc -f clinicos.dump $DATABASE_URL`.
- PGlite local (dev): copiar o diretório `.data/clinicos` ou usar `node tools/db-setup.mjs --reset` para recriar.
- Frequência recomendada: diário, com retenção de 30 dias.

## Restauração
1. Parar a aplicação.
2. `pg_restore -d $DATABASE_URL clinicos.dump` (ou substituir `.data/clinicos`).
3. Validar com `npm run db:check` e `npm run rls:check`.
4. Reiniciar a aplicação e checar `/api/health`.

## Deploy
- Homologação: `npm run build` + `npm run start` (ou container).
- Produção: aplicar migrations (`db/migrations/*.sql`) antes de subir a nova versão.
- Variáveis obrigatórias: `DATABASE_URL`, `APP_DATABASE_URL`, `JWT_SECRET`,
  `NODE_ENV=production`.

## Observabilidade
- Health check: `GET /api/health` retorna `{ status, database, timestamp }`.
- Logs: stdout estruturado (Next.js). Integrar com coletor (Datadog/Grafana).
- Métricas: tempo de resposta, erros 5xx, uso de cota por clínica.

## Incidentes
1. Identificar e isolar (revogar sessões, suspender clínica se necessário).
2. Registrar em `audit_logs` e notificar DPO.
3. Comunicar à ANPD em até 72h se houver vazamento de dados pessoais.
4. Restaurar a partir do último backup íntegro.
5. Pós-mortem e correção.

## Suporte
- Credenciais de demonstração não devem ser usadas em produção.
- Senhas temporárias do wizard são exibidas uma única vez.
- Convites expiram em 7 dias e não podem ser reutilizados.
