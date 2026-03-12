# Etapa 5 - Contratos e Schemas

## Objetivo

Eliminar ambiguidade antes de migrar UI e regras, definindo contratos TypeScript por dominio, schemas Zod por dominio, politica de validacao de entrada e saida e mapa legado para contrato novo.

## Gate de Saida

O frontend novo so pode consumir contratos locais definidos nesta etapa.

Isto significa:
- nenhum componente novo consome shape implicito vindo do legado
- nenhum componente novo depende de resposta crua de `src/api/*`
- nenhum route handler novo devolve estrutura ad hoc sem contrato definido em `lib/types/*` e `lib/schemas/*`
- nenhum fluxo novo depende de Base44, Supabase ou schemas informais herdados

## Estrutura de Contratos e Schemas

Estrutura alvo:

```text
lib/
  types/
    common.ts
    user.ts
    admin.ts
    session.ts
    character.ts
    guild.ts
    ranking.ts
    product.ts
    listing.ts
    order.ts
    notification.ts
    admin-dashboard.ts
    payment-simulation.ts
  schemas/
    common.ts
    user.ts
    admin.ts
    session.ts
    character.ts
    guild.ts
    ranking.ts
    product.ts
    listing.ts
    order.ts
    notification.ts
    admin-dashboard.ts
    payment-simulation.ts
```

Regra estrutural:
- `lib/types/*` define os contratos TypeScript canonicos
- `lib/schemas/*` define validacao Zod canonica
- nenhum dominio cria shape alternativo fora dessas pastas para representar o mesmo agregado
- DTOs de entrada e saida vivem no mesmo arquivo de dominio ou em secoes nomeadas do mesmo contrato

## Politica Geral de Contratos

### Principios
- todo agregado de dominio tem um tipo canonico
- toda entrada externa ou de fronteira tem schema Zod correspondente
- toda saida de route handler tambem tem contrato definido e validavel
- o frontend consome apenas DTOs de leitura e mutacao definidos localmente
- entidades internas podem ser mais ricas, mas nunca vazam para a UI sem DTO explicito

### Categorias de contrato por dominio
Cada dominio pode definir ate quatro niveis de contrato:
- `Entity`: representacao canonica persistida ou composta no server
- `Summary`: shape reduzido para listagem e cards
- `Detail`: shape completo para leitura de tela
- `Input`: payload de criacao, edicao, filtro ou acao

### Politica de nomes
- entidades: `User`, `AdminAccount`, `SessionRecord`, `CharacterProfile`, `GuildProfile`, `RankingEntry`, `Product`, `MarketplaceListing`, `MarketplaceOrder`, `UserNotification`, `AdminDashboardSnapshot`, `PaymentSimulationResult`
- summaries: `UserSummary`, `ListingSummary`, `OrderSummary`
- details: `UserDetail`, `ListingDetail`, `OrderDetail`
- inputs: `LoginInput`, `CreateListingInput`, `CreateOrderInput`, `MarkNotificationReadInput`
- filtros e query params: `XFilterInput`, `XQueryInput`
- envelopes de resposta: `ApiSuccess<T>`, `ApiError`, `PaginatedResponse<T>`

## Contrato Base Compartilhado

### `lib/types/common.ts`

Contratos minimos compartilhados:
- `EntityId = string`
- `IsoDateTimeString = string`
- `MoneyAmount = number`
- `CurrencyCode = 'BRL'`
- `Role = 'user' | 'admin'`
- `RecordStatus = 'active' | 'inactive' | 'suspended' | 'deleted'`
- `ApiSuccess<T>`
- `ApiError`
- `PaginatedResponse<T>`
- `AuditStamp` com `createdAt`, `updatedAt`

### `lib/schemas/common.ts`

Schemas base:
- `entityIdSchema`
- `isoDateTimeSchema`
- `moneyAmountSchema`
- `currencyCodeSchema`
- `roleSchema`
- `recordStatusSchema`
- `apiSuccessSchema`
- `apiErrorSchema`
- `paginatedResponseSchema`
- `auditStampSchema`

## Contrato TypeScript por Dominio

### 1. Usuario
Arquivo alvo:
- `lib/types/user.ts`

Contratos minimos:
- `User`
- `UserSummary`
- `UserDetail`
- `UserCredentials`
- `UserProfile`
- `UserSecurityState`
- `LoginInput`
- `RegisterInput`
- `ForgotPasswordInput`
- `ResetPasswordInput`
- `ChangePasswordInput`
- `UpdateUserProfileInput`
- `UserMeResponse`

