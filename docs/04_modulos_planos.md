# 04 · Módulos, planos e navegação

## 1. Catálogo de módulos

27 módulos, sendo 19 de clínica (12 contratáveis + 7 de sistema/relacionamento) e 8 da plataforma.

| # | Módulo | Categoria | Público | Plano | Observação |
|---|---|---|---|---|---|
| 1 | Painel | Operação | Clínica | Essencial+ | Indicadores do dia |
| 2 | Agenda | Operação | Clínica | Essencial+ | Diária, semanal, lembretes |
| 3 | Consultas | Operação | Clínica | Essencial+ | Check-in e status |
| 4 | Prontuários | Clínico | Clínica | Profissional+ | Assinatura e versionamento |
| 5 | Prescrições | Clínico | Clínica | Profissional+ | Código de verificação |
| 6 | Exames | Clínico | Clínica | Profissional+ | Solicitação e resultados |
| 7 | Financeiro | Gestão | Clínica | Profissional+ | Contas e fluxo |
| 8 | Convênios | Gestão | Clínica | Profissional+ | Guias e glosas |
| 9 | Estoque | Gestão | Clínica | Empresarial | Mínimo e validade |
| 10 | Pacientes | Cadastros | Clínica | Essencial+ | LGPD |
| 11 | Médicos e profissionais | Cadastros | Clínica | Profissional+ | CRM e valores |
| 12 | Unidades | Cadastros | Clínica | Empresarial | Matriz/filiais |
| 13 | Assistente de IA | Relacionamento | Clínica | Adicional | Sem diagnóstico |
| 14 | WhatsApp | Relacionamento | Clínica | Adicional | Manual ou Cloud API |
| 15 | Portal do paciente | Relacionamento | Clínica | Adicional | Acesso próprio |
| 16 | Usuários e permissões | Sistema | Clínica | Sempre | Núcleo |
| 17 | Assinatura | Sistema | Clínica | Sempre | Plano e faturas |
| 18 | Configurações | Sistema | Clínica | Sempre | Dados e integrações |
| 19 | Relatórios | Sistema | Clínica | Sempre | Operacionais/financeiros |
| 20 | Dashboard da plataforma | Plataforma | Plataforma | — | MRR, clínicas |
| 21 | Clínicas | Plataforma | Plataforma | — | Cadastro e módulos |
| 22 | Planos de assinatura | Plataforma | Plataforma | — | Preços e limites |
| 23 | Módulos e funcionalidades | Plataforma | Plataforma | — | Catálogo |
| 24 | Assinaturas | Plataforma | Plataforma | — | Contratos |
| 25 | Pagamentos | Plataforma | Plataforma | — | Faturas |
| 26 | Relatórios | Plataforma | Plataforma | — | Receita e adoção |
| 27 | Configurações da plataforma | Plataforma | Plataforma | — | Padrões |

## 2. Planos comerciais

| Plano | Mensal | Anual | Usuários | Profissionais | Unidades | Pacientes | Storage | IA/mês | WhatsApp/mês | Módulos |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Essencial | R$ 189,00 | R$ 1.890,00 | 3 | 2 | 1 | 500 | 5 GB | 100 | 200 | 4 |
| Profissional | R$ 349,00 | R$ 3.490,00 | 10 | 5 | 2 | 2.000 | 20 GB | 500 | 1.000 | 10 |
| Empresarial | R$ 690,00 | R$ 6.900,00 | 30 | 15 | 5 | 10.000 | 100 GB | 2.000 | 5.000 | 12 |

### Composição

- **Essencial:** Painel, Agenda, Consultas, Pacientes.
- **Profissional:** Essencial + Prontuários, Prescrições, Exames, Financeiro, Convênios, Médicos e profissionais.
- **Empresarial:** Profissional + Estoque, Unidades.
- **Adicionais:** IA, WhatsApp e Portal do paciente podem ser contratados em qualquer plano, respeitando limites.
- **Sistema:** Usuários, Assinatura, Configurações e Relatórios acompanham todos os planos.

