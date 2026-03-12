import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { lockAlzFromGame } from './_lib/gameIntegration.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { alz_amount, price_brl, seller_character_name } = await req.json();

    if (!alz_amount || !price_brl || !seller_character_name) {
      return Response.json({ 
        error: 'alz_amount, price_brl e seller_character_name são obrigatórios' 
      }, { status: 400 });
    }

    if (alz_amount <= 0 || price_brl <= 0) {
      return Response.json({ 
        error: 'Valores devem ser maiores que zero' 
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    const listingId = `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const lockId = `lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const idempotencyKey = `lock_${user.id}_${seller_character_name}_${alz_amount}_${Date.now()}`;

    try {
      // Lock ALZ from game
      const lockResult = await lockAlzFromGame(seller_character_name, alz_amount);
      
      if (!lockResult.success) {
        return Response.json({
          success: false,
          error: 'Falha ao bloquear ALZ do jogo. Verifique se o personagem tem ALZ suficiente.',
          details: lockResult.error
        }, { status: 400 });
      }

      // Create listing
      const listing = await base44.entities.AlzListing.create({
        listing_id: listingId,
        seller_user_id: user.id,
        seller_character_name,
        alz_amount,
        price_brl,
        status: 'active',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        created_at: now,
        notes: {
          game_lock_id: lockResult.lockId
        }
      });

      // Create lock escrow
      await base44.entities.AlzLock.create({
        lock_id: lockId,
        listing_id: listingId,
        seller_user_id: user.id,
        seller_character_name,
        alz_amount,
        status: 'locked',
        created_at: now,
        locked_at: now,
        idempotency_key: idempotencyKey
      });

      // Create ledger entry
      await base44.entities.LedgerEntry.create({
        entry_id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'ALZ_LOCK',
        ref_id: listingId,
        actor: 'seller',
        actor_id: user.id,
        amount_alz: alz_amount,
        metadata: {
          lock_id: lockId,
          character_name: seller_character_name,
          game_lock_id: lockResult.lockId
        },
        created_at: now
      });

      return Response.json({
        success: true,
        listing,
        lock_id: lockId,
        expires_at: listing.expires_at
      });

    } catch (error) {
      console.error('Error creating listing:', error);
      return Response.json({
        success: false,
        error: 'Erro ao criar anúncio. Tente novamente.',
        details: error.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in market_createAlzListing:', error);
    return Response.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
});