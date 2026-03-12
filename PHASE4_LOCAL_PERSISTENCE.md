# Etapa 4 - Persistencia Local

## Objetivo

Definir a estrategia de dados local por dominio, fechando a decisao inicial de persistencia, as regras formais de permanencia em JSON, as regras formais de subida para SQLite e o desenho de repositories, services, session store e seeds.

## Gate de Saida

Cada dominio do produto final precisa sair desta etapa com estrategia de persistencia explicitamente decidida.

## Decisao Base

Base inicial obrigatoria:
- persistencia local versionada em `data/`
- armazenamento inicial em JSON
- leitura e escrita encapsuladas em `server/repositories/`
- nenhuma leitura ou escrita direta em `data/` fora da camada de repository

Regra estrutural:
- JSON e o padrao inicial para o projeto inteiro
- SQLite e apenas a rota de escape local para dominios que ultrapassarem os limites seguros do JSON
- mesmo quando um dominio subir para SQLite, ele continua 100% local

## Modelo de Persistencia por Dominio

| Dominio | Fonte de verdade inicial | Estrategia inicial | Escrita | Caminhos iniciais | Regra de escape |
|---|---|---|---|---|---|
| publico | JSON de conteudo e configuracao | JSON somente leitura | baixa | `data/json/public.json` | nao precisa SQLite salvo se virar CMS local com edicao concorrente |
| auth usuario | contas locais + hashes + resets | JSON com repository proprio | media | `data/json/users.json`, `data/json/password-resets.json` | sobe para SQLite se auth e sessao exigirem atomicidade forte |
| auth admin | contas admin + hashes | JSON com repository proprio | baixa a media | `data/json/admins.json` | sobe para SQLite se houver mais de um admin ativo ou auditoria de sessao mais rigorosa |
| sessoes | store transversal separado | JSON com session store dedicado | media | `data/json/sessions.json` | sobe para SQLite se revogacao, expiracao, concorrencia ou multi-login ficarem frageis |
| conta | perfil, saldo e historico basico | JSON com ledger local separado | media a alta | `data/json/profiles.json`, `data/json/wallets.json`, `data/json/wallet-ledger.json` | sobe para SQLite se saldo e ajustes administrativos precisarem de garantia transacional |
| rankings | snapshots locais | JSON somente leitura | muito baixa | `data/json/rankings.json` | nao sobe para SQLite salvo se passar a receber escrita frequente |
| guildas/personagem | snapshots locais de consulta | JSON somente leitura | muito baixa | `data/json/guilds.json`, `data/json/characters.json` | nao sobe para SQLite salvo se houver edicao local persistente |
| loja | catalogo + compras locais | catalogo em JSON; compras em JSON transacional simples | media | `data/json/products.json`, `data/json/shop-orders.json`, `data/json/shop-payments.json` | sobe para SQLite se compra afetar saldo, inventario e pagamento em uma mesma mutacao critica |
| marketplace/ALZ | listings, pedidos, disputas e liquidacao | JSON inicial com repositories separados | alta | `data/json/listings.json`, `data/json/orders.json`, `data/json/disputes.json`, `data/json/market-settings.json` | sobe para SQLite se compra/venda/liquidacao/disputa exigirem consistencia transacional forte |
| notificacoes | fila e estado de leitura | JSON append/read | baixa a media | `data/json/notifications.json` | sobe para SQLite apenas se houver volume alto ou consulta complexa por usuario |
| admin | configuracoes e operacoes administrativas | sem banco proprio isolado; usa repositories dos dominios que opera + `admin-settings.json` | media | `data/json/admin-settings.json` | sobe para SQLite junto com conta, pedidos ou marketplace se esses dominios precisarem |
| seed/demo | seeds canonicos e reset local | JSON versionado | controlada | `data/seeds/*.json` | nao precisa SQLite |
| shared | sem persistencia propria | nenhum store dedicado | nenhuma | nao se aplica | nao se aplica |
| remocao | fora do produto final | nenhum | nenhuma | nao se aplica | nao se aplica |

## Decisao Formal por Dominio

### `publico`
- persistencia inicial: JSON somente leitura
- motivo: conteudo publico e configuracao visual nao exigem transacao nem concorrencia
- status: decidido

### `auth usuario`
- persistencia inicial: JSON em repository dedicado para usuarios e tokens/fluxos de reset
- motivo: permite bootstrap local simples sem depender de servico externo
- observacao: hashes de senha ficam no store de usuarios, nunca em texto puro
- status: decidido

### `auth admin`
- persistencia inicial: JSON em repository dedicado para admins
- motivo: baixa cardinalidade e fluxo local controlado
- status: decidido

