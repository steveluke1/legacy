// Debug-only network blocker for /entities/User/me
// Helps identify the source of unauthorized entity calls

const DEBUG_KEY = 'DEBUG_AUTH_PROBE';
const BLOCKED_PATTERN = '/entities/User/me';

export function installDebugAuthBlocker() {
  if (typeof window === 'undefined') return;
  
  // Only install if debug mode is enabled
  if (localStorage.getItem(DEBUG_KEY) !== '1') return;
  
  console.warn('[DEBUG_AUTH_PROBE] Debug auth blocker installed. Set localStorage.DEBUG_AUTH_PROBE="0" to disable.');
  
  // Intercept fetch
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    const urlString = typeof url === 'string' ? url : url?.url || '';
    
    if (urlString.includes(BLOCKED_PATTERN)) {
      console.error('[DEBUG_AUTH_PROBE] BLOCKED /entities/User/me call');
      console.error('[DEBUG_AUTH_PROBE] Stack trace:');
      console.trace();
      
      // Return synthetic 204 response
      return Promise.resolve(new Response(null, { 
        status: 204, 
        statusText: 'No Content (blocked by debug probe)' 
      }));
    }
    
    return originalFetch.apply(this, args);
  };
  
  // Intercept XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    const urlString = typeof url === 'string' ? url : String(url);
    
    if (urlString.includes(BLOCKED_PATTERN)) {
      console.error('[DEBUG_AUTH_PROBE] BLOCKED /entities/User/me XHR call');
      console.error('[DEBUG_AUTH_PROBE] Stack trace:');
      console.trace();
      
      // Abort the request
      this.abort();
      return;
    }
    
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };
}