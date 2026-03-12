// functions/alz_getQuote.js
// LEGACY WRAPPER - Use alzGetQuote instead
// Kept for backward compatibility only

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json();
  
  // Delegate to canonical camelCase function
  const result = await base44.functions.invoke('alzGetQuote', body);
  
  return Response.json(result.data);
});