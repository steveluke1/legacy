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
    const { adminToken, q, page = 1, pageSize = 20 } = await req.json();

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

    // Get all accounts
    let accounts = await base44.asServiceRole.entities.GameAccount.list('-created_date');

    // Filter by search query
    if (q) {
      const query = q.toLowerCase();
      accounts = accounts.filter(acc => 
        acc.id.toLowerCase().includes(query) ||
        (acc.username && acc.username.toLowerCase().includes(query)) ||
        (acc.email && acc.email.toLowerCase().includes(query))
      );
    }

    const total = accounts.length;
    const skip = (page - 1) * pageSize;
    const items = accounts.slice(skip, skip + pageSize);

    return Response.json({
      success: true,
      items: items.map(acc => ({
        id: acc.id,
        username: acc.username,
        email: acc.email,
        cash_balance: acc.cash_balance || 0,
        created_at: acc.created_date
      })),
      page,
      pageSize,
      total
    });

  } catch (error) {
    console.error('List accounts error:', error);
    return Response.json({
      success: false,
      error: 'Erro ao listar contas'
    }, { status: 500 });
  }
});