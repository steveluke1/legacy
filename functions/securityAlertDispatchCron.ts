import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BUILD_SIGNATURE = 'P0-SELF-CONTAINED-20251225-0003';
const SEVERITY_ORDER = { low: 1, medium: 2, high: 3, critical: 4 };

// ============================================================================
// INLINED HELPERS
// ============================================================================

function getClientIp(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',');
    return ips[0].trim();
  }
  
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  
  return 'unknown';
}

async function hashIp(ip) {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16);
}

async function hashString(value) {
  if (!value || typeof value !== 'string') return 'null';
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16);
}

async function rateLimitCheck(base44ServiceRole, bucketKey, limit, windowSeconds, blockSeconds) {
  const now = new Date();
  const nowMs = now.getTime();
  
  const buckets = await base44ServiceRole.entities.RateLimitBucket.filter({ key: bucketKey }, undefined, 1);
  
  if (buckets.length === 0) {
    await base44ServiceRole.entities.RateLimitBucket.create({
      key: bucketKey,
      window_start: now.toISOString(),
      count: 1,
      updated_at_iso: now.toISOString()
    });
    
    return { allowed: true, remaining: limit - 1 };
  }
  
  const bucket = buckets[0];
  
  if (bucket.blocked_until) {
    const blockedUntil = new Date(bucket.blocked_until);
    if (blockedUntil.getTime() > nowMs) {
      return {
        allowed: false,
        remaining: 0,
        blockedUntil: bucket.blocked_until
      };
    }
  }
  
  const windowStart = new Date(bucket.window_start);
  const windowEnd = windowStart.getTime() + (windowSeconds * 1000);
  
  if (nowMs > windowEnd) {
    await base44ServiceRole.entities.RateLimitBucket.update(bucket.id, {
      window_start: now.toISOString(),
      count: 1,
      blocked_until: null,
      updated_at_iso: now.toISOString()
    });
    
    return { allowed: true, remaining: limit - 1 };
  }
  
  const newCount = bucket.count + 1;
  
  if (newCount > limit) {
    const blockUntil = new Date(nowMs + (blockSeconds * 1000));
    await base44ServiceRole.entities.RateLimitBucket.update(bucket.id, {
      count: newCount,
      blocked_until: blockUntil.toISOString(),
      updated_at_iso: now.toISOString()
    });
    
    return {
      allowed: false,
      remaining: 0,
      blockedUntil: blockUntil.toISOString()
    };
  }
  
  await base44ServiceRole.entities.RateLimitBucket.update(bucket.id, {
    count: newCount,
    updated_at_iso: now.toISOString()
  });
  
  return { allowed: true, remaining: limit - newCount };
}

