import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { efiFetch, isEfiConfigured, getEfiConfig, logEfiError } from './_lib/efiClient.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { adminToken, app_url, allow_skip_mtls } = await req.json();

    // Verify admin authentication
    if (!adminToken) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verify admin session
    const adminSessions = await base44.asServiceRole.entities.AdminSession.filter({ 
      token: adminToken 
    });
    
    if (adminSessions.length === 0) {
      return Response.json({ error: 'Sessão admin inválida' }, { status: 403 });
    }

    if (!app_url) {
      return Response.json({ 
        error: 'app_url é obrigatório (ex: https://meuapp.com)' 
      }, { status: 400 });
    }

    if (!isEfiConfigured()) {
      return Response.json({
        success: false,
        error: 'EFI não está configurado. Configure as variáveis de ambiente primeiro.',
        required_vars: [
          'EFI_CLIENT_ID',
          'EFI_CLIENT_SECRET',
          'EFI_CERT_PEM_B64',
          'EFI_KEY_PEM_B64',
          'EFI_PIX_KEY'
        ]
      }, { status: 503 });
    }

    const config = getEfiConfig();
    const webhookUrl = `${app_url}${config.webhookPath}`;

    try {
      // Configure webhook at EFI
      const webhookConfig = {
        webhookUrl
      };

      const headers = {
        'Content-Type': 'application/json'
      };

      // Add skip mTLS header if requested (for testing/dev)
      if (allow_skip_mtls) {
        headers['x-skip-mtls-checking'] = 'true';
      }

      const response = await efiFetch(`/v2/webhook/${encodeURIComponent(config.pixKey)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(webhookConfig)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`EFI webhook config failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      // Update MarketSettings
      const settings = await base44.asServiceRole.entities.MarketSettings.filter({ 
        id: 'global' 
      });
      
      if (settings.length > 0) {
        await base44.asServiceRole.entities.MarketSettings.update(settings[0].id, {
          efi_webhook_url: webhookUrl,
          updated_at: new Date().toISOString(),
          updated_by_admin_id: adminSessions[0].admin_user_id
        });
      }

      // Log configuration
      await base44.asServiceRole.entities.SystemLog.create({
        action: 'efi_webhook_configured',
        severity: 'info',
        message: 'Webhook EFI configurado com sucesso',
        metadata: {
          webhook_url: webhookUrl,
          pix_key: config.pixKey,
          skip_mtls: allow_skip_mtls || false,
          response: result
        }
      });

      return Response.json({
        success: true,
        webhook_url: webhookUrl,
        pix_key: config.pixKey,
        configured_at: new Date().toISOString(),
        efi_response: result
      });

    } catch (efiError) {
      await logEfiError(req, 'webhook_config', efiError, { webhook_url: webhookUrl });
      
      return Response.json({
        success: false,
        error: 'Erro ao configurar webhook EFI. Verifique as credenciais e certificados.',
        details: efiError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in admin_configureEfiWebhook:', error);
    return Response.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
});