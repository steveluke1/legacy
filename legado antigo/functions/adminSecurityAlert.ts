import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { verifyAdminToken } from './authHelpers.js';
import {
  requireMethods,
  readJsonWithLimit,
  jsonResponse,
  errorResponse,
  applyRateLimit,
  logSecurityEvent,
  getClientIp,
  hashIp
} from './securityHelpers.js';
import { runSecurityAlertDispatch } from './securityAlertCore.js';

const BUILD_SIGNATURE = 'P0-FLAT-IMPORT-FIX-20251225-01';

Deno.serve(async (req) => {
  const correlationId = `admin-alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const base44 = createClientFromRequest(req);
    
    // 1. Method check (GET and POST allowed)
    const methodError = await requireMethods(req, ['GET', 'POST'], base44.asServiceRole, 'adminSecurityAlert');
    if (methodError) return methodError;
    
    // 2. Rate limiting (30 req/min per IP)
    const clientIp = getClientIp(req);
    const ipHash = await hashIp(clientIp);
    const bucketKey = `adminSecurityAlert:${ipHash}`;
    
    const rateLimitResult = await applyRateLimit(
      base44.asServiceRole,
      bucketKey,
      30,
      60,
      'adminSecurityAlert',
      req,
      { correlation_id: correlationId }
    );
    if (!rateLimitResult.ok) return rateLimitResult.response;
    
    // 3. Admin auth verification (BOTH GET and POST)
    let adminUser;
    try {
      adminUser = await verifyAdminToken(req, base44);
    } catch (error) {
      console.warn(`[adminSecurityAlert:${correlationId}] UNAUTHORIZED: ${error.message}`);
      
      await logSecurityEvent({
        base44ServiceClient: base44.asServiceRole,
        event_type: 'ADMIN_ALERT_UNAUTHORIZED',
        severity: 'medium',
        actor_type: 'anon',
        ip: clientIp,
        user_agent: req.headers.get('user-agent') || 'unknown',
        route: 'adminSecurityAlert',
        metadata: {
          method: req.method,
          correlation_id: correlationId
        }
      });
      
      return errorResponse('UNAUTHORIZED', 'Não autorizado.', 401, {
        build_signature: BUILD_SIGNATURE,
        correlation_id: correlationId
      });
    }
    
    console.log(`[adminSecurityAlert:${correlationId}] ${req.method} admin=${adminUser.adminId}`);
    
    // 4. Handle GET → redirect to POST with action=status
    if (req.method === 'GET') {
      // For backward compatibility, GET returns status
      const payload = { action: 'status' };
      // Fall through to POST handler
      req.method = 'POST';
      req._adminSecurityAlertPayload = payload;
    }
    
    // 5. Handle POST (actions)
    let payload;
    
    if (req._adminSecurityAlertPayload) {
      // GET redirected to POST
      payload = req._adminSecurityAlertPayload;
    } else {
      const bodyResult = await readJsonWithLimit(req, 32 * 1024);
      if (!bodyResult.ok) return bodyResult.response;
      payload = bodyResult.data || {};
    }
    
    const action = payload.action;
    
    // ACTION: status (ALWAYS succeeds, even if env vars missing)
    if (action === 'status') {
      const channelsRaw = Deno.env.get('SECURITY_ALERT_CHANNELS') || 'email';
      const enabledChannels = channelsRaw.split(',').map(c => c.trim().toLowerCase()).filter(Boolean);
      
      const envStatus = {
        security_alert_email_to_present: !!Deno.env.get('SECURITY_ALERT_EMAIL_TO'),
        security_alert_discord_webhook_present: !!Deno.env.get('SECURITY_ALERT_DISCORD_WEBHOOK_URL'),
        security_alert_channels: channelsRaw,
        cron_secret_present: !!Deno.env.get('CRON_SECRET'),
        admin_jwt_secret_present: !!Deno.env.get('ADMIN_JWT_SECRET'),
        security_alert_min_severity_present: !!Deno.env.get('SECURITY_ALERT_MIN_SEVERITY'),
        security_alert_lookback_minutes_present: !!Deno.env.get('SECURITY_ALERT_LOOKBACK_MINUTES'),
        security_alert_cooldown_minutes_present: !!Deno.env.get('SECURITY_ALERT_COOLDOWN_MINUTES'),
        security_alert_max_events_present: !!Deno.env.get('SECURITY_ALERT_MAX_EVENTS'),
        security_alert_from_name_present: !!Deno.env.get('SECURITY_ALERT_FROM_NAME')
      };
      
      // Load current state
      const stateRecords = await base44.asServiceRole.entities.SecurityAlertState.filter({ key: 'security-alerts' }, undefined, 1);
      const state = stateRecords.length > 0 ? stateRecords[0] : null;
      
      const sanitizedState = state ? {
        last_sent_at: state.last_sent_at,
        last_event_created_date: state.last_event_created_date,
        cooldown_until: state.cooldown_until,
        last_digest_preview: state.last_digest?.substring(0, 8) + '***',
        last_email_sent_at: state.last_email_sent_at,
        cooldown_email_until: state.cooldown_email_until,
        last_discord_sent_at: state.last_discord_sent_at,
        cooldown_discord_until: state.cooldown_discord_until
      } : null;
      
      // Count recent events (last 10 minutes, high+)
      const allEvents = await base44.asServiceRole.entities.SecurityEvent.list('-created_date', 100);
      const cutoffTime = new Date(Date.now() - 10 * 60 * 1000);
      const recentEventsCount = allEvents.filter(evt => {
        const eventTime = new Date(evt.created_date);
        return eventTime >= cutoffTime && (evt.severity === 'high' || evt.severity === 'critical');
      }).length;
      
      await logSecurityEvent({
        base44ServiceClient: base44.asServiceRole,
        event_type: 'ADMIN_ALERT_STATUS_VIEW',
        severity: 'low',
        actor_type: 'admin',
        actor_id_raw: adminUser.adminId,
        route: 'adminSecurityAlert',
        metadata: {
          action: 'status',
          correlation_id: correlationId
        }
      });
      
      return jsonResponse({
        ok: true,
        data: {
          env: envStatus,
          state: sanitizedState,
          recent_events_count: recentEventsCount,
          build_signature: BUILD_SIGNATURE,
          correlation_id: correlationId
        }
      }, 200);
    }
    
    // ACTION: sendTestDiscord
    if (action === 'sendTestDiscord') {
      const discordWebhook = Deno.env.get('SECURITY_ALERT_DISCORD_WEBHOOK_URL');
      
      if (!discordWebhook || discordWebhook.trim() === '') {
        return errorResponse('MISSING_DISCORD_WEBHOOK', 'Variável SECURITY_ALERT_DISCORD_WEBHOOK_URL não configurada.', 400, {
          build_signature: BUILD_SIGNATURE,
          correlation_id: correlationId
        });
      }
      
      // Send test Discord webhook
      try {
        const testPayload = {
          username: 'Legacy of Nevareth - Segurança',
          embeds: [{
            title: '🧪 TESTE DE ALERTA — Discord P5B',
            description: 'Este é um teste do sistema de alertas via Discord. Se você recebeu esta mensagem, o webhook está funcionando corretamente.',
            color: 3447003,
            fields: [
              {
                name: 'Admin',
                value: adminUser.username || adminUser.email,
                inline: true
              },
              {
                name: 'Timestamp',
                value: new Date().toLocaleString('pt-BR'),
                inline: true
              }
            ],
            footer: {
              text: `Build: ${BUILD_SIGNATURE} | Correlation ID: ${correlationId.substring(0, 16)}***`
            },
            timestamp: new Date().toISOString()
          }]
        };
        
        const response = await fetch(discordWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Discord webhook failed: ${response.status} ${errorText.substring(0, 100)}`);
        }
        
        await logSecurityEvent({
          base44ServiceClient: base44.asServiceRole,
          event_type: 'ADMIN_ALERT_DISCORD_TEST_SENT',
          severity: 'low',
          actor_type: 'admin',
          actor_id_raw: adminUser.adminId,
          route: 'adminSecurityAlert',
          metadata: {
            action: 'sendTestDiscord',
            correlation_id: correlationId
          }
        });
        
        return jsonResponse({
          ok: true,
          data: {
            sent: true,
            channel: 'discord',
            build_signature: BUILD_SIGNATURE,
            correlation_id: correlationId
          }
        }, 200);
        
      } catch (discordError) {
        return errorResponse('DISCORD_SEND_FAILED', `Erro ao enviar Discord webhook: ${discordError.message}`, 500, {
          build_signature: BUILD_SIGNATURE,
          correlation_id: correlationId
        });
      }
    }
    
    // ACTION: sendTestEmail
    if (action === 'sendTestEmail') {
      // Validate SECURITY_ALERT_EMAIL_TO
      const emailTo = Deno.env.get('SECURITY_ALERT_EMAIL_TO');
      
      if (!emailTo || emailTo.trim() === '') {
        return errorResponse('MISSING_EMAIL_TO', 'Variável SECURITY_ALERT_EMAIL_TO não configurada.', 400, {
          build_signature: BUILD_SIGNATURE,
          correlation_id: correlationId
        });
      }
      
      // Send test email
      const subject = 'ALERTA DE SEGURANÇA — Teste P5A (Legacy of Nevareth)';
      const fromName = Deno.env.get('SECURITY_ALERT_FROM_NAME') || 'Legacy of Nevareth - Segurança';
      
      const body = [
        'Este é um e-mail de teste do sistema de alertas de segurança (P5A).',
        'Se você recebeu esta mensagem, o envio por e-mail está funcionando corretamente.',
        'Nenhum dado sensível foi incluído.',
        '',
        `Timestamp: ${new Date().toISOString()}`,
        `Admin: ${adminUser.username || adminUser.email}`,
        `Correlation ID: ${correlationId}`,
        '',
        `Build: ${BUILD_SIGNATURE}`
      ].join('\n');
      
      const emailRecipients = emailTo.split(',').map(e => e.trim()).filter(Boolean);
      
      for (const recipient of emailRecipients) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            from_name: fromName,
            to: recipient,
            subject,
            body
          });
          console.log(`[adminSecurityAlert:${correlationId}] Test email sent to ${recipient}`);
        } catch (emailError) {
          console.error(`[adminSecurityAlert:${correlationId}] Failed to send to ${recipient}:`, emailError.message);
        }
      }
      
      await logSecurityEvent({
        base44ServiceClient: base44.asServiceRole,
        event_type: 'ADMIN_ALERT_TEST_SENT',
        severity: 'low',
        actor_type: 'admin',
        actor_id_raw: adminUser.adminId,
        route: 'adminSecurityAlert',
        metadata: {
          action: 'sendTestEmail',
          recipients: emailRecipients.length,
          correlation_id: correlationId
        }
      });
      
      return jsonResponse({
        ok: true,
        data: {
          sent: true,
          recipients: emailRecipients.length,
          build_signature: BUILD_SIGNATURE,
          correlation_id: correlationId
        }
      }, 200);
    }
    
    // ACTION: seedTestCriticalEvent
    if (action === 'seedTestCriticalEvent') {
      const now = new Date();
      
      const testEvent = await base44.asServiceRole.entities.SecurityEvent.create({
        event_type: 'TEST_SECURITY_ALERT',
        severity: 'critical',
        actor_type: 'admin',
        actor_id_hash: await require('./securityHelpers.js').hashString(adminUser.adminId),
        route: 'adminSecurityAlert',
        metadata: {
          action: 'seedTestCriticalEvent',
          admin: adminUser.username || adminUser.email,
          timestamp: now.toISOString(),
          correlation_id: correlationId,
          note: 'Test event for P5A verification'
        }
      });
      
      await logSecurityEvent({
        base44ServiceClient: base44.asServiceRole,
        event_type: 'ADMIN_ALERT_SEED_TEST',
        severity: 'low',
        actor_type: 'admin',
        actor_id_raw: adminUser.adminId,
        route: 'adminSecurityAlert',
        metadata: {
          action: 'seedTestCriticalEvent',
          test_event_id: testEvent.id,
          correlation_id: correlationId
        }
      });
      
      return jsonResponse({
        ok: true,
        data: {
          created: true,
          event_id: testEvent.id,
          severity: 'critical',
          event_type: 'TEST_SECURITY_ALERT',
          build_signature: BUILD_SIGNATURE,
          correlation_id: correlationId
        }
      }, 200);
    }
    
    // ACTION: runDispatchNow
    if (action === 'runDispatchNow') {
      const dispatchResult = await runSecurityAlertDispatch(base44, {
        source: 'admin_test',
        force: payload.force === true,
        lookbackMinutes: payload.lookbackMinutes,
        correlationId
      });
      
      await logSecurityEvent({
        base44ServiceClient: base44.asServiceRole,
        event_type: 'ADMIN_ALERT_DISPATCH_TRIGGERED',
        severity: 'low',
        actor_type: 'admin',
        actor_id_raw: adminUser.adminId,
        route: 'adminSecurityAlert',
        metadata: {
          action: 'runDispatchNow',
          result: dispatchResult.ok ? 'success' : 'error',
          correlation_id: correlationId
        }
      });
      
      if (dispatchResult.ok) {
        return jsonResponse({
          ok: true,
          data: dispatchResult.data,
          build_signature: BUILD_SIGNATURE
        }, 200);
      } else {
        return jsonResponse(dispatchResult, dispatchResult.error?.code === 'MISCONFIG' ? 400 : 500);
      }
    }
    
    // Unknown action
    return errorResponse('INVALID_ACTION', 'Ação inválida. Use: status, sendTestEmail, sendTestDiscord, seedTestCriticalEvent, runDispatchNow', 400, {
      build_signature: BUILD_SIGNATURE,
      correlation_id: correlationId
    });
    
  } catch (error) {
    console.error(`[adminSecurityAlert:${correlationId}] ERROR: ${error.message}`);
    return errorResponse('INTERNAL_ERROR', 'Erro interno.', 500, {
      build_signature: BUILD_SIGNATURE,
      correlation_id: correlationId
    });
  }
});