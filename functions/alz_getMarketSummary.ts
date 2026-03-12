// functions/alz_getMarketSummary.js
// LEGACY WRAPPER - Use alzGetMarketSummary instead
// Kept for backward compatibility only

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  // Delegate to canonical camelCase function
  const result = await base44.functions.invoke('alzGetMarketSummary', {});
  
  return Response.json(result.data);
});