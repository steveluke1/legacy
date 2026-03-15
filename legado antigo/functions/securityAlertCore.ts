/**
 * Security Alert Core Logic (P5A + P5B) — FLAT FILE (DEPLOY SAFE)
 * Shared business logic for both cron-triggered and admin-triggered alert dispatch
 * Supports: Email (P5A) + Discord (P5B)
 * 
 * CRITICAL: This file is flat (functions/securityAlertCore.js) to ensure Base44 deployment includes it.
 * DO NOT move to subfolders like _shared/ as it breaks deployment.
 */

import { hashString } from './securityHelpers.js';

const BUILD_SIGNATURE = 'P0-FLAT-IMPORT-FIX-20251225-01';
const SEVERITY_ORDER = { low: 1, medium: 2, high: 3, critical: 4 };

/**
 * Run security alert dispatch
 * @param {object} base44 - Base44 client (with asServiceRole)
 * @param {object} opts - Options
 * @param {string} opts.source - Source of trigger ("cron" | "admin_test")
 * @param {boolean} opts.force - Force send (skip cooldown/digest checks)
 * @param {number} opts.lookbackMinutes - Lookback window (default: 10)
 * @param {string} opts.correlationId - Correlation ID for logging
 * @returns {Promise<{ok: boolean, data?: object, error?: object}>}
 */