## 3. Entitlements (módulos liberados)

O ambiente da clínica só exibe e executa o que estiver efetivamente liberado.

```text
efetivos =
  módulos do plano contratado
  ∪ módulos adicionais ativos (clinic_modules.enabled = true e não expirados)
  − módulos desativados pela plataforma
```

Regras:

1. `clinic_modules.source` indica `plano`, `adicional` ou `cortesia`.
2. Funcionalidades podem ser desligadas em `clinic_features` sem remover o módulo.
3. O backend valida o módulo antes de cada operação; esconder o menu não é proteção.
4. Mudança de plano recalcula entitlements e registra evento de auditoria.
5. Cancelamento mantém dados por prazo de retenção; o acesso operacional é suspenso.
6. Limites são verificados no servidor; ao atingir o teto, a UI oferece upgrade.

## 4. Interface da plataforma (`/admin`)

### Layout

- Sidebar navy com agrupamento **ADMINISTRAÇÃO DA PLATAFORMA**.
- Itens: Dashboard, Clínicas, Planos de assinatura, Módulos e funcionalidades, Assinaturas, Pagamentos, Relatórios, Configurações.
- Cabeçalho com identificação “Administração da plataforma”, usuário e perfil “Superadministrador”.
- Rodapé: “ClinicOS · administração de clínicas, planos e assinaturas” e “Ações do superadministrador registradas em auditoria”.

### Telas

| Tela | Conteúdo |
|---|---|
| Dashboard | Clínicas cadastradas/ativas/suspensas, assinaturas vigentes, vencidas, MRR, ARR, ticket médio, planos ativos, inadimplentes, próximas renovações |
| Clínicas | Busca, filtros por status, tabela com CNPJ, plano, assinatura, vencimento, módulos, link da conta, valor e ação “Abrir” |
| Nova clínica | Wizard de 5 passos: dados da clínica, administrador, assinatura, limites, módulos contratados; resumo do contrato à direita |
| Planos | Cards com preço, limites, módulos, clínicas ativas e “Editar plano”; modal de criação/edição |
| Módulos e funcionalidades | Catálogo por categoria, quantidade de clínicas, funcionalidades expansíveis, ativar/desativar |
| Assinaturas | Busca, filtros por status, tabela de clínica, plano, status, renovação, gateway, valor e “Registrar pagamento” |
| Pagamentos | Faturas vigentes, em aberto, contratos monitorados, filtros e registro de pagamento |
| Relatórios | Receita por plano, assinaturas por status, adoção de módulos e próximas renovações |
| Configurações | Nome da plataforma, e-mail de suporte, dias de teste, gateway padrão, periodicidade e observações |

### Regras

- O superadministrador não abre prontuário, receita ou financeiro da clínica.
- “Abrir” troca para o ambiente da clínica somente se o usuário também tiver membership; caso contrário, gera convite/impersonação auditada.
- Cadastro de clínica cria, em transação única: clínica, unidade matriz, admin, assinatura e entitlements.
- Exclusão é lógica; dados clínicos seguem retenção.

## 5. Interface da clínica (`/app`)

### Agrupamentos do menu

| Grupo | Itens |
|---|---|
| Operação | Painel, Agenda, Consultas |
| Clínico | Prontuários, Prescrições, Exames |
| Gestão | Financeiro, Convênios, Estoque |
| Cadastros | Pacientes, Médicos e profissionais, Unidades |
| Sistema | Usuários e permissões, Assinatura, Configurações |

Itens adicionais aparecem quando contratados: Assistente de IA, WhatsApp, Portal do paciente e Relatórios.

### Telas e comportamentos

