import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import jwt from 'npm:jsonwebtoken@9.0.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ 
        success: false, 
        error: 'Não autorizado' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const secret = Deno.env.get('ADMIN_JWT_SECRET');
    
    if (!secret) {
      console.error('ADMIN_JWT_SECRET not configured');
      return Response.json({ 
        success: false, 
        error: 'Erro de configuração' 
      }, { status: 500 });
    }

    try {
      jwt.verify(token, secret);
    } catch (err) {
      return Response.json({ 
        success: false, 
        error: 'Token inválido' 
      }, { status: 401 });
    }

    const { includeInactive = true } = await req.json().catch(() => ({}));

    // Fetch packages
    let packages;
    if (includeInactive) {
      packages = await base44.asServiceRole.entities.StreamerPackage.list('-created_date', 100);
    } else {
      packages = await base44.asServiceRole.entities.StreamerPackage.filter(
        { is_active: true },
        '-created_date',
        100
      );
    }

    // Sort by sort_order in memory
    packages.sort((a, b) => (b.sort_order || 0) - (a.sort_order || 0));

    return Response.json({
      success: true,
      packages
    });

  } catch (error) {
    console.error('List streamer packages error:', error);
    return Response.json({
      success: false,
      error: 'Erro ao listar pacotes'
    }, { status: 500 });
  }
});