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

    const { packageId, isActive } = await req.json();

    if (!packageId) {
      return Response.json({
        success: false,
        error: 'packageId é obrigatório'
      }, { status: 400 });
    }

    // Update package
    await base44.asServiceRole.entities.StreamerPackage.update(packageId, {
      is_active: Boolean(isActive)
    });

    return Response.json({
      success: true,
      message: isActive ? 'Pacote ativado' : 'Pacote desativado'
    });

  } catch (error) {
    console.error('Toggle package active error:', error);
    return Response.json({
      success: false,
      error: 'Erro ao atualizar pacote'
    }, { status: 500 });
  }
});