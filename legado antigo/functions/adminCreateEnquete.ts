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
    const { adminToken, title, description, options, status, allowMultiple, startsAt, endsAt } = body;

    // Verify admin JWT
    if (!adminToken) {
      return Response.json({ success: false, error: 'Token não fornecido' }, { status: 401 });
    }

    const jwtSecret = Deno.env.get('ADMIN_JWT_SECRET') || 'admin-secret-change-me';
    let payload;
    try {
      payload = await verifyJWT(adminToken, jwtSecret);
    } catch {
      return Response.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    // Validation
    if (!title || title.length < 3 || title.length > 200) {
      return Response.json({ 
        success: false, 
        error: 'Título deve ter entre 3 e 200 caracteres' 
      }, { status: 400 });
    }

    if (!options || !Array.isArray(options) || options.length < 2 || options.length > 8) {
      return Response.json({ 
        success: false, 
        error: 'Deve haver entre 2 e 8 opções' 
      }, { status: 400 });
    }

    // Validate each option
    for (const opt of options) {
      if (!opt.text || opt.text.length < 1 || opt.text.length > 100) {
        return Response.json({ 
          success: false, 
          error: 'Cada opção deve ter entre 1 e 100 caracteres' 
        }, { status: 400 });
      }
    }

    // Validate dates
    if (startsAt && endsAt) {
      const start = new Date(startsAt);
      const end = new Date(endsAt);
      if (end <= start) {
        return Response.json({ 
          success: false, 
          error: 'Data de término deve ser posterior à data de início' 
        }, { status: 400 });
      }
    }

    // Add IDs to options if not present
    const optionsWithIds = options.map((opt, idx) => ({
      id: opt.id || `opt_${Date.now()}_${idx}`,
      text: opt.text.trim()
    }));

    // Initialize votesByOption
    const votesByOption = {};
    optionsWithIds.forEach(opt => {
      votesByOption[opt.id] = 0;
    });

    // Create enquete
    const enquete = await base44.asServiceRole.entities.Enquete.create({
      title: title.trim(),
      description: description?.trim() || null,
      options: optionsWithIds,
      status: status || 'ACTIVE',
      allowMultiple: allowMultiple || false,
      startsAt: startsAt || null,
      endsAt: endsAt || null,
      createdByAdminId: payload.adminUserId,
      totalVotes: 0,
      votesByOption
    });

    return Response.json({
      success: true,
      enquete
    });

  } catch (error) {
    console.error('Admin create enquete error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});