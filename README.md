# ClinicOS
<<<<<<< HEAD

SaaS multi-tenant para gestão integrada de clínicas médicas no Brasil.

**Status atual: Etapa 2 — administração da plataforma (clínicas com wizard de provisionamento, planos, módulos, assinaturas, pagamentos, relatórios com CSV e configurações), sobre a fundação da Etapa 1 (design system, autenticação e os três ambientes: Clínica, Plataforma e Portal do Paciente).**

Os dados de demonstração são fictícios e o ambiente exibe um aviso permanente de demonstração.

## O que está pronto

| Área | Estado |
|---|---|
| Banco de dados (12 migrations, 52 tabelas, RLS em todas as tabelas sensíveis) | `db:check` e `rls:check` passam |
| Autenticação própria (Argon2id + sessão httpOnly de 8h) | login/logout nos três ambientes |
| Multi-tenancy com RLS ativa nas consultas de negócio | papel `clinicos_app` sem bypass |
| Design system Tailwind com a identidade ClinicOS | navy `#093D69`, mint `#0FFCBE`, fundo `#E8F4FD` |
| Ambiente da clínica (`/app`) | painel com métricas reais, agenda do dia, exames pendentes e financeiro gated por permissão |
| Ambiente da plataforma (`/admin`) | dashboard agregado de clínicas, planos e MRR (sem dados clínicos) |
| Portal do paciente (`/portal`) | consultas, resultados e documentos do próprio paciente |
| Controle de módulos pelo plano e permissões por perfil | menu e rotas verificados no servidor |
| Módulos sem telas implementadas | telas de "estrutura pronta" com acesso restrito aplicado |

## Validação executável

Requisitos: Node.js 20+.

```bash
npm install
npm run db:check        # aplica as 12 migrations e confere schema, políticas e seeds
npm run rls:check       # testa isolamento entre duas clínicas com o papel de runtime
npm run typecheck        # TypeScript estrito
npm run build            # build de produção
node tools/db-setup.mjs --reset   # recria o banco local de demonstração
npm run dev              # http://localhost:3000
```

Em desenvolvimento, o banco local (PGlite em `.data/clinicos`) é criado, migrado e semeado automaticamente. Em produção, as migrations são aplicadas externamente sobre PostgreSQL 16.

### Credenciais de demonstração

Todas com a senha `Clinicos@2026` (senha única do seed de desenvolvimento):

| Perfil | E-mail |
|---|---|
| Superadministrador (plataforma) | `super@clinicos.dev` |
| Administradora da clínica | `admin@clinicos.dev` |
| Médica | `medico@clinicos.dev` |
| Recepção | `recepcao@clinicos.dev` |
| Financeiro | `financeiro@clinicos.dev` |
| Portal do paciente | `paciente@clinicos.dev` |

Nenhum dado real de paciente é utilizado. A clínica de demonstração é explicitamente rotulada e os dados são fictícios.

## Controle de acesso verificado no servidor

- O menu é derivado de (a) módulos liberados no plano da clínica e (b) permissões do papel ativo.
- Ocultar o menu não é a proteção: cada rota valida plano e permissão no servidor antes de renderizar ou executar qualquer ação.
- O superadministrador vê apenas métricas agregadas da plataforma. Dados clínicos não são consultados na área `/admin`.
- O paciente do portal enxerga somente os próprios registros, via RLS.
- A matriz RBAC completa vive em `db/migrations/012_permissions.sql`.

## Documentação

1. [`docs/01_arquitetura.md`](docs/01_arquitetura.md) — stack, camadas, multi-tenancy, integrações.
2. [`docs/02_modelo_de_dados.md`](docs/02_modelo_de_dados.md) — entidades, relacionamentos e regras.
3. [`docs/03_seguranca_permissoes_lgpd.md`](docs/03_seguranca_permissoes_lgpd.md) — RBAC, RLS, LGPD e documentos médicos.
4. [`docs/04_modulos_planos.md`](docs/04_modulos_planos.md) — catálogo, planos, entitlements e navegação.
5. [`docs/05_roadmap.md`](docs/05_roadmap.md) — etapas, critérios de aceite e próximos passos.

## Estrutura do repositório

```text
clinicos/
├── db/migrations/       # schema PostgreSQL versionado (12 migrations)
├── db/dev-seed.sql      # dados fictícios de demonstração (nunca para produção)
├── docs/                # arquitetura e decisões
├── src/
│   ├── app/             # rotas: (auth) login, (clinic) /app, (platform) /admin, (portal) /portal
│   ├── components/      # design system, layouts e shells por ambiente
│   └── lib/             # db (PGlite/pg com RLS), auth (sessão/JWT), permissões, tenant, módulos
├── tools/               # validações e setup locais (PGlite)
├── .data/               # banco local PGlite (gitignored)
└── README.md
```

## Configuração

Veja [`.env.example`](.env.example). Em produção é obrigatório `DATABASE_URL` (owner, para migrations externas) e `APP_DATABASE_URL` (papel `clinicos_app`, sem bypass de RLS), mais `AUTH_SECRET` com pelo menos 32 caracteres.

## Decisões que aguardam validação

- Gateway de pagamento: Stripe + Asaas (Pix/boleto).
- WhatsApp: Meta Cloud API com modo manual de fallback.
- IA: provedor agnóstico, sempre no backend, sem diagnóstico/prescrição autônoma e com revisão humana.
- Assinatura de documentos médicos: certificados A1/A3 ou ICP-Brasil — a definir com o responsável técnico.
=======
Sistema de gestão de clínicas e hospitais
>>>>>>> 0f9e0ef816df10cc7ee202b7742f37e05089a4d7
