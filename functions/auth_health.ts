import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  return Response.json({
    ok: true,
    service: 'auth',
    ts: new Date().toISOString(),
    status: 'healthy'
  });
});