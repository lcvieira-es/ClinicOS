# ClinicOS · Checklist de produção (Etapa 7)

## Segurança
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` forte e rotacionado
- [ ] HTTPS obrigatório (HSTS)
- [ ] Rate limiting em `/login` e `/convite`
- [ ] CORS restrito ao domínio da aplicação
- [ ] Revisão de permissões por perfil (matriz RBAC)
- [ ] Teste de isolamento entre tenants (rls:check)

## Banco de dados
- [ ] Migrations aplicadas em ordem
- [ ] Backup automatizado configurado
- [ ] Restauração testada
- [ ] Papel `clinicos_app` sem BYPASSRLS
- [ ] `DB_SET_ROLE` habilitado

## LGPD
- [ ] Termos de uso e política de privacidade publicados
- [ ] DPO designado
- [ ] Fluxo de consentimento LGPD ativo
- [ ] Processo de anonimização documentado
- [ ] Política de retenção aplicada

## Observabilidade
- [ ] Health check monitorado
- [ ] Alertas de erro 5xx configurados
- [ ] Dashboards de uso e cota
- [ ] Logs centralizados

## Funcional
- [ ] Jornadas críticas testadas (agendamento, check-in, assinatura, convite)
- [ ] Verificação pública de documento funcionando
- [ ] Portal do paciente acessível
- [ ] E-mails/transacionais configurados (se aplicável)

## Final
- [ ] README atualizado
- [ ] Documentação de operação revisada
- [ ] Aprovação final do usuário
