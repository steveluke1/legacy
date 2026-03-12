# Etapa 3 - Arquitetura-Alvo

## Objetivo

Fechar a estrutura final do repositorio antes de qualquer porte de codigo, definindo onde cada tipo de arquivo deve viver, como client e server se separam e quem e dono de cada camada.

## Gate de Saida

Nenhuma nova implementacao pode nascer dentro da estrutura Vite legada.

Isto significa:
- nenhum novo arquivo funcional em `src/`
- nenhuma nova rota em `src/pages`
- nenhum novo componente em `src/components`
- nenhum novo client de dados em `src/api`
- nenhuma nova regra de negocio em `functions`

O legado permanece apenas como fonte temporaria de consulta ate a migracao terminar.

## Estrutura Final do Repositorio

```text
app/
  (public)/
  (auth)/
  (account)/
  (admin)/
  api/
  globals.css
  layout.tsx
  not-found.tsx
  page.tsx

components/
  ui/
  public/
  auth/
  account/
  rankings/
  guilds/
  character/
  shop/
  marketplace/
  notifications/
  admin/
  shared/

lib/
  schemas/
  types/
  constants/
  utils/
  formatters/
  guards/

server/
  auth/
  session/
  services/
  repositories/
  adapters/
  queries/
  mutations/

data/
  json/
  seeds/
  fixtures/

tests/
  unit/
  integration/
  e2e/
  fixtures/
```

## Mapa Final de Pastas

### `app/`

Responsabilidade:
- roteamento e composicao da aplicacao Next.js App Router
- layouts, pages, loading, error e metadata
- fronteira entre UI e a camada server-owned

Conteudo permitido:
- `layout.tsx`
- `page.tsx`
- `loading.tsx`
- `error.tsx`
- `not-found.tsx`
- `template.tsx` somente se necessario
- route groups como `(public)`, `(auth)`, `(account)`, `(admin)`
- `api/` para Route Handlers HTTP

Conteudo proibido:
- acesso direto a arquivo JSON em disco
- regra de negocio espalhada dentro de page components
- logica de persistencia
- adaptadores de integracao

### `app/api/`

Responsabilidade:
- endpoints HTTP locais do produto final

Conteudo permitido:
- `route.ts`
- validacao de entrada
- chamada para `server/services/*`
- serializacao da resposta

Conteudo proibido:
- regra de negocio de dominio extensa
- acesso direto a `data/`
- acesso direto a cookies fora da politica de auth/session

### `components/`

Responsabilidade:
- UI reutilizavel do produto final

Subpastas:
- `ui/`: componentes base de `shadcn/ui`
- `public/`: home e blocos publicos
- `auth/`: formularios e shells de autenticacao
- `account/`: UI da area do usuario
- `rankings/`: cards, tabelas e filtros de ranking
- `guilds/`: UI de guildas
- `character/`: UI de personagem
- `shop/`: catalogo e compra da loja
- `marketplace/`: listings, pedidos, compra e venda
- `notifications/`: dropdown, lista e badges
- `admin/`: tabelas, paineis e formularios administrativos
- `shared/`: componentes de interface compartilhados entre dominios

Conteudo proibido:
- fetch direto a arquivo de dados
- escrita de persistencia
- logica de autorizacao server-side

### `lib/`

Responsabilidade:
- codigo compartilhado, puro e estavel

Subpastas:
- `schemas/`: Zod schemas e validadores
- `types/`: tipos TS de dominio e contratos
- `constants/`: enums, limites e chaves publicas
- `utils/`: utilitarios puros sem IO
- `formatters/`: formatacao de moeda, data, texto e estado
- `guards/`: helpers de validacao e narrowing sem efeito colateral

Conteudo proibido:
- leitura e escrita de dados locais
- dependencia em APIs do Next que prendam o modulo ao runtime
- logica de negocio orientada a dominio que deveria estar em `server/services`

### `server/`

Responsabilidade:
- camada server-owned do produto final

Subpastas:
- `auth/`: login, logout, hash de senha, autorizacao
- `session/`: cookies, emissao e validacao de sessao
- `services/`: regras de negocio por dominio
- `repositories/`: acesso a persistencia local
- `adapters/`: simulacoes locais deterministicas de pagamentos, Bridge, EFI e webhooks
- `queries/`: leituras compostas orientadas a tela ou fluxo
- `mutations/`: comandos server-owned quando a separacao deixar o fluxo mais claro

Conteudo proibido:
- componentes React
- estado de UI
- dependencia no legado `src/` ou `functions`

### `data/`

Responsabilidade:
- fonte local versionada dos dados e seeds do app

Subpastas:
- `json/`: armazenamento local em JSON por dominio
- `seeds/`: seed inicial e resets controlados
- `fixtures/`: dados de teste e demonstracao deterministica

Conteudo proibido:
- logica de negocio
- scripts ad hoc fora do padrao de seed
- duplicacao desnecessaria da mesma entidade em arquivos diferentes

### `tests/`

Responsabilidade:
- validacao automatizada do produto final

Subpastas:
- `unit/`: schemas, utils, repositories, services, auth
- `integration/`: contratos locais e integracao entre camadas
- `e2e/`: Playwright nos fluxos criticos
- `fixtures/`: dados de teste e helpers de cenario

Conteudo proibido:
- testes do legado Vite
- fixtures que dependam de servico remoto

## Convencoes de Onde Cada Tipo de Arquivo Deve Viver