Campos minimos obrigatorios de `User`:
- `id`
- `email`
- `username`
- `displayName`
- `status`
- `role`
- `createdAt`
- `updatedAt`

Campos server-only obrigatorios:
- `passwordHash`
- `lastLoginAt`
- `passwordUpdatedAt`

### 2. Admin
Arquivo alvo:
- `lib/types/admin.ts`

Contratos minimos:
- `AdminAccount`
- `AdminSummary`
- `AdminDetail`
- `AdminLoginInput`
- `AdminMeResponse`
- `AdminPermissions`

Campos minimos:
- `id`
- `email`
- `displayName`
- `status`
- `role = 'admin'`
- `permissions`
- `createdAt`
- `updatedAt`

### 3. Sessao
Arquivo alvo:
- `lib/types/session.ts`

Contratos minimos:
- `SessionRecord`
- `SessionSubject`
- `SessionPublic`
- `CreateSessionInput`
- `SessionValidationResult`

Campos minimos:
- `id`
- `subjectId`
- `role`
- `issuedAt`
- `expiresAt`
- `revokedAt`
- `ipAddress?`
- `userAgent?`

### 4. Personagem
Arquivo alvo:
- `lib/types/character.ts`

Contratos minimos:
- `CharacterProfile`
- `CharacterSummary`
- `CharacterDetail`
- `CharacterMarketEligibility`

Campos minimos:
- `id`
- `name`
- `level`
- `className`
- `guildId?`
- `serverName`
- `rankSnapshot?`

### 5. Guilda
Arquivo alvo:
- `lib/types/guild.ts`

Contratos minimos:
- `GuildProfile`
- `GuildSummary`
- `GuildDetail`
- `GuildMemberSummary`

Campos minimos:
- `id`
- `name`
- `leaderName`
- `memberCount`
- `powerScore?`
- `rankingPosition?`

### 6. Ranking
Arquivo alvo:
- `lib/types/ranking.ts`

Contratos minimos:
- `RankingEntry`
- `RankingBoard`
- `RankingSummary`
- `RankingQueryInput`

Campos minimos:
- `id`
- `category`
- `position`
- `subjectType`
- `subjectId`
- `subjectName`
- `score`
- `recordedAt`

### 7. Produto
Arquivo alvo:
- `lib/types/product.ts`

Contratos minimos:
- `Product`
- `ProductSummary`
- `ProductDetail`
- `ProductPrice`
- `ShopCatalogResponse`
- `CreateShopOrderInput`

Campos minimos:
- `id`
- `slug`
- `title`
- `description`
- `status`
- `kind`
- `price`
- `currency`
- `inventoryMode`

### 8. Listing
Arquivo alvo:
- `lib/types/listing.ts`

Contratos minimos:
- `MarketplaceListing`
- `ListingSummary`
- `ListingDetail`
- `CreateListingInput`
- `UpdateListingInput`
- `ListingTermsAcceptance`

Campos minimos:
- `id`
- `sellerUserId`
- `sellerCharacterId`
- `amount`
- `unitPrice`
- `status`
- `createdAt`
- `updatedAt`

### 9. Pedido
Arquivo alvo:
- `lib/types/order.ts`

Contratos minimos:
- `MarketplaceOrder`
- `OrderSummary`
- `OrderDetail`
- `CreateOrderInput`
- `OrderStatus`
- `DisputeRecord`
- `CreateDisputeInput`

Campos minimos:
- `id`
- `listingId`
- `buyerUserId`
- `sellerUserId`
- `amount`
- `grossAmount`
- `feeAmount`
- `netAmount`
- `status`
- `createdAt`
- `updatedAt`

### 10. Notificacao
Arquivo alvo:
- `lib/types/notification.ts`

Contratos minimos:
- `UserNotification`
- `NotificationSummary`
- `NotificationDetail`
- `MarkNotificationReadInput`
- `MarkAllNotificationsReadInput`

Campos minimos:
- `id`
- `userId`
- `kind`
- `title`
- `message`
- `isRead`
- `createdAt`
- `readAt?`

### 11. Dashboard Admin
Arquivo alvo:
- `lib/types/admin-dashboard.ts`

Contratos minimos:
- `AdminDashboardSnapshot`
- `AdminOverviewMetrics`
- `AdminAccountRow`
- `AdminOrderRow`
- `AdminDisputeRow`
- `AdminAdjustBalanceInput`
- `AdminMarketSettingsInput`