### `sessoes`
- persistencia inicial: session store local dedicado em JSON
- motivo: manter sessao separada de users/admins e permitir politica unica de expiracao e revogacao
- status: decidido

### `conta`
- persistencia inicial: JSON com separacao entre perfil, carteira e ledger
- motivo: evita acoplamento entre dados de exibicao e dinheiro virtual
- status: decidido

### `rankings`
- persistencia inicial: JSON snapshot
- motivo: dados essencialmente de leitura
- status: decidido

### `guildas/personagem`
- persistencia inicial: JSON snapshot
- motivo: dominio de consulta local deterministica
- status: decidido

### `loja`
- persistencia inicial: catalogo em JSON e pedidos/pagamentos locais em repositories separados
- motivo: manter simples sem misturar catalogo com escrita transacional
- status: decidido

### `marketplace/ALZ`
- persistencia inicial: JSON com stores separados para listings, orders, disputes e market settings
- motivo: comeca simples, mas com fronteira pronta para promocao a SQLite
- status: decidido

### `notificacoes`
- persistencia inicial: JSON append/read por usuario
- motivo: baixo custo e baixa complexidade inicial
- status: decidido

### `admin`
- persistencia inicial: usa repositories dos dominios operados e um store proprio minimo de configuracao
- motivo: admin e camada operacional, nao banco separado
- status: decidido

### `seed/demo`
- persistencia inicial: JSON canonico de seed e reset
- motivo: garantir reproducibilidade local
- status: decidido

### `shared`
- persistencia inicial: nenhuma
- motivo: camada compartilhada nao pode virar fonte de verdade de dados
- status: decidido

### `remocao`
- persistencia inicial: nenhuma
- motivo: fora do produto final
- status: decidido

## Regra Formal: Quando JSON Continua Valido

JSON continua valido para um dominio apenas se todos os pontos abaixo forem verdadeiros ao mesmo tempo:

1. o dominio pode operar com um modelo local single-writer ou com escrita serializada por repository
2. uma mutacao normal do dominio nao exige transacao atomica envolvendo mais de um agregado critico
3. nao ha necessidade forte de query relacional complexa, indexacao dinamica ou filtros pesados
4. o risco de perda de consistencia entre arquivos distintos e baixo ou controlado
5. a recuperacao apos falha pode ser garantida por write strategy controlada e reseed quando necessario
6. a semantica do dominio tolera ids deterministas e leitura integral ou parcial de arquivo sem degradacao relevante
7. revogacao, expiracao e unicidade podem ser garantidas sem race condition relevante no uso local esperado

Se qualquer um desses pontos deixar de ser verdadeiro, o dominio entra em avaliacao de subida para SQLite.

## Regra Formal: Quando o Dominio Sobe para SQLite

Um dominio deve subir de JSON para SQLite quando pelo menos um dos criterios abaixo for verdadeiro e nao houver mitigacao simples e segura em JSON:

1. a mutacao do dominio precisa ser atomica entre duas ou mais entidades criticas
2. o dominio manipula saldo, liquidacao, pedido, disputa, inventario ou sessao com risco real de inconsistência cruzada
3. existe necessidade de garantir unicidade forte por chave, token, sessao ou relacao entre entidades
4. duas areas do sistema podem escrever no mesmo conjunto de dados em momentos proximos e a serializacao em arquivo deixa de ser confiavel
5. consultas por estado, periodo, usuario, vendedor, pedido ou disputa ficam caras ou complexas demais em JSON
6. a revogacao de sessao, reset de senha, conciliacao de pedido ou ajuste de saldo passa a exigir garantia de commit local unico
7. testes comecam a falhar por inconsistencias de escrita, ordem de evento ou race condition de file IO

## Regra de Escape Obrigatoria

Os seguintes dominios estao pre-aprovados para subida a SQLite local se JSON nao se sustentar com seguranca suficiente:
- auth usuario
- auth admin
- sessoes
- conta/saldos
- pedidos
- marketplace/ALZ
- loja, se compras e saldo compartilharem transacao critica
- admin, quando sua operacao depender da promocao dos dominios acima

## Desenho de Repositories

Principio:
- repository e a unica camada que pode ler e escrever em `data/`
- services nunca acessam arquivo diretamente
- componentes e `app/api/*` nunca escrevem em `data/`

Estrutura inicial:

```text
server/repositories/
  base/
    JsonFileStore.ts
    RepositoryTypes.ts
  users/
    UserRepository.ts
  admins/
    AdminRepository.ts
  sessions/
    SessionRepository.ts
  profiles/
    ProfileRepository.ts
  wallets/
    WalletRepository.ts
    WalletLedgerRepository.ts
  rankings/
    RankingRepository.ts
  guilds/
    GuildRepository.ts
  characters/
    CharacterRepository.ts
  products/
    ProductRepository.ts
  shop/
    ShopOrderRepository.ts
    ShopPaymentRepository.ts
  marketplace/
    ListingRepository.ts
    OrderRepository.ts
    DisputeRepository.ts
    MarketSettingsRepository.ts
  notifications/
    NotificationRepository.ts
  admin/
    AdminSettingsRepository.ts
```

Regras:
- repositories expõem interfaces estaveis e orientadas a dominio
- a troca de JSON para SQLite nao muda o contrato de service
- cada repository valida entrada e saida com tipos e schemas compartilhados
- escrita em arquivo deve ser serializada por store
- ids e timestamps de seed devem ser deterministas quando o fluxo exigir reproducibilidade

## Desenho de Services

Principio:
- service concentra regra de negocio, orquestracao e validacao de caso de uso
- service usa repositories e adapters locais

Estrutura inicial:

```text
server/services/
  auth/
    userAuthService.ts
    adminAuthService.ts
    passwordResetService.ts
  account/
    accountService.ts
    walletService.ts
  rankings/
    rankingService.ts
  guilds/
    guildService.ts
  character/
    characterService.ts
  shop/
    shopCatalogService.ts
    shopCheckoutService.ts
  marketplace/
    listingService.ts
    orderService.ts
    disputeService.ts
    settlementService.ts
  notifications/
    notificationService.ts
  admin/
    adminDashboardService.ts
    adminAccountService.ts
    adminOrderService.ts
    adminDisputeService.ts
```

Regras:
- service e dono da regra, nao o route handler
- service resolve autorizacao de caso de uso em conjunto com `server/auth` e `server/session`
- service decide quando um fluxo precisa escrever em mais de um repository
- se essa escrita multipla ficar fragil em JSON, o dominio sobe para SQLite

## Desenho do Session Store

Estrutura alvo:

```text
server/session/
  SessionStore.ts
  sessionCookies.ts
  sessionTypes.ts
  sessionGuards.ts
```

Politica:
- sessao de usuario e sessao admin sao separadas logicamente
- cookies HTTP-only sao obrigatorios
- o store persiste id de sessao, subject, role, emissao, expiracao e estado de revogacao
- o route handler nunca gerencia sessao manualmente fora desta camada
- se expiracao, revogacao ou multi-login ficarem frageis em JSON, `SessionStore` ganha implementacao SQLite sem mudar o contrato publico

## Desenho de Seeds

Principio:
- seeds sao a origem canonica dos dados iniciais
- `data/json/` e o working set local
- reset local controlado sempre restaura a partir de `data/seeds/`

Estrutura alvo:

```text
data/
  seeds/
    users.seed.json
    admins.seed.json
    profiles.seed.json
    wallets.seed.json
    wallet-ledger.seed.json
    rankings.seed.json
    guilds.seed.json
    characters.seed.json
    products.seed.json
    listings.seed.json
    orders.seed.json
    disputes.seed.json
    notifications.seed.json
    admin-settings.seed.json
  json/
    users.json
    admins.json
    profiles.json
    wallets.json
    wallet-ledger.json
    rankings.json
    guilds.json
    characters.json
    products.json
    shop-orders.json
    shop-payments.json
    listings.json
    orders.json
    disputes.json
    notifications.json
    sessions.json
    admin-settings.json
```

Regras:
- seed deve ser deterministico
- ids fixos para entidades base importantes
- nenhum seed pode depender de API remota
- `data/json/` pode ser regenerado a partir de `data/seeds/`
- testes usam fixtures proprias ou reset controlado a partir das seeds

## Mapa de Risco por Dominio

Baixo risco em JSON:
- publico
- rankings
- guildas/personagem
- notificacoes
- seed/demo

Risco medio em JSON:
- auth usuario
- auth admin
- loja
- conta
- admin

Alto risco em JSON:
- sessoes
- marketplace/ALZ
- pedidos
- saldo/liquidacao

## Decisao Final da Etapa

A estrategia inicial do projeto e:
- JSON versionado em `data/`
- repositories em `server/repositories/`
- services em `server/services/`
- session store dedicado em `server/session/`
- seeds canonicas em `data/seeds/`
- promocao seletiva para SQLite apenas nos dominios em que JSON falhar nos criterios formais desta etapa

Com isso, todos os dominios obrigatorios, opcionais de apoio e transversais relevantes saem desta etapa com estrategia de persistencia definida.