### Rotas e paginas
- rotas publicas em `app/(public)/...`
- rotas de autenticacao em `app/(auth)/...`
- rotas autenticadas do usuario em `app/(account)/...`
- rotas administrativas em `app/(admin)/...`
- home publica principal em `app/page.tsx` ou `app/(public)/page.tsx`

### Endpoints HTTP
- todo endpoint local em `app/api/<dominio>/<acao>/route.ts`
- nomes orientados a dominio e acao, nao a tecnologia legada

### Componentes
- componente reutilizavel de base em `components/ui/*`
- componente de dominio em `components/<dominio>/*`
- componente compartilhado entre varios dominios em `components/shared/*`

### Tipos e validacao
- schema Zod em `lib/schemas/<dominio>.ts`
- tipos de dominio e DTOs em `lib/types/<dominio>.ts`
- constantes em `lib/constants/<dominio>.ts`

### Regras de negocio
- orchestration e regras em `server/services/<dominio>Service.ts`
- leitura e escrita local em `server/repositories/<dominio>Repository.ts`
- auth em `server/auth/*`
- sessao em `server/session/*`
- simulacoes locais em `server/adapters/*`

### Dados locais
- armazenamento primario em `data/json/<dominio>.json`
- seed inicial em `data/seeds/*`
- fixture de teste em `tests/fixtures/*` ou `data/fixtures/*` dependendo do uso

### Testes
- unitario em `tests/unit/<dominio>/*.test.ts`
- integracao em `tests/integration/<dominio>/*.test.ts`
- e2e em `tests/e2e/<fluxo>.spec.ts`

## Politica de Separacao Client/Server

### Regra central

Tudo que envolve autenticacao, sessao, persistencia, autorizacao, escrita, conciliacao de saldo, criacao de pedido, compra, venda, disputa, liquidacao e simulacao de pagamento e server-owned.

O client:
- renderiza UI
- coleta input
- mostra estado
- dispara acoes para a camada server

O server:
- valida entrada
- aplica regra de negocio
- toca na persistencia
- toca em sessao e auth
- decide autorizacao
- produz resposta final

### Regras objetivas

- componente com `use client` nao acessa `data/`
- componente com `use client` nao importa `server/*`
- page e layout server-first por padrao
- `use client` so entra quando houver interacao real de UI
- `app/api/*` nunca acessa JSON diretamente; chama repository ou service
- repository nunca renderiza UI e nunca conhece componente
- schema Zod pode ser compartilhado, mas sem carregar IO
- cookie e sessao so em `server/auth` e `server/session`

## Politica de Ownership por Camada

### `app/`
Owner:
- composicao de rota, layout e metadata

Nao possui:
- regra de negocio persistente

### `components/`
Owner:
- interface e experiencia do usuario

Nao possui:
- persistencia
- auth server-side
- integracao local de pagamento

### `lib/`
Owner:
- contratos compartilhados e utilitarios puros

Nao possui:
- IO
- sessao
- mutacao de negocio

### `server/`
Owner:
- dominio, auth, sessao, autorizacao, persistencia e simulacoes locais

Nao possui:
- layout ou componente React

### `data/`
Owner:
- dados locais versionados

Nao possui:
- interpretacao de negocio fora do que for necessario para seeds

### `tests/`
Owner:
- validacao automatizada do comportamento do app final

Nao possui:
- implementacao do produto

## Politica de Naming

### Pastas
- usar nomes curtos, em minusculo e orientados a dominio
- manter ingles tecnico consistente na estrutura nova
- evitar nomes herdados do legado quando nao representam mais o dominio final

Exemplos:
- `marketplace`
- `notifications`
- `rankings`
- `guilds`
- `character`
- `account`

### Arquivos
- componentes React: `PascalCase.tsx`
- hooks locais de UI: `useX.ts`
- schemas: `<domain>.ts`
- tipos: `<domain>.ts`
- services: `<domain>Service.ts`
- repositories: `<domain>Repository.ts`
- adapters: `<provider>Adapter.ts` ou `<flow>Simulator.ts`
- testes unitarios: `<subject>.test.ts`
- testes E2E: `<flow>.spec.ts`
- route handlers: `route.ts`

### Grupos de rota
- usar route groups para separar contexto funcional:
  - `(public)`
  - `(auth)`
  - `(account)`
  - `(admin)`

## Politica de Dependencia Entre Camadas

Fluxo permitido:
- `app/` -> `components/`, `lib/`, `server/`
- `app/api/` -> `lib/`, `server/`
- `components/` -> `lib/`
- `server/` -> `lib/`, `data/`
- `tests/` -> todas as camadas necessarias para validacao

Fluxo proibido:
- `components/` -> `server/`
- `components/` -> `data/`
- `lib/` -> `server/`
- `lib/` -> `data/`
- `data/` -> qualquer outra camada
- qualquer camada nova -> `src/`
- qualquer camada nova -> `functions/`

## Decisao Estrutural Final

O repositorio novo sera construido fora da estrutura Vite legada, usando apenas a arquitetura acima.

Durante a migracao:
- `src/` e `functions/` continuam apenas como referencia
- nenhuma nova implementacao entra no legado
- todo codigo novo nasce dentro de `app/`, `components/`, `lib/`, `server/`, `data/` e `tests/`

## Resultado Esperado da Etapa

Ao final desta etapa:
- a estrutura final do repositorio esta fechada
- cada tipo de arquivo tem destino definido
- a separacao client/server esta definida
- o ownership de camada esta definido
- o gate contra novos arquivos no legado esta formalmente travado


