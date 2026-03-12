# Etapa 2 - Escopo Final Obrigatorio

## Objetivo

Definir exatamente o produto final minimo do projeto, com base na classificacao da Etapa 1, sem iniciar implementacao.

## Gate de Saida

Tudo o que nao estiver aprovado abaixo como obrigatorio, opcional ou stub local fica fora do produto final.

## Funcionalidades Obrigatorias

### 1. Home publica

Obrigatorio:
- pagina inicial publica
- shell publico com navegacao principal
- secoes essenciais de apresentacao do servidor e do portal
- blocos visuais da home somente se ajudarem a comunicar status, proposta e acesso aos fluxos principais

Resultado esperado:
- existe uma home clara, navegavel e funcional sem login

### 2. Auth usuario

Obrigatorio:
- login
- cadastro
- logout
- sessao local valida
- recuperar senha
- alterar senha
- guardas de acesso para area autenticada
- endpoint local equivalente a `me`

Resultado esperado:
- usuario consegue entrar, sair, recuperar acesso e navegar em area protegida sem Base44 ou Supabase

### 3. Auth admin

Obrigatorio:
- login admin
- logout admin
- sessao admin local valida
- guarda server-side de acesso administrativo
- endpoint local equivalente a `admin me`

Resultado esperado:
- admin consegue autenticar e acessar o painel minimo com sessao separada da sessao de usuario

### 4. Area do usuario

Obrigatorio:
- pagina principal da conta
- resumo basico do usuario autenticado
- carteira/saldo local
- historico basico de pedidos ALZ do usuario
- alterar senha dentro da conta

Resultado esperado:
- usuario consegue consultar sua conta e o estado minimo do seu uso do sistema

### 5. Rankings

Obrigatorio:
- pagina de rankings consolidada
- dados locais atuais de ranking
- widgets ou secoes de ranking na home apenas se ajudarem o produto final

Resultado esperado:
- rankings funcionam localmente sem cron remoto, Base44 ou Supabase

### 6. Guildas/personagem

Obrigatorio:
- listagem de guildas
- detalhe de guilda
- detalhe de personagem
- abas do personagem apenas se sustentarem leitura util do perfil

Resultado esperado:
- dominio de guildas/personagem fica navegavel e alimentado por dados locais deterministas

### 7. Loja

Obrigatorio:
- pagina principal da loja
- catalogo local
- planos premium locais
- inventario/resumo local do que o usuario possui quando isso impactar o uso da loja
- simulacao local deterministica para fluxos de compra que precisem existir no produto

Resultado esperado:
- loja abre, lista itens e executa fluxos aprovados sem dependencia externa

### 8. Marketplace/ALZ

Obrigatorio:
- listagem de anuncios
- fluxo de compra
- fluxo de venda
- minhas ofertas
- minhas compras/pedidos
- status do pedido
- aceite de termos do marketplace
- perfil basico do vendedor
- validacao local de personagem para compra/venda quando o fluxo exigir
- simulacao local deterministica de pagamento, confirmacao e liquidacao

Resultado esperado:
- o dominio ALZ funciona localmente de ponta a ponta com comportamento previsivel

### 9. Notificacoes

Obrigatorio:
- indicador de notificacoes
- listagem local de notificacoes do usuario
- marcar como lida
- marcar todas como lidas se mantiver baixo custo de implementacao

Resultado esperado:
- notificacoes do usuario existem e funcionam em cima de dados locais

### 10. Admin

Obrigatorio:
- dashboard admin minimo
- visao geral resumida
- lista de contas
- lista de pedidos
- lista de disputas
- operacoes administrativas minimas para suporte ao marketplace/ALZ e a conta local
- ajuste basico de cash/saldo e configuracao basica de taxa de mercado, se estes controles continuarem necessarios para o fluxo final

Resultado esperado:
- existe um admin enxuto, util e suficiente para operar o produto final local

## Funcionalidades Opcionais

Estas funcionalidades podem entrar apenas se forem de baixo custo, coerentes com o produto final e nao aumentarem complexidade estrutural desnecessaria.

### Publico
- Termos de Uso
- Politica de Privacidade
- alguns blocos secundarios da home que so reforcem a comunicacao principal