export async function runSecurityAlertDispatch(base44, opts = {}) {
  const {
    source = 'unknown',
    force = false,
    lookbackMinutes: lookbackMinutesOpt,
    correlationId = `dispatch-${Date.now()}`
  } = opts;
  
  try {
    // 1. Determine enabled channels
    const channelsRaw = Deno.env.get('SECURITY_ALERT_CHANNELS') || 'email';
    const enabledChannels = channelsRaw.split(',').map(c => c.trim().toLowerCase()).filter(Boolean);
    
    const emailTo = Deno.env.get('SECURITY_ALERT_EMAIL_TO');
    const discordWebhook = Deno.env.get('SECURITY_ALERT_DISCORD_WEBHOOK_URL');
    
    const shouldSendEmail = enabledChannels.includes('email') && emailTo && emailTo.trim() !== '';
    const shouldSendDiscord = enabledChannels.includes('discord') && discordWebhook && discordWebhook.trim() !== '';
    
    if (!shouldSendEmail && !shouldSendDiscord) {
      console.error(`[securityAlertCore:${correlationId}] MISCONFIG: No channels configured`);
      
      await logSecurityEvent(base44.asServiceRole, {
        event_type: 'ALERT_MISSING_ENV',
        severity: 'high',
        actor_type: 'system',
        route: 'securityAlertCore',
        metadata: {
          missing: 'SECURITY_ALERT_EMAIL_TO or SECURITY_ALERT_DISCORD_WEBHOOK_URL',
          channels: channelsRaw,
          source,
          correlation_id: correlationId
        }
      });
      
      return {
        ok: false,
        error: {
          code: 'MISCONFIG',
          message: 'Nenhum canal de alerta configurado (email ou Discord).'
        },
        meta: {
          build_signature: BUILD_SIGNATURE,
          correlation_id: correlationId
        }
      };
    }
    
    // 2. Determine severity threshold
    const minSeverityRaw = Deno.env.get('SECURITY_ALERT_MIN_SEVERITY') || 'high';
    const minSeverity = ['low', 'medium', 'high', 'critical'].includes(minSeverityRaw) ? minSeverityRaw : 'high';
    const minSeverityLevel = SEVERITY_ORDER[minSeverity];
    
    // 3. Determine lookback window
    const lookbackMinutes = Math.min(
      Math.max(parseInt(lookbackMinutesOpt || Deno.env.get('SECURITY_ALERT_LOOKBACK_MINUTES') || '10', 10), 1),
      60
    );
    
    // 4. Load recent SecurityEvents
    const allEvents = await base44.asServiceRole.entities.SecurityEvent.list('-created_date', 200);
    
    const cutoffTime = new Date(Date.now() - lookbackMinutes * 60 * 1000);
    const recentEvents = allEvents.filter(evt => {
      const eventTime = new Date(evt.created_date);
      return eventTime >= cutoffTime && SEVERITY_ORDER[evt.severity] >= minSeverityLevel;
    });
    
    console.log(`[securityAlertCore:${correlationId}] Found ${recentEvents.length} events (threshold: ${minSeverity}, lookback: ${lookbackMinutes}min, source: ${source})`);
    
    if (recentEvents.length === 0) {
      return {
        ok: true,
        data: {
          sent: false,
          skipped: true,
          reason: 'no_events',
          threshold: minSeverity,
          lookback_minutes: lookbackMinutes,
          source,
          build_signature: BUILD_SIGNATURE,
          correlation_id: correlationId
        }
      };
    }
    
    // 5. Prepare channel state
    const stateRecords = await base44.asServiceRole.entities.SecurityAlertState.filter({ key: 'security-alerts' }, undefined, 1);
    let state = stateRecords.length > 0 ? stateRecords[0] : null;
    
    const now = new Date();
    const cooldownMinutes = Math.max(parseInt(Deno.env.get('SECURITY_ALERT_COOLDOWN_MINUTES') || '30', 10), 1);
    
    const currentDigest = await computeDigest(recentEvents);
    
    // Check per-channel cooldown and digest
    const emailCanSend = shouldSendEmail && (force || checkChannelCanSend(state, 'email', currentDigest, now, cooldownMinutes));
    const discordCanSend = shouldSendDiscord && (force || checkChannelCanSend(state, 'discord', currentDigest, now, cooldownMinutes));
    
    if (!emailCanSend && !discordCanSend) {
      const reason = !force && state?.cooldown_until && new Date(state.cooldown_until) > now ? 'cooldown' : 'duplicate_digest';
      console.log(`[securityAlertCore:${correlationId}] Skipped: ${reason}`);
      return {
        ok: true,
        data: {
          sent: false,
          skipped: true,
          reason,
          cooldown_until: state?.cooldown_until,
          threshold: minSeverity,
          lookback_minutes: lookbackMinutes,
          source,
          build_signature: BUILD_SIGNATURE,
          correlation_id: correlationId
        }
      };
    }
    
    // 6. Prepare alert content
    const maxEvents = Math.max(parseInt(Deno.env.get('SECURITY_ALERT_MAX_EVENTS') || '25', 10), 1);
    const topEvents = recentEvents.slice(0, maxEvents);
    
    const channelResults = {
      email: { attempted: false, sent: false, failed: false },
      discord: { attempted: false, sent: false, failed: false }
    };
    
    // 7. Send via Email (if enabled and can send)
    if (emailCanSend) {
      channelResults.email.attempted = true;
      
      const subject = `[SEGURANÇA] Alerta ${minSeverity.toUpperCase()} — Legacy of Nevareth`;
      const fromName = Deno.env.get('SECURITY_ALERT_FROM_NAME') || 'Legacy of Nevareth - Segurança';
      const body = composeEmailBody(topEvents, minSeverity, lookbackMinutes, source, correlationId);
      
      const emailRecipients = emailTo.split(',').map(e => e.trim()).filter(Boolean);
      let emailSentCount = 0;
      
      for (const recipient of emailRecipients) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            from_name: fromName,
            to: recipient,
            subject,
            body
          });
          console.log(`[securityAlertCore:${correlationId}] Email sent to recipient ${emailSentCount + 1}`);
          emailSentCount++;
        } catch (emailError) {
          console.error(`[securityAlertCore:${correlationId}] Failed to send email:`, emailError.message);
        }
      }
      
      if (emailSentCount > 0) {
        channelResults.email.sent = true;
      } else {
        channelResults.email.failed = true;
      }
    }
    
    // 8. Send via Discord (if enabled and can send)
    if (discordCanSend) {
      channelResults.discord.attempted = true;
      
      try {
        await sendDiscordWebhook(discordWebhook, topEvents, minSeverity, lookbackMinutes, source, correlationId);
        console.log(`[securityAlertCore:${correlationId}] Discord webhook sent`);
        channelResults.discord.sent = true;
      } catch (discordError) {
        console.error(`[securityAlertCore:${correlationId}] Failed to send Discord webhook:`, discordError.message);
        channelResults.discord.failed = true;
      }
    }
    
    // 9. Persist state (per channel)
    const newDigest = await computeDigest(recentEvents);
    const cooldownUntil = new Date(now.getTime() + cooldownMinutes * 60 * 1000);
    
    const stateData = {
      key: 'security-alerts',
      last_sent_at: now.toISOString(),
      last_event_created_date: recentEvents[0]?.created_date || now.toISOString(),
      last_event_id: recentEvents[0]?.id || '',
      last_digest: newDigest,
      cooldown_until: cooldownUntil.toISOString()
    };
    
    // Update email-specific fields
    if (channelResults.email.sent) {
      stateData.last_email_sent_at = now.toISOString();
      stateData.last_email_digest = newDigest;
      stateData.cooldown_email_until = cooldownUntil.toISOString();
    }
    
    // Update discord-specific fields
    if (channelResults.discord.sent) {
      stateData.last_discord_sent_at = now.toISOString();
      stateData.last_discord_digest = newDigest;
      stateData.cooldown_discord_until = cooldownUntil.toISOString();
    }
    
    if (state) {
      await base44.asServiceRole.entities.SecurityAlertState.update(state.id, stateData);
    } else {
      await base44.asServiceRole.entities.SecurityAlertState.create(stateData);
    }
    
    // 10. Log event
    const channelsSent = [];
    if (channelResults.email.sent) channelsSent.push('email');
    if (channelResults.discord.sent) channelsSent.push('discord');
    
    if (channelsSent.length > 0) {
      await logSecurityEvent(base44.asServiceRole, {
        event_type: 'SECURITY_ALERT_SENT',
        severity: 'medium',
        actor_type: 'system',
        route: 'securityAlertCore',
        metadata: {
          count: topEvents.length,
          threshold: minSeverity,
          lookback_minutes: lookbackMinutes,
          channels_sent: channelsSent.join(','),
          source,
          correlation_id: correlationId
        }
      });
    }
    
    console.log(`[securityAlertCore:${correlationId}] Alert sent via ${channelsSent.join(', ')}`);
    
    return {
      ok: true,
      data: {
        sent: channelsSent.length > 0,
        count: topEvents.length,
        threshold: minSeverity,
        lookback_minutes: lookbackMinutes,
        cooldown_until: cooldownUntil.toISOString(),
        channels_sent: channelsSent,
        channels_attempted: enabledChannels,
        email_sent: channelResults.email.sent,
        discord_sent: channelResults.discord.sent,
        source,
        build_signature: BUILD_SIGNATURE,
        correlation_id: correlationId
      }
    };
    
  } catch (error) {
    console.error(`[securityAlertCore:${correlationId}] ERROR:`, error.message);
    
    return {
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao processar alerta de segurança.'
      },
      meta: {
        build_signature: BUILD_SIGNATURE,
        correlation_id: correlationId
      }
    };
  }
}

