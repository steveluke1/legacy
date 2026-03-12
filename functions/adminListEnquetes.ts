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
    const { adminToken, search, status, sort, page = 1, pageSize = 50 } = await req.json();

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

    // Build query
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    // Fetch all enquetes
    let enquetes = await base44.asServiceRole.entities.Enquete.list('-created_date', 1000);

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      enquetes = enquetes.filter(e => 
        e.title?.toLowerCase().includes(searchLower) || 
        e.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (status && status !== 'all') {
      enquetes = enquetes.filter(e => e.status === status);
    }

    // Apply sort
    if (sort === 'oldest') {
      enquetes = enquetes.reverse();
    }

    // Calculate pagination
    const total = enquetes.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = enquetes.slice(startIndex, endIndex);

    return Response.json({
      success: true,
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });

  } catch (error) {
    console.error('Admin list enquetes error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});