### Area do usuario
- pagina de premium dentro da conta
- pagina de loja dentro da conta
- transferencia entre usuarios, desde que a consistencia local fique segura
- pagina de doacao apenas como simulacao local clara
- caixas de insignias e colecao de insignias como stub local, se agregarem valor real

### Rankings
- widgets extras na home, como campeao semanal e corredores, desde que consolidem o dominio e nao criem subproduto paralelo

### Loja
- caixas, loot boxes, badges e extensores como stub local
- streamer packages se ainda fizerem sentido no produto final e forem simples de manter

### Marketplace/ALZ
- media de preco, historico de preco e fee settings visiveis para o usuario se forem realmente usados
- simulacoes administrativas de pagamento apenas se ajudarem teste e operacao local

### Admin
- visao de seguranca local reduzida e somente se trouxer valor operacional real
- vendas da loja, pacotes e relatorios resumidos, apenas se sustentarem decisao dentro do produto minimo

### Seed/demo
- scripts ou rotas internas de seed somente para inicializacao e reset local controlado

## Funcionalidades Removidas

### Dominios inteiros removidos
- enquetes
- mercado de servicos
- TG ao vivo
- classes, builds, dungeons, lore e guias fora do recorte final
- variantes visuais alternativas de home e experiencia paralela

### Estrutura e tecnologia removidas
- Base44
- Supabase
- Deno functions do legado
- React Router
- Vite como base da aplicacao final
- clientes `src/api/*` do legado
- providers duplicados de autenticacao
- wrappers temporarios e aliases legados

### Operacao e diagnostico removidos
- security center legado inchado
- relatorios `.md.jsx`
- dashboards de auditoria historica
- verificadores de deploy do legado
- probes de bridge, import, health e smoke do legado
- scans e ferramentas operacionais que nao fazem parte do produto final local

### Conteudo e artefatos removidos
- paginas `*Export`
- stubs de exportacao
- arquivos vazios
- funcoes duplicadas por alias de nome
- sementes gigantes do legado que nao forem necessarias no dataset local final
- analytics remoto e rastreamento legado

## Stubs Locais Aprovados

Os seguintes comportamentos podem existir como simulacao local deterministica, sem depender de rede externa:
- pagamentos e confirmacoes da loja
- pagamento e liquidacao do marketplace/ALZ
- badges, caixas, mystery boxes e extensores, se forem mantidos
- sementes de usuarios, personagens, guildas, rankings, listings, pedidos e notificacoes
- adaptadores locais para comportamentos antes ligados a Bridge ou EFI

## Definicao Formal de "100% Funcional Localmente"

O projeto sera considerado 100% funcional localmente somente quando todos os pontos abaixo forem verdadeiros ao mesmo tempo:

1. o repositorio final sobe localmente com `pnpm`
2. a aplicacao roda em Next.js com TypeScript
3. nao existe dependencia funcional de Base44, Supabase, Deno ou servicos remotos para os fluxos do produto
4. autenticacao de usuario funciona localmente
5. autenticacao admin funciona localmente
6. os dados obrigatorios do produto vem de persistencia local e seeds locais
7. home publica, area do usuario, rankings, guildas/personagem, loja, marketplace/ALZ, notificacoes e admin funcionam localmente
8. qualquer comportamento que substitua integracao externa roda como simulacao local deterministica
9. lint, typecheck, testes unitarios obrigatorios e testes E2E obrigatorios passam no stack final
10. build final passa sem imports, dependencias ou pastas legadas necessarias para execucao

## Decisao de Escopo por Dominio

- `publico`: obrigatorio, com superficie reduzida
- `auth usuario`: obrigatorio
- `auth admin`: obrigatorio
- `conta`: obrigatorio, com partes simplificadas e partes opcionais
- `rankings`: obrigatorio, consolidado
- `guildas/personagem`: obrigatorio
- `loja`: obrigatorio, com simulacoes locais aprovadas
- `marketplace/ALZ`: obrigatorio e central
- `notificacoes`: obrigatorio
- `admin`: obrigatorio, mas enxuto
- `seed/demo`: permitido apenas como apoio interno local
- `shared`: somente o que sustentar o app final
- `remocao`: fora do produto final

## Regra de Corte

Se uma funcionalidade nao estiver listada nesta etapa como obrigatoria, opcional ou stub local aprovado, ela nao entra no produto final.

