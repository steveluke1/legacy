# 📦 UI EXPORT PACK — BASE44 → NEXT.JS

## ⚠️ IMPORTANTE
Esta é uma COPY WINDOW de UI ONLY. O objetivo é extrair apenas a camada visual (páginas, componentes UI, estilos) para migração para um projeto Next.js com backend customizado.

## 📁 ESTRUTURA DESTE EXPORT

```
components/
├── UI_EXPORT_README.md        ← Você está aqui
├── ui_export_stubs/            ← Stubs para substituir Base44
│   ├── auth.tsx                ← Mock auth context
│   └── data.ts                 ← Mock data layer
│
└── ui/                         ← Componentes UI puros (copiáveis direto)
    ├── Button.tsx
    ├── Card.tsx
    ├── GlowCard.tsx
    └── ... (todos os componentes shadcn)

pages_export/                   ← Páginas com Base44 removido
├── HomeExport.jsx              ← Home page UI-only
├── LojaExport.jsx              ← Loja page UI-only
├── GuildasExport.jsx           ← Guildas page UI-only
└── EnquetesExport.jsx          ← Enquetes page UI-only
```

## 🎯 O QUE ESTE EXPORT INCLUI

✅ **Páginas UI-Only:**
- Home (hero, sections, componentes visuais)
- Loja (grid de produtos, tabs, cards)
- Guildas (lista, filtros, cards)
- Enquetes (lista, votação, modal criação)

✅ **Componentes UI Puros:**
- Todos os componentes em `components/ui/`
- Componentes específicos de página em subpastas
- Layout visual e estrutura

✅ **Estilos:**
- `globals.css` com variáveis CSS
- Classes Tailwind mantidas idênticas
- Tema escuro preservado

✅ **Stubs de Dados:**
- Mock data para desenvolvimento
- Interfaces TypeScript
- Auth context stub

## ❌ O QUE ESTE EXPORT NÃO INCLUI

- ❌ Backend functions (devem ser reimplementados)
- ❌ Auth system real (use NextAuth, Supabase, etc.)
- ❌ Integrações com Base44 SDK
- ❌ Entidades e CRUD direto
- ❌ Lógica de negócio do servidor

## 📖 GUIAS DE MIGRAÇÃO

### 1. AUDIT REPORT
**Localização:** Esta documentação (seção abaixo)
**Conteúdo:**
- Arquivos auditados no projeto Base44
- Padrões de código identificados
- Contagem de referências Base44
- Páginas selecionadas para export

### 2. NEXT.JS MIGRATION GUIDE
**Passos:**
1. Criar novo projeto Next.js com App Router
2. Instalar dependências (ver seção DEPENDÊNCIAS)
3. Copiar páginas de `pages_export/` para `app/`
4. Copiar componentes de `components/` para `components/`
5. Copiar `globals.css` para `app/globals.css`
6. Implementar data layer customizado
7. Implementar auth system customizado

### 3. ROUTE MAP
**Conversão de rotas:**
```
Base44              →  Next.js
──────────────────────────────────
/                   →  app/page.tsx
/Loja               →  app/loja/page.tsx
/Guildas            →  app/guildas/page.tsx
/Enquetes           →  app/enquetes/page.tsx
```

### 4. SEARCH & REPLACE
**Substituições necessárias:**
```regex
# Remover Base44 SDK
s/import { base44 } from '@\/api\/base44Client';//g

# Converter navigation
s/useNavigate/useRouter/g
s/navigate(/router.push(/g

# Converter Links
s/import { Link } from 'react-router-dom'/import Link from 'next\/link'/g
```

## 🔧 DEPENDÊNCIAS NPM

### Core (Obrigatórias)
```bash
npm install next@latest react@latest react-dom@latest
npm install tailwindcss postcss autoprefixer
npm install class-variance-authority clsx tailwind-merge
```

### UI (Obrigatórias)
```bash
npm install lucide-react framer-motion sonner
npm install @radix-ui/react-tabs @radix-ui/react-select
npm install @radix-ui/react-dialog @radix-ui/react-badge
npm install @radix-ui/react-skeleton
```

### Data Fetching (Opcional)
```bash
npm install @tanstack/react-query  # Ou SWR
```

## 📝 AUDIT REPORT