function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return {};
  
  const sensitive = ['password', 'secret', 'token', 'key', 'email', 'pix', 'cpf', 'hash', 'salt'];
  const sanitized = {};
  
  for (const [key, value] of Object.entries(metadata)) {
    const keyLower = key.toLowerCase();
    if (sensitive.some(s => keyLower.includes(s))) continue;
    
    if (typeof value === 'string' && value.length > 200) {
      sanitized[key] = value.substring(0, 200) + '...';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = '[object]';
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

async function logSecurityEvent({
  base44ServiceClient,
  event_type,
  severity,
  actor_type,
  actor_id_raw,
  ip,
  user_agent,
  route,
  metadata
}) {
  try {
    const eventData = {
      event_type,
      severity,
      actor_type
    };
    
    if (actor_id_raw) {
      eventData.actor_id_hash = await hashString(actor_id_raw);
    }
    
    if (ip) {
      eventData.ip_hash = await hashIp(ip);
    }
    
    if (user_agent) {
      eventData.user_agent_hash = await hashString(user_agent);
    }
    
    if (route) {
      eventData.route = route;
    }
    
    if (metadata) {
      eventData.metadata = sanitizeMetadata(metadata);
    }
    
    await base44ServiceClient.entities.SecurityEvent.create(eventData);
  } catch (error) {
    console.error('[logSecurityEvent] Failed:', error.message);
  }
}

function jsonResponse(data, status = 200) {
  const headers = {
    'content-type': 'application/json',
    'x-content-type-options': 'nosniff',
    'cache-control': 'no-store'
  };
  
  return new Response(JSON.stringify(data), { status, headers });
}

function errorResponse(code, messagePTBR, status, metaSafe = {}) {
  const body = {
    ok: false,
    error: {
      code,
      message: messagePTBR
    }
  };
  
  if (Object.keys(metaSafe).length > 0) {
    body.meta = metaSafe;
  }
  
  return jsonResponse(body, status);
}

async function requireMethods(req, allowedMethods, base44ServiceClient, route) {
  if (!allowedMethods.includes(req.method)) {
    if (base44ServiceClient && route) {
      try {
        const clientIp = getClientIp(req);
        const userAgent = req.headers.get('user-agent') || 'unknown';
        
        await logSecurityEvent({
          base44ServiceClient,
          event_type: 'METHOD_NOT_ALLOWED',
          severity: 'low',
          actor_type: 'anon',
          ip: clientIp,
          user_agent: userAgent,
          route,
          metadata: {
            method: req.method,
            allowed: allowedMethods.join(',')
          }
        });
      } catch (logError) {
        console.error('[requireMethods] Logging failed:', logError.message);
      }
    }
    
    return errorResponse('METHOD_NOT_ALLOWED', 'Método não permitido.', 405);
  }
  
  return null;
}

async function readJsonWithLimit(req, maxBytes) {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return { ok: true, data: null };
  }
  
  try {
    const buffer = await req.arrayBuffer();
    
    if (buffer.byteLength > maxBytes) {
      return {
        ok: false,
        response: errorResponse('PAYLOAD_TOO_LARGE', 'Payload muito grande.', 413)
      };
    }
    
    const text = new TextDecoder().decode(buffer);
    
    if (!text || text.trim() === '') {
      return { ok: true, data: {} };
    }
    
    const data = JSON.parse(text);
    return { ok: true, data };
    
  } catch (parseError) {
    return {
      ok: false,
      response: errorResponse('INVALID_JSON', 'JSON inválido.', 400)
    };
  }
}

function constantTimeEquals(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function requireHeaderSecret(req, headerName, envVarName, eventTypeOnFail, base44ServiceClient, route) {
  const expectedSecret = Deno.env.get(envVarName);
  
  if (!expectedSecret || expectedSecret.trim() === '') {
    if (base44ServiceClient && route) {
      try {
        await logSecurityEvent({
          base44ServiceClient,
          event_type: eventTypeOnFail || 'CONFIG_ERROR',
          severity: 'high',
          actor_type: 'system',
          route,
          metadata: {
            missing_env: envVarName
          }
        });
      } catch (logError) {
        console.error('[requireHeaderSecret] Logging failed:', logError.message);
      }
    }
    
    return {
      ok: false,
      response: errorResponse('CONFIG_ERROR', 'Configuração de segurança ausente no servidor.', 500)
    };
  }
  
  const providedSecret = req.headers.get(headerName);
  
  if (!providedSecret || !constantTimeEquals(providedSecret, expectedSecret)) {
    if (base44ServiceClient && route) {
      try {
        const clientIp = getClientIp(req);
        const userAgent = req.headers.get('user-agent') || 'unknown';
        
        await logSecurityEvent({
          base44ServiceClient,
          event_type: eventTypeOnFail || 'UNAUTHORIZED',
          severity: 'medium',
          actor_type: 'anon',
          ip: clientIp,
          user_agent: userAgent,
          route,
          metadata: {
            header_name: headerName,
            header_present: !!providedSecret
          }
        });
      } catch (logError) {
        console.error('[requireHeaderSecret] Logging failed:', logError.message);
      }
    }
    
    return {
      ok: false,
      response: errorResponse('UNAUTHORIZED', 'Não autorizado.', 401)
    };
  }
  
  return { ok: true };
}

async function applyRateLimit(base44ServiceClient, bucketKey, limit, windowSeconds, route, req, metaSafe = {}) {
  const rateLimit = await rateLimitCheck(base44ServiceClient, bucketKey, limit, windowSeconds, 300);
  
  if (!rateLimit.allowed) {
    try {
      const clientIp = getClientIp(req);
      const userAgent = req.headers.get('user-agent') || 'unknown';
      
      await logSecurityEvent({
        base44ServiceClient,
        event_type: 'RATE_LIMIT_EXCEEDED',
        severity: 'low',
        actor_type: 'anon',
        ip: clientIp,
        user_agent: userAgent,
        route,
        metadata: {
          ...metaSafe,
          blocked_until: rateLimit.blockedUntil
        }
      });
    } catch (logError) {
      console.error('[applyRateLimit] Logging failed:', logError.message);
    }
    
    return {
      ok: false,
      response: errorResponse('RATE_LIMIT_EXCEEDED', 'Muitas requisições.', 429, metaSafe)
    };
  }
  
  return { ok: true };
}

// ============================================================================
// ALERT DISPATCH CORE (INLINED)
// ============================================================================

async function computeDigest(events) {
  const parts = events.map(evt => 
    `${evt.id}:${evt.severity}:${evt.event_type}:${(evt.metadata?.message || '').substring(0, 120)}`
  );
  const combined = parts.join('|');
  return await hashString(combined);
}

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

function checkChannelCanSend(state, channel, currentDigest, now, cooldownMinutes) {
  if (!state) return true;
  
  const cooldownField = `cooldown_${channel}_until`;
  const digestField = `last_${channel}_digest`;
  
  if (state[cooldownField]) {
    const cooldownUntil = new Date(state[cooldownField]);
    if (now < cooldownUntil) {
      return false;
    }
  }
  
  if (state[digestField] === currentDigest) {
    return false;
  }
  
  return true;
}

async function sendDiscordWebhook(webhookUrl, events, threshold, lookbackMinutes, source, correlationId) {
  const color = threshold === 'critical' ? 15158332 : threshold === 'high' ? 15105570 : 16776960;
  
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

async function runSecurityAlertDispatch(base44, opts = {}) {
  const {
    source = 'unknown',
    force = false,
    lookbackMinutes: lookbackMinutesOpt,
    correlationId = `dispatch-${Date.now()}`
  } = opts;
  
  try {
    const channelsRaw = Deno.env.get('SECURITY_ALERT_CHANNELS') || 'email';
    const enabledChannels = channelsRaw.split(',').map(c => c.trim().toLowerCase()).filter(Boolean);
    
    const emailTo = Deno.env.get('SECURITY_ALERT_EMAIL_TO');
    const discordWebhook = Deno.env.get('SECURITY_ALERT_DISCORD_WEBHOOK_URL');
    
    const shouldSendEmail = enabledChannels.includes('email') && emailTo && emailTo.trim() !== '';
    const shouldSendDiscord = enabledChannels.includes('discord') && discordWebhook && discordWebhook.trim() !== '';
    
    if (!shouldSendEmail && !shouldSendDiscord) {
      console.error(`[runSecurityAlertDispatch:${correlationId}] MISCONFIG: No channels configured`);
      
      await logSecurityEvent({
        base44ServiceClient: base44.asServiceRole,
        event_type: 'ALERT_MISSING_ENV',
        severity: 'high',
        actor_type: 'system',
        route: 'securityAlertDispatchCron',
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
    
    const minSeverityRaw = Deno.env.get('SECURITY_ALERT_MIN_SEVERITY') || 'high';
    const minSeverity = ['low', 'medium', 'high', 'critical'].includes(minSeverityRaw) ? minSeverityRaw : 'high';
    const minSeverityLevel = SEVERITY_ORDER[minSeverity];
    
    const lookbackMinutes = Math.min(
      Math.max(parseInt(lookbackMinutesOpt || Deno.env.get('SECURITY_ALERT_LOOKBACK_MINUTES') || '10', 10), 1),
      60
    );
    
    const allEvents = await base44.asServiceRole.entities.SecurityEvent.list('-created_date', 200);
    
    const cutoffTime = new Date(Date.now() - lookbackMinutes * 60 * 1000);
    const recentEvents = allEvents.filter(evt => {
      const eventTime = new Date(evt.created_date);
      return eventTime >= cutoffTime && SEVERITY_ORDER[evt.severity] >= minSeverityLevel;
    });
    
    console.log(`[runSecurityAlertDispatch:${correlationId}] Found ${recentEvents.length} events (threshold: ${minSeverity}, lookback: ${lookbackMinutes}min, source: ${source})`);
    
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
    
    const stateRecords = await base44.asServiceRole.entities.SecurityAlertState.filter({ key: 'security-alerts' }, undefined, 1);
    let state = stateRecords.length > 0 ? stateRecords[0] : null;
    
    const now = new Date();
    const cooldownMinutes = Math.max(parseInt(Deno.env.get('SECURITY_ALERT_COOLDOWN_MINUTES') || '30', 10), 1);
    
    const currentDigest = await computeDigest(recentEvents);
    
    const emailCanSend = shouldSendEmail && (force || checkChannelCanSend(state, 'email', currentDigest, now, cooldownMinutes));
    const discordCanSend = shouldSendDiscord && (force || checkChannelCanSend(state, 'discord', currentDigest, now, cooldownMinutes));
    
    if (!emailCanSend && !discordCanSend) {
      const reason = !force && state?.cooldown_until && new Date(state.cooldown_until) > now ? 'cooldown' : 'duplicate_digest';
      console.log(`[runSecurityAlertDispatch:${correlationId}] Skipped: ${reason}`);
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
    
    const maxEvents = Math.max(parseInt(Deno.env.get('SECURITY_ALERT_MAX_EVENTS') || '25', 10), 1);
    const topEvents = recentEvents.slice(0, maxEvents);
    
    const channelResults = {
      email: { attempted: false, sent: false, failed: false },
      discord: { attempted: false, sent: false, failed: false }
    };
    
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
          console.log(`[runSecurityAlertDispatch:${correlationId}] Email sent to recipient ${emailSentCount + 1}`);
          emailSentCount++;
        } catch (emailError) {
          console.error(`[runSecurityAlertDispatch:${correlationId}] Failed to send email:`, emailError.message);
        }
      }
      
      if (emailSentCount > 0) {
        channelResults.email.sent = true;
      } else {
        channelResults.email.failed = true;
      }
    }
    
    if (discordCanSend) {
      channelResults.discord.attempted = true;
      
      try {
        await sendDiscordWebhook(discordWebhook, topEvents, minSeverity, lookbackMinutes, source, correlationId);
        console.log(`[runSecurityAlertDispatch:${correlationId}] Discord webhook sent`);
        channelResults.discord.sent = true;
      } catch (discordError) {
        console.error(`[runSecurityAlertDispatch:${correlationId}] Failed to send Discord webhook:`, discordError.message);
        channelResults.discord.failed = true;
      }
    }
    
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
    
    if (channelResults.email.sent) {
      stateData.last_email_sent_at = now.toISOString();
      stateData.last_email_digest = newDigest;
      stateData.cooldown_email_until = cooldownUntil.toISOString();
    }
    
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
    
    const channelsSent = [];
    if (channelResults.email.sent) channelsSent.push('email');
    if (channelResults.discord.sent) channelsSent.push('discord');
    
    if (channelsSent.length > 0) {
      await logSecurityEvent({
        base44ServiceClient: base44.asServiceRole,
        event_type: 'SECURITY_ALERT_SENT',
        severity: 'medium',
        actor_type: 'system',
        route: 'securityAlertDispatchCron',
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
    
    console.log(`[runSecurityAlertDispatch:${correlationId}] Alert sent via ${channelsSent.join(', ')}`);
    
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
    console.error(`[runSecurityAlertDispatch:${correlationId}] ERROR:`, error.message);
    
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

// ============================================================================
// MAIN FUNCTION
// ============================================================================

Deno.serve(async (req) => {
  const correlationId = `cron-dispatch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const base44 = createClientFromRequest(req);
    
    const methodError = await requireMethods(req, ['POST'], base44.asServiceRole, 'securityAlertDispatchCron');
    if (methodError) return methodError;
    
    const clientIp = getClientIp(req);
    const ipHash = await hashIp(clientIp);
    const bucketKey = `securityAlertDispatchCron:${ipHash}`;
    
    const rateLimitResult = await applyRateLimit(
      base44.asServiceRole,
      bucketKey,
      60,
      60,
      'securityAlertDispatchCron',
      req,
      { correlation_id: correlationId }
    );
    if (!rateLimitResult.ok) return rateLimitResult.response;
    
    const authResult = await requireHeaderSecret(
      req,
      'x-cron-secret',
      'CRON_SECRET',
      'CRON_DISPATCH_UNAUTHORIZED',
      base44.asServiceRole,
      'securityAlertDispatchCron'
    );
    if (!authResult.ok) return authResult.response;
    
    console.log(`[securityAlertDispatchCron:${correlationId}] Authorized`);
    
    const bodyResult = await readJsonWithLimit(req, 32 * 1024);
    if (!bodyResult.ok) return bodyResult.response;
    
    const payload = bodyResult.data || {};
    
    await logSecurityEvent({
      base44ServiceClient: base44.asServiceRole,
      event_type: 'SECURITY_ALERT_DISPATCH_STARTED',
      severity: 'low',
      actor_type: 'system',
      route: 'securityAlertDispatchCron',
      metadata: {
        source: 'cron',
        correlation_id: correlationId
      }
    });
    
    const result = await runSecurityAlertDispatch(base44, {
      source: 'cron',
      force: payload.force === true,
      lookbackMinutes: payload.lookbackMinutes,
      correlationId
    });
    
    await logSecurityEvent({
      base44ServiceClient: base44.asServiceRole,
      event_type: 'SECURITY_ALERT_DISPATCH_COMPLETED',
      severity: 'low',
      actor_type: 'system',
      route: 'securityAlertDispatchCron',
      metadata: {
        result: result.ok ? 'success' : 'error',
        channels_sent: result.data?.channels_sent?.join(',') || 'none',
        correlation_id: correlationId
      }
    });
    
    if (result.ok) {
      return jsonResponse({
        ok: true,
        data: {
          dispatched: result.data.sent,
          channels_attempted: result.data.channels_attempted || [],
          channels_sent: result.data.channels_sent || [],
          email_sent: result.data.email_sent || false,
          discord_sent: result.data.discord_sent || false,
          findings_count: result.data.count || 0,
          skipped: result.data.skipped || false,
          skip_reason: result.data.reason || null,
          build_signature: BUILD_SIGNATURE,
          correlation_id: correlationId
        }
      }, 200);
    } else {
      const status = result.error?.code === 'MISCONFIG' ? 400 : 500;
      return jsonResponse({
        ok: false,
        error: result.error,
        meta: {
          build_signature: BUILD_SIGNATURE,
          correlation_id: correlationId
        }
      }, status);
    }
    
  } catch (error) {
    console.error(`[securityAlertDispatchCron:${correlationId}] ERROR: ${error.message}`);
    return errorResponse('INTERNAL_ERROR', 'Erro ao processar dispatch de alerta.', 500, {
      build_signature: BUILD_SIGNATURE,
      correlation_id: correlationId
    });
  }
});