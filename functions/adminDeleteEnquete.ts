import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { verify } from 'npm:djwt@3.0.2';
import { crypto } from 'https://deno.land/std@0.224.0/crypto/mod.ts';

async function verifyJWT(token, secret) {
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
    const body = await req.json();
    const { adminToken, id, hardDelete } = body;

    // Verify admin JWT
    if (!adminToken) {
      return Response.json({ success: false, error: 'Token não fornecido' }, { status: 401 });
    }

    const jwtSecret = Deno.env.get('ADMIN_JWT_SECRET') || 'admin-secret-change-me';
    try {
      await verifyJWT(adminToken, jwtSecret);
    } catch {
      return Response.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    if (!id) {
      return Response.json({ success: false, error: 'ID não fornecido' }, { status: 400 });
    }

    // Check if enquete exists
    const existing = await base44.asServiceRole.entities.Enquete.filter({ id });
    if (!existing || existing.length === 0) {
      // Idempotent - already deleted
      return Response.json({ success: true, message: 'Enquete já removida' });
    }

    if (hardDelete) {
      // Hard delete - completely remove the record
      await base44.asServiceRole.entities.Enquete.delete(id);
      return Response.json({ 
        success: true, 
        message: 'Enquete excluída permanentemente' 
      });
    } else {
      // Soft delete - set status to CLOSED
      await base44.asServiceRole.entities.Enquete.update(id, {
        status: 'CLOSED'
      });
      return Response.json({ 
        success: true, 
        message: 'Enquete encerrada com sucesso' 
      });
    }

  } catch (error) {
    console.error('Admin delete enquete error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});