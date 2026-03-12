import { base44 } from '@/api/base44Client';
import { buildFunnelFromEntities } from './dataBuilders/buildFunnelFromEntities';
import { buildStoreSalesFromEntities } from './dataBuilders/buildStoreSalesFromEntities';
import { buildStreamerPackagesFromEntities } from './dataBuilders/buildStreamerPackagesFromEntities';
import { buildAccountsFromEntities } from './dataBuilders/buildAccountsFromEntities';
import { buildEnquetesFromEntities } from './dataBuilders/buildEnquetesFromEntities';

/**
 * Admin Data Gateway
 * 
 * Provides robust data fetching with function-first + entities-fallback pattern.
 * 
 * @param {string} key - Data key (funnelSummary, funnelTimeseries, storeSales, etc.)
 * @param {object} params - Query parameters
 * @param {string} token - Admin token
 * @returns {Promise<object>} { success: true, ...data, notes: { source, ... } }
 */
export async function fetchAdminData({ key, params = {}, token }) {
  // Auth check
  if (!token) {
    throw new Error('Não autorizado');
  }

  // Try function endpoint first
  try {
    const functionData = await tryFunctionEndpoint(key, params, token);
    if (functionData) {
      return {
        ...functionData,
        success: true,
        notes: {
          source: 'function',
          functionEndpoint: getFunctionEndpoint(key)
        }
      };
    }
  } catch (error) {
    // If 401/403, throw immediately (auth issue)
    if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Não autorizado')) {
      throw error;
    }
    
    // Otherwise, log and continue to fallback
    console.warn(`[AdminDataGateway] Function endpoint failed for ${key}:`, error.message);
  }

  // Fallback to entities
  const isDebugMode = typeof window !== 'undefined' && 
    (window.__ADMIN_DEBUG__ === true || localStorage.getItem('admin_debug') === '1');
  
  if (isDebugMode) {
    console.info(`[AdminDataGateway] Using entities fallback for ${key}`);
  }
  
  try {
    const entitiesData = await tryEntitiesFallback(key, params);
    return {
      ...entitiesData,
      success: true,
      notes: {
        ...entitiesData.notes,
        source: 'entities',
        message: 'Modo compatível: dados carregados diretamente do banco'
      }
    };
  } catch (error) {
    console.error(`[AdminDataGateway] Entities fallback also failed for ${key}:`, error);
    throw new Error('Não foi possível carregar os dados. Tente novamente.');
  }
}

/**
 * Try to fetch from function endpoint
 */
async function tryFunctionEndpoint(key, params, token) {
  const endpoint = getFunctionEndpoint(key);
  if (!endpoint) return null;

  const isDebugMode = typeof window !== 'undefined' && 
    (window.__ADMIN_DEBUG__ === true || localStorage.getItem('admin_debug') === '1');

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(params)
    });

    // If 404, quietly return null (expected in preview)
    if (response.status === 404) {
      if (isDebugMode) {
        console.debug(`[AdminDataGateway] Function ${endpoint} not found (404) - using fallback`);
      }
      return null;
    }

    const text = await response.text();
    if (!text || text.trim() === '') {
      if (isDebugMode) {
        console.debug(`[AdminDataGateway] Function ${endpoint} returned empty body - using fallback`);
      }
      return null;
    }

    // Try to parse JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      if (isDebugMode) {
        console.debug(`[AdminDataGateway] Function ${endpoint} returned invalid JSON - using fallback`);
      }
      return null;
    }

    // If 401/403, throw immediately
    if (response.status === 401 || response.status === 403) {
      throw new Error('Não autorizado. Faça login novamente.');
    }

    // If server error (500+), warn
    if (response.status >= 500) {
      console.warn(`[AdminDataGateway] Function ${endpoint} returned ${response.status} - using fallback`);
      return null;
    }

    // If response not ok but not 404/500+, treat as failure
    if (!response.ok) {
      if (isDebugMode) {
        console.debug(`[AdminDataGateway] Function ${endpoint} returned ${response.status} - using fallback`);
      }
      return null;
    }

    return data;
  } catch (error) {
    // Network errors or auth errors
    if (error.message.includes('Não autorizado')) {
      throw error;
    }
    
    if (isDebugMode) {
      console.debug(`[AdminDataGateway] Function ${endpoint} fetch failed:`, error.message);
    }
    return null;
  }
}

/**
 * Get function endpoint for a given key
 */
function getFunctionEndpoint(key) {
  const endpoints = {
    funnelSummary: '/api/admin_getFunnelSummary',
    funnelTimeseries: '/api/admin_getFunnelTimeseries',
    storeSales: '/api/admin_getStoreSales',
    streamerPackages: '/api/admin_listStreamerPackages',
    accounts: null, // Will use entities only
    enquetes: null // Will use entities only
  };
  return endpoints[key] || null;
}

/**
 * Fallback to entities
 */
async function tryEntitiesFallback(key, params) {
  switch (key) {
    case 'funnelSummary':
      return await buildFunnelFromEntities({ type: 'summary', ...params });
    
    case 'funnelTimeseries':
      return await buildFunnelFromEntities({ type: 'timeseries', ...params });
    
    case 'storeSales':
      return await buildStoreSalesFromEntities(params);
    
    case 'streamerPackages':
      return await buildStreamerPackagesFromEntities(params);
    
    case 'accounts':
      return await buildAccountsFromEntities(params);
    
    case 'enquetes':
      return await buildEnquetesFromEntities(params);
    
    default:
      throw new Error(`Unknown data key: ${key}`);
  }
}