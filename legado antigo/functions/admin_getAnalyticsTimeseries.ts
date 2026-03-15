import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { verify } from 'npm:djwt@3.0.2';
import { crypto } from 'https://deno.land/std@0.224.0/crypto/mod.ts';

async function verifyAdminJWT(token, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  return await verify(token, key);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { adminToken, rangeDays = 30 } = await req.json();

    if (!adminToken) {
      return Response.json({
        success: false,
        error: 'Acesso negado.'
      }, { status: 401 });
    }

    const jwtSecret = Deno.env.get('ADMIN_JWT_SECRET') || 'admin-secret-change-me';
    
    try {
      await verifyAdminJWT(adminToken, jwtSecret);
    } catch (e) {
      return Response.json({
        success: false,
        error: 'Acesso negado.'
      }, { status: 401 });
    }

    // Generate mock data for demonstration
    const accountsByDay = [];
    const charactersByDay = [];
    const onlineByHour = [];

    const now = new Date();
    
    // Last 30 days data
    for (let i = rangeDays - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      accountsByDay.push({
        date: dateStr,
        value: Math.floor(Math.random() * 50) + 10
      });
      
      charactersByDay.push({
        date: dateStr,
        value: Math.floor(Math.random() * 80) + 20
      });
    }

    // Last 24 hours online data
    for (let i = 23; i >= 0; i--) {
      const ts = new Date(now);
      ts.setHours(ts.getHours() - i);
      
      onlineByHour.push({
        ts: ts.toISOString(),
        value: Math.floor(Math.random() * 100) + 50
      });
    }

    return Response.json({
      success: true,
      series: {
        accountsByDay,
        charactersByDay,
        onlineByHour
      },
      isTestData: true
    });

  } catch (error) {
    console.error('Analytics timeseries error:', error);
    return Response.json({
      success: false,
      error: 'Erro ao buscar timeseries'
    }, { status: 500 });
  }
});