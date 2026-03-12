/**
 * Market Helpers
 * Funções auxiliares para o marketplace ALZ
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

export function safeParseJson(text) {
  if (!text || typeof text !== 'string') return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function generateCorrelationId() {
  return `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function writeLedgerEntry(base44, { entryType, orderId, listingId, lockId, actor, actorUserId, amountBrl, alzAmount, metadata, correlationId }) {
  const entryId = generateId('ledger');
  
  await base44.asServiceRole.entities.MarketplaceLedger.create({
    entry_id: entryId,
    entry_type: entryType,
    order_id: orderId || null,
    listing_id: listingId || null,
    lock_id: lockId || null,
    actor,
    actor_user_id: actorUserId || null,
    amount_brl: amountBrl || null,
    alz_amount: alzAmount || null,
    metadata: metadata || {},
    correlation_id: correlationId
  });
  
  return entryId;
}

export async function writeAuditLog(base44, { action, severity = 'info', message, data, correlationId }) {
  const logId = generateId('log');
  
  await base44.asServiceRole.entities.MarketplaceAuditLog.create({
    log_id: logId,
    action,
    severity,
    message,
    data: data || {},
    correlation_id: correlationId
  });
  
  return logId;
}

export async function getMarketConfig(base44) {
  try {
    const configs = await base44.asServiceRole.entities.MarketConfig.filter({ slug: 'global' }, undefined, 1);
    if (configs.length > 0) {
      return configs[0];
    }
    
    // Create default config
    const defaultConfig = {
      slug: 'global',
      market_fee_percent: 1.5,
      pix_mode: 'mock',
      split_mode: 'mock',
      updated_by_admin_id: 'system',
      updated_at: new Date().toISOString(),
      notes: { created: 'auto', source: 'default' }
    };
    
    await base44.asServiceRole.entities.MarketConfig.create(defaultConfig);
    return defaultConfig;
  } catch (error) {
    // Fallback to default
    return {
      slug: 'global',
      market_fee_percent: 1.5,
      pix_mode: 'mock',
      split_mode: 'mock'
    };
  }
}

export function validateCPF(cpf) {
  if (!cpf) return false;
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  // Basic validation - all same digits
  if (/^(\d)\1+$/.test(cleaned)) return false;
  return true;
}

export function validatePixKey(key) {
  if (!key || typeof key !== 'string') return false;
  return key.trim().length > 0;
}