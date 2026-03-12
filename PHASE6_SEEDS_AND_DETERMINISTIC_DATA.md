# Etapa 6 - Seeds e Dados Deterministicos

## Objetivo

Garantir funcionamento local desde cedo, definindo o plano de seeds, o conjunto minimo de dados por dominio, a politica de geracao deterministica e a politica de reset/reseed local.

## Gate de Saida

O sistema novo precisa conseguir subir com dados locais suficientes para executar os fluxos obrigatorios sem depender de rede externa.

Isto implica:
- todos os dominios obrigatorios possuem dataset minimo local
- toda relacao critica entre entidades ja nasce consistente
- simulacoes locais dependem apenas de seeds e adapters locais
- nenhum fluxo minimo depende de fetch remoto, dump externo ou geracao aleatoria nao controlada

## Estrategia Geral de Seeds

### Fonte canonica
- `data/seeds/` e a origem canonica dos dados iniciais
- `data/json/` e o working set local em runtime
- o boot local parte de `data/seeds/` para povoar `data/json/` quando necessario

### Regra de uso
- seeds sao versionadas no repositorio
- runtime pode mutar apenas `data/json/`
- testes podem usar reset controlado a partir de `data/seeds/` ou fixtures dedicadas em `tests/fixtures/`

### Objetivo funcional
O conjunto minimo precisa ser suficiente para:
- login de usuario
- login admin
- home publica com dados reais locais
- conta do usuario com saldo e historico
- rankings navegaveis
- guildas e personagem navegaveis
- loja com catalogo e compra simulada
- marketplace/ALZ com listagem, compra, venda, pedido e disputa
- notificacoes visiveis
- dashboard admin com contas, pedidos, disputas e configuracao minima

## Plano de Seeds

## Seed set canonico inicial

Arquivos canonicos em `data/seeds/`:
- `users.seed.json`
- `admins.seed.json`
- `profiles.seed.json`
- `wallets.seed.json`
- `wallet-ledger.seed.json`
- `rankings.seed.json`
- `guilds.seed.json`
- `characters.seed.json`
- `products.seed.json`
- `listings.seed.json`
- `orders.seed.json`
- `disputes.seed.json`
- `notifications.seed.json`
- `admin-settings.seed.json`
- `public.seed.json`
- `market-settings.seed.json`
- `shop-orders.seed.json`
- `shop-payments.seed.json`
- `payment-simulations.seed.json`

## Working set inicial em `data/json/`
- `users.json`
- `admins.json`
- `profiles.json`
- `wallets.json`
- `wallet-ledger.json`
- `rankings.json`
- `guilds.json`
- `characters.json`
- `products.json`
- `listings.json`
- `orders.json`
- `disputes.json`
- `notifications.json`
- `admin-settings.json`
- `public.json`
- `market-settings.json`
- `shop-orders.json`
- `shop-payments.json`
- `payment-simulations.json`
- `sessions.json`
- `password-resets.json`

## Politica para dados efemeros
Nao devem ser seedados como historico persistente obrigatorio:
- `sessions.json`
- `password-resets.json`

Regra:
- esses arquivos podem nascer vazios no reset inicial
- sao gerados como working set vazio e controlado
- nao dependem de seed remota

## Conjunto Minimo de Dados por Dominio

### 1. Usuarios
Arquivo canonico:
- `data/seeds/users.seed.json`

Quantidade minima:
- 3 usuarios

Perfis minimos:
- `user_demo_buyer`
- `user_demo_seller`
- `user_demo_neutral`

Campos minimos:
- `id`
- `email`
- `username`
- `displayName`
- `passwordHash`
- `status`
- `role`
- `createdAt`
- `updatedAt`

Objetivo:
- permitir login
- permitir compra/venda no marketplace
- permitir visualizacao da conta e notificacoes

### 2. Admins
Arquivo canonico:
- `data/seeds/admins.seed.json`

Quantidade minima:
- 1 admin

Perfil minimo:
- `admin_demo_primary`

Campos minimos:
- `id`
- `email`
- `displayName`
- `passwordHash`
- `permissions`
- `status`
- `createdAt`
- `updatedAt`

Objetivo:
- permitir login administrativo e operacao do painel minimo

### 3. Perfis e Conta
Arquivos canonicos:
- `data/seeds/profiles.seed.json`
- `data/seeds/wallets.seed.json`
- `data/seeds/wallet-ledger.seed.json`

Quantidade minima:
- 3 profiles vinculados aos 3 usuarios
- 3 wallets
- 4 a 6 linhas de ledger inicial

