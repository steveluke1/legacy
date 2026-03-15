// functions/alzGetMySellOrdersV1.js
// List authenticated user's sell orders with pagination
// VERSION: V1 - Body token auth (HS256)

const BUILD_STAMP = "alzGetMySellOrdersV1-v1-20260114";

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Manual JWT verification with HS256 (ported from auth_me.js)
async function verifyJwtHs256(token, secret) {
  const encoder = new TextEncoder();
  
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('INVALID_TOKEN_FORMAT');
  }
  
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  
  // Decode payload
  const payloadJson = atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'));
  const payload = JSON.parse(payloadJson);
  
  // Verify expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('TOKEN_EXPIRED');
  }
  
  // Verify signature
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  const signatureBytes = Uint8Array.from(
    atob(encodedSignature.replace(/-/g, '+').replace(/_/g, '/')),
    c => c.charCodeAt(0)
  );
  
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    encoder.encode(`${encodedHeader}.${encodedPayload}`)
  );
  
  if (!isValid) {
    throw new Error('INVALID_SIGNATURE');
  }
  
  return payload;
}

function safeInt(val, defaultVal, min = 1, max = Infinity) {
  const parsed = parseInt(val, 10);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return defaultVal;
  }
  return parsed;
}

Deno.serve(async (req) => {
  try {
    // Parse body safely
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return Response.json({
        ok: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Requisição inválida'
        },
        _build: BUILD_STAMP
      }, { status: 400 });
    }

    // ✅ SELF-TEST FIRST (before any auth/validation/SDK calls)
    if (body?.__selfTest === true) {
      return Response.json({
        ok: true,
        data: {
          self_test: true,
          message: 'alzGetMySellOrdersV1 is operational',
          timestamp: new Date().toISOString(),
          build: BUILD_STAMP
        },
        _build: BUILD_STAMP
      }, { status: 200 });
    }

    // Extract fields
    const { token, page, pageSize, status } = body;

    // Auth: Extract and verify token
    if (!token || typeof token !== 'string') {
      return Response.json({
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Sessão expirada. Faça login novamente.'
        },
        _build: BUILD_STAMP
      }, { status: 401 });
    }

    // Verify JWT
    const jwtSecret = Deno.env.get('JWT_SECRET');
    if (!jwtSecret) {
      console.error('[alzGetMySellOrdersV1] JWT_SECRET missing');
      return Response.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro de configuração do servidor'
        },
        _build: BUILD_STAMP
      }, { status: 500 });
    }

    let payload;
    try {
      payload = await verifyJwtHs256(token, jwtSecret);
    } catch (e) {
      const errorMsg = e.message === 'TOKEN_EXPIRED' 
        ? 'Sessão expirada. Faça login novamente.'
        : 'Sessão inválida. Faça login novamente.';
      
      return Response.json({
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: errorMsg
        },
        _build: BUILD_STAMP
      }, { status: 401 });
    }

    // Validate required claims
    if (!payload.sub) {
      return Response.json({
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Sessão inválida. Faça login novamente.'
        },
        _build: BUILD_STAMP
      }, { status: 401 });
    }

    const userId = payload.sub;
    const base44 = createClientFromRequest(req);

    // Parse pagination parameters
    const currentPage = safeInt(page, 1, 1, 1000);
    const currentPageSize = safeInt(pageSize, 20, 1, 50);

    // Build query filter
    const filter = { seller_user_id: userId };
    
    // Add status filter if provided
    if (status && status !== 'all') {
      if (Array.isArray(status)) {
        // Multiple statuses - not supported in this simple version, take first
        filter.status = status[0];
      } else {
        filter.status = status;
      }
    }

    // Query AlzSellOrder with pagination
    // Fetch pageSize + 1 to detect hasMore
    const skip = (currentPage - 1) * currentPageSize;
    const limit = currentPageSize + 1;

    const allOrders = await base44.asServiceRole.entities.AlzSellOrder.filter(
      filter,
      '-created_date',
      limit,
      skip
    );

    // Detect hasMore
    const hasMore = allOrders.length > currentPageSize;
    const items = hasMore ? allOrders.slice(0, currentPageSize) : allOrders;

    // Compute canCancel for each item
    const now = new Date();
    const itemsWithCancelInfo = items.map(order => {
      const createdAt = new Date(order.created_date);
      const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
      const canCancel = ['active', 'partial'].includes(order.status) && hoursSinceCreation >= 24;
      
      const result = {
        ...order,
        canCancel
      };

      // Add countdown info if cannot cancel yet
      if (!canCancel && ['active', 'partial'].includes(order.status)) {
        const hoursUntilCancel = Math.max(0, 24 - hoursSinceCreation);
        result.hoursUntilCancel = hoursUntilCancel;
        const cancelAvailableAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
        result.cancelAvailableAt = cancelAvailableAt.toISOString();
      }

      return result;
    });

    return Response.json({
      ok: true,
      data: {
        items: itemsWithCancelInfo,
        pagination: {
          page: currentPage,
          pageSize: currentPageSize,
          totalReturned: items.length,
          hasMore,
          nextPage: hasMore ? currentPage + 1 : null
        }
      },
      _build: BUILD_STAMP
    });

  } catch (error) {
    console.error('[alzGetMySellOrdersV1] ERROR:', error);
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Não foi possível carregar ofertas. Tente novamente.',
        detail: String(error.message || error)
      },
      _build: BUILD_STAMP
    }, { status: 500 });
  }
});