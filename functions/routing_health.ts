Deno.serve(async (req) => {
  return Response.json({
    ok: true,
    app_id_seen: Deno.env.get('BASE44_APP_ID') || 'unknown',
    ts: new Date().toISOString(),
    notes: 'routing_health is reachable'
  });
});