/**
 * Compute digest of events for idempotency
 */
async function computeDigest(events) {
  const parts = events.map(evt => 
    `${evt.id}:${evt.severity}:${evt.event_type}:${(evt.metadata?.message || '').substring(0, 120)}`
  );
  const combined = parts.join('|');
  return await hashString(combined);
}

/**
 * Compose email body (PT-BR)
 */
function composeEmailBody(events, threshold, lookbackMinutes, source, correlationId) {
  const lines = [];
  
  lines.push('='.repeat(60));
  lines.push('ALERTA DE SEGURANÇA — Legacy of Nevareth');
  lines.push('='.repeat(60));
  lines.push('');
  lines.push(`Timestamp: ${new Date().toISOString()}`);
  lines.push(`Origem: ${source}`);
  lines.push(`Threshold: ${threshold.toUpperCase()}`);
  lines.push(`Lookback: ${lookbackMinutes} minutos`);
  lines.push(`Eventos detectados: ${events.length}`);
  lines.push(`Correlation ID: ${correlationId}`);
  lines.push('');
  lines.push('='.repeat(60));
  lines.push('EVENTOS');
  lines.push('='.repeat(60));
  lines.push('');
  
  events.forEach((evt, idx) => {
    lines.push(`[${idx + 1}] ${evt.severity.toUpperCase()} — ${evt.event_type}`);
    lines.push(`    Data: ${new Date(evt.created_date).toLocaleString('pt-BR')}`);
    lines.push(`    Ator: ${evt.actor_type}`);
    
    if (evt.route) {
      lines.push(`    Rota: ${evt.route}`);
    }
    
    if (evt.ip_hash) {
      lines.push(`    IP Hash: ${evt.ip_hash.substring(0, 8)}***`);
    }
    
    if (evt.actor_id_hash) {
      lines.push(`    Actor ID: ${evt.actor_id_hash.substring(0, 6)}***`);
    }
    
    if (evt.metadata) {
      const meta = JSON.stringify(evt.metadata).substring(0, 200);
      lines.push(`    Meta: ${meta}${meta.length >= 200 ? '...' : ''}`);
    }
    
    lines.push('');
  });
  
  lines.push('='.repeat(60));
  lines.push('AÇÃO RECOMENDADA');
  lines.push('='.repeat(60));
  lines.push('');
  lines.push('1. Acesse o painel administrativo: Admin → Centro de Segurança');
  lines.push('2. Revise os eventos listados acima');
  lines.push('3. Verifique variáveis de ambiente e configurações');
  lines.push('4. Revise rate limits ativos e top offenders');
  lines.push('5. Execute scan de exposição se necessário');
  lines.push('');
  lines.push('Este é um alerta automático. Para mais detalhes, consulte o Centro de Segurança.');
  lines.push('');
  lines.push(`Build: ${BUILD_SIGNATURE}`);
  
  return lines.join('\n');
}

