# Etapa 1 - Resumo

Fonte oficial item a item desta etapa:
- `PHASE1_INVENTORY_CLASSIFICATION.csv`

Escopo coberto:
- `src/pages`
- `src/components`
- `src/lib`
- `src/api`
- `functions`

Gate de saida:
- nada segue para porte antes desta classificacao estar fechada e revisada.

## Resumo por classificacao
- migrar completo: 71
- migrar simplificado: 143
- remover: 319
- stub local: 99

## Resumo por dominio
- admin: 155
- auth admin: 8
- auth usuario: 26
- conta: 19
- guildas/personagem: 17
- loja: 56
- marketplace/ALZ: 109
- notificacoes: 7
- publico: 27
- rankings: 24
- remocao: 69
- seed/demo: 12
- shared: 103

## Observacao
- `migrar completo`: comportamento obrigatorio no produto final.
- `migrar simplificado`: comportamento mantido com menos superficie e menos legado.
- `stub local`: comportamento mantido apenas como simulacao local deterministica ou seed de apoio.
- `remover`: arquivo legado nao entra no produto final.