| Tela | Elementos principais |
|---|---|
| Painel | Consultas hoje, aguardando, realizadas, cancelamentos, taxa de faltas, receitas, despesas, lucro, contas a receber, exames pendentes, agenda dos médicos e situação do dia |
| Agenda | Navegação por data, filtro por profissional, lista de consultas, check-in, status, “Lançar lembretes” e “Nova consulta” |
| Consultas | Filtros por período, situação e profissional; tabela com paciente, profissional, horário, valor e status |
| Prontuários | Filtros por período, situação e profissional; estado vazio; “Novo atendimento” |
| Prescrições | Filtros por período e situação; estado vazio; “Nova prescrição” com itens, dose, frequência, via e quantidade |
| Exames | Filtros por período, situação e prioridade; solicitação com múltiplos exames |
| Financeiro | Cards de receitas, despesas, saldo e a receber; filtros por período, tipo, situação e categoria; lançamentos |
| Convênios | Totais apresentado/aprovado, guias em andamento, operadoras, filtros e nova guia |
| Estoque | Itens cadastrados, valor do estoque, abaixo do mínimo, vencendo em 60 dias; busca, categoria e situação |
| Pacientes | Busca por nome/CPF/telefone, filtro de status, tabela com contato, nascimento, convênio e status |
| Médicos | Cards com avatar, CRM, especialidade, contato e valor/duração; edição |
| Unidades | Cards ou tabela com tipo, endereço, telefone, responsável e status |
| Usuários | Equipe, perfil, unidades, situação e convite |
| Assinatura | Plano atual, módulos liberados, limites, faturas e upgrade |
| Configurações | Identificação, contato, endereço, preferências, fuso, observações e lembrete por WhatsApp |
| Portal | Visão do paciente com consultas, resultados, receitas e documentos |

### Padrões de interação

- Toda listagem tem busca, filtros, contagem e paginação.
- Formulários longos usam modal com seções e rodapé fixo.
- Ações destrutivas pedem confirmação e motivo.
- Estados vazios explicam o próximo passo e oferecem a ação primária.
- Feedback de sucesso/erro via toast; erros de validação junto ao campo.
- Datas em `DD/MM/AAAA`; moeda em `R$ 0,00`; telefone com máscara brasileira.
- Acessibilidade: foco visível, navegação por teclado, contraste e `aria-label`.

## 6. Fidelidade visual

- Azul institucional `#093D69` na sidebar e botões primários.
- Menta `#0FFCBE` no item ativo do menu e detalhes.
- Fundo claro `#F4F8FC`; cards brancos; bordas `#E2E8F0`.
- Títulos com barra vertical menta à esquerda.
- Cabeçalho de tabela em caixa alta, cinza-azulado, 11–12 px.
- Status em pílulas: verde (ativo/pago), azul (em teste), âmbar (pendente/implantação), vermelho (atrasado/glosa).
- Cards de indicadores com ícone circular suave e legenda.
- Modais com cantos arredondados, overlay escuro e largura confortável.
- Rodapé fixo com assinatura e aviso LGPD.

## 7. Limites e cobrança

- Limite de usuários conta memberships ativas (não convites pendentes).
- Limite de profissionais conta profissionais ativos.
- Limite de unidades conta unidades ativas.
- Limite de pacientes conta pacientes não arquivados.
- Armazenamento soma documentos e anexos.
- IA e WhatsApp contam por mês civil, com reset no primeiro dia.
- Ao exceder: bloquear criação e oferecer upgrade; nunca apagar dados.
- Renovação, inadimplência e suspensão são jobs diários auditados.

## 8. Critérios de aceite desta etapa

- [x] 27 módulos catalogados com categoria, público e funcionalidades.
- [x] 3 planos com preços e limites compatíveis com as telas de referência.
- [x] Composição 4/10/12 módulos validada no banco.
- [x] Entitlements modelados por plano + adicionais + features.
- [x] Navegação da clínica e da plataforma mapeada.
- [x] Tokens visuais definidos.