Campos minimos:
- `generatedAt`
- `overview`
- `accounts`
- `orders`
- `disputes`
- `marketSettings`

### 12. Simulacoes de Pagamento/Webhook
Arquivo alvo:
- `lib/types/payment-simulation.ts`

Contratos minimos:
- `PaymentSimulationRequest`
- `PaymentSimulationResult`
- `PaymentSimulationStatus`
- `WebhookSimulationPayload`
- `SettlementSimulationResult`

Campos minimos:
- `id`
- `contextType`
- `referenceId`
- `status`
- `requestedAt`
- `processedAt?`
- `provider = 'local-simulator'`

## Schema Zod por Dominio

### `lib/schemas/user.ts`
Schemas minimos:
- `userSchema`
- `userSummarySchema`
- `userDetailSchema`
- `loginInputSchema`
- `registerInputSchema`
- `forgotPasswordInputSchema`
- `resetPasswordInputSchema`
- `changePasswordInputSchema`
- `updateUserProfileInputSchema`
- `userMeResponseSchema`

### `lib/schemas/admin.ts`
Schemas minimos:
- `adminAccountSchema`
- `adminSummarySchema`
- `adminDetailSchema`
- `adminLoginInputSchema`
- `adminMeResponseSchema`
- `adminPermissionsSchema`

### `lib/schemas/session.ts`
Schemas minimos:
- `sessionRecordSchema`
- `sessionPublicSchema`
- `createSessionInputSchema`
- `sessionValidationResultSchema`

### `lib/schemas/character.ts`
Schemas minimos:
- `characterProfileSchema`
- `characterSummarySchema`
- `characterDetailSchema`
- `characterMarketEligibilitySchema`

### `lib/schemas/guild.ts`
Schemas minimos:
- `guildProfileSchema`
- `guildSummarySchema`
- `guildDetailSchema`
- `guildMemberSummarySchema`

### `lib/schemas/ranking.ts`
Schemas minimos:
- `rankingEntrySchema`
- `rankingBoardSchema`
- `rankingSummarySchema`
- `rankingQueryInputSchema`

### `lib/schemas/product.ts`
Schemas minimos:
- `productSchema`
- `productSummarySchema`
- `productDetailSchema`
- `productPriceSchema`
- `shopCatalogResponseSchema`
- `createShopOrderInputSchema`

### `lib/schemas/listing.ts`
Schemas minimos:
- `marketplaceListingSchema`
- `listingSummarySchema`
- `listingDetailSchema`
- `createListingInputSchema`
- `updateListingInputSchema`
- `listingTermsAcceptanceSchema`

### `lib/schemas/order.ts`
Schemas minimos:
- `marketplaceOrderSchema`
- `orderSummarySchema`
- `orderDetailSchema`
- `createOrderInputSchema`
- `orderStatusSchema`
- `disputeRecordSchema`
- `createDisputeInputSchema`

### `lib/schemas/notification.ts`
Schemas minimos:
- `userNotificationSchema`
- `notificationSummarySchema`
- `notificationDetailSchema`
- `markNotificationReadInputSchema`
- `markAllNotificationsReadInputSchema`

### `lib/schemas/admin-dashboard.ts`
Schemas minimos:
- `adminDashboardSnapshotSchema`
- `adminOverviewMetricsSchema`
- `adminAccountRowSchema`
- `adminOrderRowSchema`
- `adminDisputeRowSchema`
- `adminAdjustBalanceInputSchema`
- `adminMarketSettingsInputSchema`

### `lib/schemas/payment-simulation.ts`
Schemas minimos:
- `paymentSimulationRequestSchema`
- `paymentSimulationResultSchema`
- `paymentSimulationStatusSchema`
- `webhookSimulationPayloadSchema`
- `settlementSimulationResultSchema`

## Politica de Validacao de Entrada e Saida

### Entrada
- toda entrada HTTP e validada em `app/api/*` com schema Zod antes de chamar service
- toda entrada de server action futura segue o mesmo contrato local
- query params, params dinamicos e body usam schema explicito
- cookies e cabecalhos lidos para auth/sessao tambem passam por parsing centralizado

### Saida
- toda saida publica de route handler deve corresponder a um tipo em `lib/types/*`
- toda saida de route handler deve poder ser validada por schema correspondente em `lib/schemas/*`
- respostas de erro usam `ApiError`
- respostas de sucesso usam DTO explicito, nunca entidade crua de repository

