# GUIA COMPLETO DE CONFIGURAÇÃO - EFI PIX + SPLIT

## 📍 Onde Configurar

**Base44 Dashboard → Settings → Environment Variables**

⚠️ **NUNCA cole secrets no código, chat, ou commits Git.**  
✅ **Use APENAS Environment Variables no Dashboard Base44.**

---

## 🔧 Variáveis Obrigatórias

### 1. EFI_ENV
- **Valor:** `homolog` (testes) ou `production` (produção)
- **Exemplo:** `homolog`
- **Onde usar:** Define qual ambiente EFI será usado

### 2. EFI_CLIENT_ID
- **Onde obter:** Portal EFI → Aplicações → [Sua App] → Client ID
- **Formato:** `Client_Id_abc123xyz...`
- **Nota:** Diferente para homolog e production

### 3. EFI_CLIENT_SECRET
- **Onde obter:** Portal EFI → Aplicações → [Sua App] → Client Secret
- **Formato:** `Client_Secret_def456uvw...`
- **Nota:** Diferente para homolog e production

### 4. EFI_CERT_PEM_B64
**Certificado mTLS convertido para Base64**

**Como obter:**
```bash
# Linux/Mac
base64 -w 0 producao-XXX-XXX.pem > cert_base64.txt

# Windows PowerShell
$bytes = [System.IO.File]::ReadAllBytes("producao-XXX-XXX.pem")
[Convert]::ToBase64String($bytes) > cert_base64.txt
```

Cole o conteúdo do arquivo gerado (string longa, sem quebras de linha).

### 5. EFI_KEY_PEM_B64
**Chave privada mTLS convertida para Base64**

Mesmo processo do certificado, mas com o arquivo da chave privada.

### 6. EFI_PIX_KEY
- **Valor:** Chave PIX da conta EFI que receberá os pagamentos
- **Formato:** Email, CPF, CNPJ, telefone, ou chave aleatória
- **Exemplo:** `pagamentos@cabalziron.com.br`

---

## 🛡️ Variáveis Opcionais (Recomendadas)

### 7. EFI_WEBHOOK_PATH
- **Padrão:** `/api/efi_pixWebhook`
- **Quando mudar:** Raramente necessário

### 8. EFI_WEBHOOK_SHARED_SECRET
**Token de segurança para validar webhooks**

```bash
# Gerar token forte
openssl rand -hex 32
# ou
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use o **MESMO token** ao configurar o webhook no portal EFI.

### 9. EFI_WEBHOOK_IP_ALLOWLIST
- **Formato:** IPs separados por vírgula
- **Exemplo:** `200.201.202.203,200.201.202.204`
- **Onde obter:** Documentação EFI com IPs autorizados

### 10. EFI_DEBUG
- **Valores:** `0` (produção) ou `1` (debug)
- **Padrão:** `0`
- **Nota:** Logs verbose (sem expor secrets)

---

## 📋 Checklist de Configuração

### Homologação (Sandbox/Testes)

- [ ] `EFI_ENV = homolog`
- [ ] Criar aplicação no Portal EFI (ambiente sandbox)
- [ ] Copiar Client ID e Client Secret de **homologação**
- [ ] Baixar certificado e chave mTLS de **homologação**
- [ ] Converter cert e key para Base64
- [ ] Configurar chave PIX de teste
- [ ] Testar OAuth via AdminDashboard → EFI Config → Verificar Agora
- [ ] Criar cobrança de teste (R$ 0,50)
- [ ] Confirmar webhook recebe notificação

### Produção

- [ ] `EFI_ENV = production`
- [ ] Criar aplicação no Portal EFI (ambiente produção)
- [ ] Copiar Client ID e Client Secret de **produção**
- [ ] Baixar certificado e chave mTLS de **produção**
- [ ] Converter cert e key para Base64
- [ ] Configurar chave PIX REAL da conta
- [ ] Configurar webhook no portal EFI:
  - URL: `https://seudominio.com/api/efi_pixWebhook`
  - Shared Secret: valor de `EFI_WEBHOOK_SHARED_SECRET`
- [ ] Testar OAuth via AdminDashboard
- [ ] Fazer compra real de baixo valor (R$ 1,00)
- [ ] Validar split de pagamento funcionou

---

## 🔍 Como Testar

1. **Configure todas as variáveis** no Base44 Dashboard
2. Acesse **AdminDashboard → 🎛️ EFI Config**
3. Clique **"Verificar Agora"**
4. Valide todos os checks:
   - ✅ Variáveis de ambiente configuradas
   - ✅ Autenticação OAuth funcionando
   - ✅ Cliente mTLS criado
5. Acesse **AdminDashboard → 🚀 Deployment**
6. Clique **"Verificar Deployment"**
7. Valide que todas as funções estão deployed
8. Se alguma função não está deployed:
   - Vá em Code → Functions
   - Abra o arquivo da função
   - Adicione um espaço ou comentário
   - Salve (deploy automático em ~10s)

---

## ⚠️ Segurança

### DO NOT:
- ❌ Commitar secrets no código
- ❌ Colar secrets no chat ou issues
- ❌ Expor secrets em logs
- ❌ Compartilhar certificados por email

### DO:
- ✅ Usar apenas Environment Variables
- ✅ Rotacionar secrets se vazaram
- ✅ Usar shared secret no webhook
- ✅ Ativar IP allowlist
- ✅ Manter EFI_DEBUG=0 em produção
- ✅ Usar certificados diferentes para homolog/prod

### Se secrets vazaram:
1. Acesse Portal EFI imediatamente
2. Revogue a aplicação comprometida
3. Crie nova aplicação com novos secrets
4. Atualize Environment Variables no Base44

---

## 📞 Suporte e Referências

- **Documentação EFI PIX:** https://dev.efipay.com.br/docs/api-pix
- **Portal EFI:** https://sejaefi.com.br/
- **Base64 Online (emergência):** https://www.base64encode.org/
- **Suporte Base44:** Dashboard → Help

---

## 🎯 Diferenças Homolog vs Produção

| Item | Homologação | Produção |
|------|-------------|----------|
| EFI_ENV | `homolog` | `production` |
| URL Base | `api-pix-h.gerencianet.com.br` | `api.gerencianet.com.br` |
| Certificado | Sandbox cert | Production cert |
| Client ID/Secret | Sandbox credentials | Production credentials |
| Chave PIX | Teste | Real da conta |
| Valores | Qualquer (testes) | Reais |
| Webhook | Opcional | Obrigatório |

---

## 🔄 Workflow Completo

```mermaid
graph TD
    A[Configurar ENV VARS] --> B[Testar OAuth via EFI Config]
    B --> C[Deployment Check - todas funções OK?]
    C -->|Não| D[Deploy funções manualmente]
    D --> C
    C -->|Sim| E[Criar cobrança de teste]
    E --> F[Confirmar webhook recebe notificação]
    F --> G[Validar split criado]
    G --> H[GO FOR PRODUCTION]
```

---

**Última atualização:** 22/12/2025  
**Versão:** 1.0  
**Autor:** CABAL ZIRON Tech Team