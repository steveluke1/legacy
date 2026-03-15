import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { getEfiConfig, validateEfiConfig, isEfiConfigured, getEfiBaseUrl, getAccessToken, redact } from './_lib/efiClient.js';

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Admin auth check
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Não autorizado - apenas admins' }, { status: 403 });
    }

    const config = getEfiConfig();
    const validation = validateEfiConfig();
    
    const result = {
      success: validation.configured,
      env: config.env,
      baseUrl: getEfiBaseUrl(config.env),
      configured: validation.configured,
      missingVars: validation.missing,
      webhookPath: config.webhookPath,
      webhookSecured: !!config.webhookSharedSecret,
      webhookIpFilterEnabled: config.webhookIpAllowlist.length > 0,
      debugMode: config.debug,
      timeMs: Date.now() - startTime,
      checks: {
        envVars: validation.configured,
        oauth: false,
        mTLS: false
      },
      credentials: {
        // Redacted info only
        clientId: config.clientId ? redact(config.clientId) : null,
        pixKey: config.pixKey ? redact(config.pixKey) : null,
        hasCert: !!config.certPemB64,
        hasKey: !!config.keyPemB64
      }
    };

    // If configured, test OAuth
    if (validation.configured) {
      try {
        const token = await getAccessToken();
        result.checks.oauth = !!token;
        result.checks.mTLS = true;
      } catch (error) {
        result.checks.oauth = false;
        result.checks.mTLS = false;
        result.oauthError = error.message;
      }
    }

    // Check function deployment
    try {
      const functions = await testFunctionDeployment(base44);
      result.functions = functions;
    } catch (error) {
      result.functions = { error: error.message };
    }

    result.timeMs = Date.now() - startTime;

    return Response.json(result);

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
      timeMs: Date.now() - startTime
    }, { status: 500 });
  }
});

async function testFunctionDeployment(base44) {
  const critical = [
    'market_getConfig',
    'buyer_createOrder',
    'market_createPixChargeForAlzOrder',
    'efi_pixWebhook',
    'delivery_run'
  ];

  const results = {};

  for (const funcName of critical) {
    try {
      // Try to invoke with minimal payload to check if deployed
      const response = await base44.functions.invoke(funcName, { __healthCheck: true });
      results[funcName] = 'deployed';
    } catch (error) {
      if (error.message?.includes('Deployment does not exist') || error.message?.includes('404')) {
        results[funcName] = 'not_deployed';
      } else {
        results[funcName] = 'deployed'; // If it errors for other reasons, it exists
      }
    }
  }

  return results;
}