### Persistencia
- repository valida shape lido de `data/json/*` ao entrar na aplicacao
- service valida invariantes de negocio que vao alem do shape
- seed valida shape antes de popular `data/json/*`

### UI
- frontend consome somente `Summary`, `Detail`, `MeResponse`, `Snapshot`, `CatalogResponse` e inputs definidos nesta etapa
- frontend nao consome `passwordHash`, `revokedAt`, ledger bruto ou campos administrativos internos sem DTO explicito

### Evolucao de contrato
- se um dominio ganhar campo novo, o tipo e o schema do mesmo dominio mudam juntos
- nenhuma rota pode evoluir formato sem atualizar contrato e validacao correspondentes
- contratos compartilhados entre frontend e server devem ser backward-compatible dentro da mesma fase de migracao

## Mapa Legado -> Contrato Novo

| Origem legada | Dominio novo | Contrato novo principal |
|---|---|---|
| `src/lib/AuthContext.jsx`, `src/components/auth/*`, `functions/auth_*` | auth usuario | `User`, `LoginInput`, `UserMeResponse`, `SessionRecord` |
| `src/pages/AdminLogin.jsx`, `src/components/admin/*`, `functions/admin_*` | auth admin / admin | `AdminAccount`, `AdminLoginInput`, `AdminMeResponse`, `AdminDashboardSnapshot` |
| `src/pages/Profile.jsx`, `src/pages/Account*.jsx`, `src/components/account/*` | conta | `UserDetail`, `UserProfile`, `MarketplaceOrder`, `AdminAdjustBalanceInput` |
| `src/pages/Rankings*.jsx`, `src/components/rankings/*` | rankings | `RankingBoard`, `RankingEntry`, `RankingQueryInput` |
| `src/pages/Guild*.jsx`, `src/pages/Character*.jsx`, `src/components/guild*`, `src/components/character*` | guildas/personagem | `GuildProfile`, `GuildDetail`, `CharacterProfile`, `CharacterDetail` |
| `src/pages/Shop*.jsx`, `src/components/shop/*`, `functions/shop_*` | loja | `Product`, `ProductDetail`, `ShopCatalogResponse`, `PaymentSimulationResult` |
| `src/pages/Marketplace*.jsx`, `src/components/marketplace/*`, `functions/market*`, `functions/alz*` | marketplace/ALZ | `MarketplaceListing`, `ListingDetail`, `MarketplaceOrder`, `OrderDetail`, `DisputeRecord` |
| `src/components/notifications/*`, `functions/notifications*` | notificacoes | `UserNotification`, `NotificationDetail`, `MarkNotificationReadInput` |
| `src/components/admin/dashboard/*`, `functions/admin_dashboard*` | admin | `AdminDashboardSnapshot`, `AdminOrderRow`, `AdminDisputeRow` |
| `functions/payment*`, `functions/bridge*`, `functions/efi*` | simulacoes locais | `PaymentSimulationRequest`, `PaymentSimulationResult`, `WebhookSimulationPayload`, `SettlementSimulationResult` |
| `src/api/*` legado | todos os dominios | substituido por DTOs locais e schemas Zod canonicos |
| `Base44 entities` e `Supabase records` | todos os dominios persistidos | mapeados para `Entity` locais em `lib/types/*` |

## Regras de Fronteira

### O frontend pode consumir
- contratos em `lib/types/*`
- resultados validados de `app/api/*`
- enums e constants de `lib/constants/*`

### O frontend nao pode consumir
- shape bruto de `data/json/*`
- record interno de repository sem DTO
- provider legado
- cliente Base44
- shape Supabase
- resposta informal criada dentro de componente

### O backend local deve consumir
- inputs e outputs definidos em `lib/types/*`
- schemas definidos em `lib/schemas/*`
- invariantes de negocio em `server/services/*`

## Decisao Final da Etapa

A partir desta etapa, o projeto passa a ter fronteira canonica de dados baseada em:
- tipos TypeScript por dominio em `lib/types/*`
- schemas Zod por dominio em `lib/schemas/*`
- validacao obrigatoria de entrada e saida nas fronteiras locais
- substituicao de qualquer shape legado por contrato explicito novo

Com isso, UI, route handlers, repositories, services e seeds podem ser migrados sem ambiguidade de formato.