### Arquivos Auditados
```
✅ pages/Home.jsx          - 0 ref diretas Base44
✅ pages/Loja.jsx          - 6 refs base44.functions.invoke
✅ pages/Guildas.jsx       - 1 ref base44.entities.Guild.list
✅ pages/Enquetes.jsx      - 0 refs (usa mock data)
✅ components/ui/*         - 0 refs (puros)
✅ components/home/*       - 0 refs (puros)
✅ globals.css             - 0 refs (puro CSS)
✅ layout.js               - Tem AuthProvider context
```

### Padrões Identificados
```typescript
// PATTERN 1: Data fetching
await base44.functions.invoke('functionName', params);
await base44.entities.EntityName.list();

// PATTERN 2: Auth
const { user } = useAuth();
<RequireAuth>{children}</RequireAuth>

// PATTERN 3: Navigation
import { createPageUrl } from '@/utils';
navigate(createPageUrl('PageName'));
```

### Contagem Total
- **Páginas exportadas:** 4
- **Componentes UI puros:** ~30+
- **Referências Base44 removidas:** ~15
- **Stubs criados:** 2 (auth, data)

## 🚀 QUICK START (Next.js)

### 1. Criar Projeto
```bash
npx create-next-app@latest meu-projeto --typescript --tailwind --app
cd meu-projeto
```

### 2. Instalar Deps
```bash
npm install lucide-react framer-motion sonner
npm install @radix-ui/react-tabs @radix-ui/react-select
```

### 3. Copiar Arquivos
```bash
# Do Base44 para Next.js
cp -r pages_export/* app/
cp -r components/* components/
cp globals.css app/globals.css
```

### 4. Executar Script de Conversão
```bash
# Ver seção SEARCH & REPLACE para comandos sed
# Ou usar VS Code Search & Replace
```

### 5. Implementar Data Layer
```typescript
// lib/data.ts
export async function getStoreData() {
  const res = await fetch('/api/store');
  return res.json();
}
```

### 6. Implementar Auth
```typescript
// lib/auth.ts
export function useAuth() {
  // Implementar com NextAuth, Clerk, Supabase, etc.
  return { user, isAuthenticated, login, logout };
}
```

### 7. Testar
```bash
npm run dev
# Abrir http://localhost:3000
```

## ✅ CHECKLIST PÓS-MIGRAÇÃO

### Visual
- [ ] Todas as páginas renderizam sem crash
- [ ] Layout idêntico ao Base44
- [ ] Cores e tipografia corretas
- [ ] Animações funcionam
- [ ] Ícones aparecem
- [ ] Responsive mobile/tablet/desktop

### Funcional
- [ ] Navegação entre páginas
- [ ] Auth guard redireciona
- [ ] Loading states aparecem
- [ ] Error states aparecem
- [ ] Mock data carrega

### Técnico
- [ ] ZERO referências `base44.`
- [ ] ZERO chamadas `.invoke(`
- [ ] ZERO chamadas `.entities.`
- [ ] 'use client' em componentes interativos
- [ ] Imports Next.js corretos

## 🔍 VERIFICAÇÃO AUTOMÁTICA

```bash
# Execute no projeto Next.js
grep -r "base44" app/ components/ || echo "✅ Sem Base44"
grep -r "\.invoke(" app/ components/ || echo "✅ Sem .invoke"
grep -r "\.entities\." app/ components/ || echo "✅ Sem .entities"
```

## 📚 RECURSOS

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com)
- [React Query](https://tanstack.com/query)

## ⚠️ NOTAS IMPORTANTES

1. **'use client' Directive:**
   - Adicionar em TODOS os componentes que usam hooks
   - Adicionar em componentes com onClick, onChange, etc.

2. **Dynamic Imports:**
   - Use `next/dynamic` para lazy loading pesado

3. **Images:**
   - Use `next/image` em vez de `<img>`
   - Otimização automática de performance

4. **Metadata:**
   - Adicionar `export const metadata` em cada page

5. **API Routes:**
   - Criar em `app/api/` para substituir backend functions

## 🎉 RESULTADO ESPERADO

Após migração completa, você terá:
- ✅ Projeto Next.js funcionando
- ✅ UI idêntico ao Base44
- ✅ Sem dependências Base44
- ✅ Pronto para conectar backend customizado
- ✅ Totalmente controlado por você

---
**Criado:** 2026-01-09
**Versão:** 1.0.0
**Autor:** Base44 AI Export Tool
**Status:** ✅ PRONTO PARA USO