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
    const { adminToken, id, patch } = body;

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

    // Get existing enquete
    const existing = await base44.asServiceRole.entities.Enquete.filter({ id });
    if (!existing || existing.length === 0) {
      return Response.json({ success: false, error: 'Enquete não encontrada' }, { status: 404 });
    }

    const current = existing[0];

    // Build update object
    const update = {};

    if (patch.title !== undefined) {
      if (patch.title.length < 3 || patch.title.length > 200) {
        return Response.json({ 
          success: false, 
          error: 'Título deve ter entre 3 e 200 caracteres' 
        }, { status: 400 });
      }
      update.title = patch.title.trim();
    }

    if (patch.description !== undefined) {
      update.description = patch.description?.trim() || null;
    }

    if (patch.options !== undefined) {
      if (!Array.isArray(patch.options) || patch.options.length < 2 || patch.options.length > 8) {
        return Response.json({ 
          success: false, 
          error: 'Deve haver entre 2 e 8 opções' 
        }, { status: 400 });
      }

      for (const opt of patch.options) {
        if (!opt.text || opt.text.length < 1 || opt.text.length > 100) {
          return Response.json({ 
            success: false, 
            error: 'Cada opção deve ter entre 1 e 100 caracteres' 
          }, { status: 400 });
        }
      }

      const optionsWithIds = patch.options.map((opt, idx) => ({
        id: opt.id || `opt_${Date.now()}_${idx}`,
        text: opt.text.trim()
      }));

      // Update votesByOption structure
      const newVotesByOption = {};
      optionsWithIds.forEach(opt => {
        // Preserve existing votes if option ID exists
        newVotesByOption[opt.id] = current.votesByOption?.[opt.id] || 0;
      });

      update.options = optionsWithIds;
      update.votesByOption = newVotesByOption;
    }

    if (patch.status !== undefined) {
      update.status = patch.status;
    }

    if (patch.allowMultiple !== undefined) {
      update.allowMultiple = patch.allowMultiple;
    }

    if (patch.startsAt !== undefined) {
      update.startsAt = patch.startsAt || null;
    }

    if (patch.endsAt !== undefined) {
      update.endsAt = patch.endsAt || null;
    }

    // Validate dates
    if (update.startsAt && update.endsAt) {
      const start = new Date(update.startsAt);
      const end = new Date(update.endsAt);
      if (end <= start) {
        return Response.json({ 
          success: false, 
          error: 'Data de término deve ser posterior à data de início' 
        }, { status: 400 });
      }
    }

    // Update enquete
    await base44.asServiceRole.entities.Enquete.update(id, update);

    // Fetch updated enquete
    const updated = await base44.asServiceRole.entities.Enquete.filter({ id });

    return Response.json({
      success: true,
      enquete: updated[0]
    });

  } catch (error) {
    console.error('Admin update enquete error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});