Distribuicao minima:
- buyer com saldo suficiente para comprar listing seeded
- seller com saldo ou historico de venda inicial
- neutral com conta valida sem atividade critica

Objetivo:
- permitir area da conta com estado visivel
- permitir compra local e leitura de historico
- permitir ajustes admin de saldo no futuro

### 4. Personagens
Arquivo canonico:
- `data/seeds/characters.seed.json`

Quantidade minima:
- 3 personagens

Distribuicao minima:
- 1 personagem vendedor vinculado ao seller
- 1 personagem comprador vinculado ao buyer
- 1 personagem neutro ou destaque de ranking

Objetivo:
- suportar elegibilidade de compra/venda
- alimentar perfis de personagem e integracao com guilda

### 5. Guildas
Arquivo canonico:
- `data/seeds/guilds.seed.json`

Quantidade minima:
- 2 guildas

Distribuicao minima:
- 1 guilda do personagem vendedor
- 1 guilda adicional para navegacao e ranking social

Objetivo:
- permitir listagem e detalhe de guildas
- permitir associacao de personagem com guilda

### 6. Rankings
Arquivo canonico:
- `data/seeds/rankings.seed.json`

Quantidade minima:
- 3 boards ou categorias
- 5 a 10 entries consolidadas no total

Categorias minimas sugeridas:
- ranking de personagens
- ranking de guildas
- destaque semanal ou categoria publica equivalente

Objetivo:
- tornar a pagina de ranking navegavel sem agregacao remota

### 7. Loja
Arquivos canonicos:
- `data/seeds/products.seed.json`
- `data/seeds/shop-orders.seed.json`
- `data/seeds/shop-payments.seed.json`

Quantidade minima:
- 4 produtos
- 1 pedido de loja concluido
- 1 pagamento simulado concluido

Distribuicao minima de produtos:
- 1 premium
- 1 item recorrente do ecossistema local
- 1 item stub local aprovado como badge/box/extensor se mantido
- 1 produto inativo para validar status

Objetivo:
- suportar catalogo e historico minimo da loja

### 8. Marketplace/ALZ Listings
Arquivo canonico:
- `data/seeds/listings.seed.json`

Quantidade minima:
- 3 listings

Distribuicao minima:
- 1 listing ativa do seller
- 1 listing pausada ou fechada
- 1 listing adicional para variedade de status e filtro

Objetivo:
- permitir listagem, detalhe, minhas ofertas e fluxo de compra/venda

### 9. Pedidos
Arquivos canonicos:
- `data/seeds/orders.seed.json`
- `data/seeds/disputes.seed.json`
- `data/seeds/payment-simulations.seed.json`

Quantidade minima:
- 2 pedidos
- 1 disputa aberta ou resolvida
- 2 simulacoes de pagamento/liquidacao associadas

Distribuicao minima:
- 1 pedido concluido
- 1 pedido pendente ou em disputa

Objetivo:
- permitir tela de pedidos, status e admin operar o fluxo

### 10. Notificacoes
Arquivo canonico:
- `data/seeds/notifications.seed.json`

Quantidade minima:
- 5 notificacoes no total

Distribuicao minima:
- 2 do buyer
- 2 do seller
- 1 administrativa ou sistemica relevante

Objetivo:
- alimentar indicador, lista e marcacao como lida

### 11. Dados Admin
Arquivos canonicos:
- `data/seeds/admin-settings.seed.json`
- `data/seeds/market-settings.seed.json`
- parte derivada de users, orders, disputes e wallets

Quantidade minima:
- 1 configuracao admin
- 1 configuracao de fee/mercado

Objetivo:
- permitir dashboard admin minimo com overview, contas, pedidos, disputas e configuracoes basicas

### 12. Publico
Arquivo canonico:
- `data/seeds/public.seed.json`

Quantidade minima:
- 1 documento de conteudo publico

Conteudo minimo:
- hero/home
- highlights principais
- links de navegacao publica
- secoes de apoio que a home final precisar

Objetivo:
- home publica sobe com conteudo local consistente

## Relacoes Minimas Obrigatorias

As seguintes relacoes devem existir ja no seed inicial:
- cada `profile` referencia um `user`
- cada `wallet` referencia um `user`
- pelo menos 2 `characters` referenciam users que participam do marketplace
- pelo menos 1 `character` referencia uma `guild`
- cada `listing` ativa referencia um seller existente e um personagem elegivel
- cada `order` referencia listing, buyer e seller existentes
- cada `dispute` referencia um order existente
- cada `notification` referencia um user existente
- cada linha de `wallet-ledger` referencia uma wallet existente
- cada simulacao de pagamento referencia order ou shop-order existente

## Politica de Geracao Deterministica