/**
 * Check if channel can send (cooldown + digest)
 */
function checkChannelCanSend(state, channel, currentDigest, now, cooldownMinutes) {
  if (!state) return true;
  
  const cooldownField = `cooldown_${channel}_until`;
  const digestField = `last_${channel}_digest`;
  
  // Check cooldown
  if (state[cooldownField]) {
    const cooldownUntil = new Date(state[cooldownField]);
    if (now < cooldownUntil) {
      return false;
    }
  }
  
  // Check digest
  if (state[digestField] === currentDigest) {
    return false;
  }
  
  return true;
}

/**
 * Send Discord webhook (sanitized PT-BR)
 */
async function sendDiscordWebhook(webhookUrl, events, threshold, lookbackMinutes, source, correlationId) {
  const color = threshold === 'critical' ? 15158332 : threshold === 'high' ? 15105570 : 16776960; // Red, Orange, Yellow
  
  const fields = events.slice(0, 5).map((evt, idx) => ({
    name: `${idx + 1}. ${evt.severity.toUpperCase()} — ${evt.event_type}`,
    value: `Ator: ${evt.actor_type}\nRota: ${evt.route || 'N/A'}\nData: ${new Date(evt.created_date).toLocaleString('pt-BR')}`,
    inline: false
  }));
  
  const embed = {
    title: `🚨 ALERTA DE SEGURANÇA — ${threshold.toUpperCase()}`,
    description: `**${events.length} eventos detectados** nos últimos ${lookbackMinutes} minutos\nOrigem: ${source}`,
    color,
    fields,
    footer: {
      text: `Build: ${BUILD_SIGNATURE} | Correlation ID: ${correlationId.substring(0, 16)}***`
    },
    timestamp: new Date().toISOString()
  };
  
  const payload = {
    username: 'Legacy of Nevareth - Segurança',
    embeds: [embed]
  };
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Discord webhook failed: ${response.status} ${errorText.substring(0, 100)}`);
  }
}

/**
 * Log security event (simplified wrapper)
 */
async function logSecurityEvent(base44ServiceClient, eventData) {
  try {
    await base44ServiceClient.entities.SecurityEvent.create(eventData);
  } catch (error) {
    console.error('[securityAlertCore] Failed to log event:', error.message);
  }
}