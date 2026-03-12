import React from 'react';
import { isCriticalEntity, getCriticalEntityError, SECURE_FUNCTION_UNAVAILABLE } from './securityConfig';

/**
 * FAIL-CLOSED GUARD
 * 
 * Wraps admin data-fetching logic to prevent direct entity access for critical entities.
 * If function is unavailable (404), shows security message instead of falling back.
 * 
 * Usage:
 * const { data, error } = useFailClosedQuery({
 *   queryKey: ['admin-critical-data'],
 *   secureFn: async () => {
 *     return await base44.functions.invoke('admin_getSecureData', {...});
 *   },
 *   entityFallback: async () => {
 *     return await base44.asServiceRole.entities.CriticalEntity.list();
 *   },
 *   isCritical: true
 * });
 */

export function useFailClosedGuard(entityName) {
  const critical = isCriticalEntity(entityName);
  
  if (!critical) {
    return { isCritical: false };
  }

  return {
    isCritical: true,
    error: getCriticalEntityError(entityName),
    unavailableMessage: SECURE_FUNCTION_UNAVAILABLE
  };
}

export function shouldBlockDirectAccess(entityName) {
  return isCriticalEntity(entityName);
}