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

const firstNames = ['João', 'Maria', 'Pedro', 'Ana', 'Lucas', 'Julia', 'Carlos', 'Beatriz', 'Rafael', 'Fernanda'];
const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Costa', 'Pereira', 'Rodrigues', 'Alves', 'Nascimento'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { adminToken, count = 50 } = await req.json();

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

    const accounts = [];

    for (let i = 0; i < count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const username = `${firstName}${lastName}${i + 1}`;
      const email = `${username.toLowerCase()}@test.com`;
      const cashBalance = Math.floor(Math.random() * 10000);

      const account = await base44.asServiceRole.entities.GameAccount.create({
        username,
        email,
        cash_balance: cashBalance,
        is_test_account: true
      });

      accounts.push(account);
    }

    return Response.json({
      success: true,
      message: `${count} contas de teste criadas com sucesso`,
      count: accounts.length
    });

  } catch (error) {
    console.error('Seed test accounts error:', error);
    return Response.json({
      success: false,
      error: 'Erro ao criar contas de teste'
    }, { status: 500 });
  }
});