### Regras obrigatorias
- ids sao fixos e legiveis, nao aleatorios
- slugs sao fixos
- ordem dos arrays e estavel
- timestamps base sao fixos
- seeds nao chamam rede
- nenhum valor depende de `Math.random()`, `Date.now()` ou hora atual do sistema no momento de gerar seed canonica

### Convencoes de ID
Exemplos de formato:
- usuarios: `usr_demo_buyer`, `usr_demo_seller`, `usr_demo_neutral`
- admins: `adm_demo_primary`
- personagens: `chr_demo_buyer_main`
- guildas: `gld_demo_guardians`
- produtos: `prd_premium_30d`
- listings: `lst_demo_active_001`
- orders: `ord_demo_completed_001`
- disputas: `dsp_demo_open_001`
- notificacoes: `ntf_demo_order_001`

### Convencao temporal
Data base canonica:
- usar uma ancora fixa, por exemplo `2026-01-01T12:00:00.000Z`, e derivar todos os outros timestamps dela

Regra:
- timestamps relativos sao calculados deterministicamente a partir da ancora
- nenhum seed canonico usa horario local do momento da execucao

### Convencao de saldo e valores
- valores monetarios e quantidades devem ser inteiros ou decimais fixos definidos em seed
- taxas de mercado usam valores fixos em `market-settings.seed.json`
- nenhuma taxa e calculada por fonte externa

### Convencao de hash de senha
- os hashes usados em seed devem ser pregerados e versionados
- nenhuma senha em texto puro e armazenada nos arquivos de seed
- a documentacao de seed pode referenciar credenciais demo conhecidas, mas o arquivo armazena apenas hash

## Politica de Reset/Reseed Local

### Comando conceitual de reset
Reset local significa:
1. limpar ou sobrescrever o working set em `data/json/`
2. copiar o estado canonico de `data/seeds/` para `data/json/`
3. recriar arquivos efemeros vazios quando aplicavel
4. validar integridade minima do dataset restaurado

### Arquivos recriados vazios no reset
- `data/json/sessions.json`
- `data/json/password-resets.json`

### Arquivos restaurados do seed canonico
- `users.json`
- `admins.json`
- `profiles.json`
- `wallets.json`
- `wallet-ledger.json`
- `rankings.json`
- `guilds.json`
- `characters.json`
- `products.json`
- `listings.json`
- `orders.json`
- `disputes.json`
- `notifications.json`
- `admin-settings.json`
- `public.json`
- `market-settings.json`
- `shop-orders.json`
- `shop-payments.json`
- `payment-simulations.json`

### Garantias do reset
- o reset sempre retorna ao mesmo estado inicial
- o reset nao depende de internet
- o reset nao tenta mesclar dados do working set com seed
- o reset privilegia reproducibilidade sobre preservacao de alteracoes locais

## Politica de Reseed Parcial

Permitido apenas para desenvolvimento e teste controlado:
- reseed de um dominio isolado se nao quebrar relacoes obrigatorias
- reseed parcial deve revalidar referencias cruzadas antes de concluir

Dominios com risco alto para reseed parcial:
- conta
- marketplace/ALZ
- pedidos
- disputas
- payment-simulations

Regra:
- quando houver duvida, usar reset completo em vez de reseed parcial

## Dataset Minimo para Subida Local

Para considerar o app apto a subir localmente cedo, o dataset minimo deve garantir:
- 1 usuario comprador consegue logar
- 1 usuario vendedor consegue logar
- 1 admin consegue logar
- existe home publica local
- existe pelo menos 1 guilda e 1 personagem navegavel
- existe ranking com entradas reais locais
- existe catalogo de loja local
- existe listing ativa
- existe pedido concluido e pedido pendente ou em disputa
- existem notificacoes para pelo menos 2 usuarios
- existe configuracao admin e market settings local

## Riscos e Regras de Controle

### Riscos
- referencial quebrado entre listing, order e wallet
- saldo seed inconsistente com ledger
- dashboard admin sem dados suficientes para cards e tabelas
- simulacao de pagamento apontando para pedido inexistente
- seeds excessivamente grandes gerando ruido desnecessario

### Regras de controle
- manter dataset pequeno, suficiente e util
- validar referencias cruzadas no momento do reset
- nao usar seeds gigantes do legado
- preferir poucos registros com boa cobertura de estado

## Decisao Final da Etapa

A partir desta etapa, o projeto passa a ter um plano de seeds local, deterministico e suficiente para subir sem rede externa.

O estado inicial aprovado e:
- pequeno
- versionado
- reprodutivel
- relacionalmente coerente
- suficiente para os fluxos obrigatorios do produto final
