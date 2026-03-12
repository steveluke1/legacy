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

    let adminData;
    try {
      adminData = jwt.verify(token, secret);
    } catch (err) {
      return Response.json({ 
        success: false, 
        error: 'Token inválido' 
      }, { status: 401 });
    }

    const { name, items, priceCash, isActive = true, sortOrder = 0, imageUrl } = await req.json();

    // Validations
    if (!name || name.trim().length < 3) {
      return Response.json({
        success: false,
        error: 'Nome do pacote deve ter pelo menos 3 caracteres'
      }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({
        success: false,
        error: 'Pacote deve ter pelo menos 1 item'
      }, { status: 400 });
    }

    for (const item of items) {
      if (!item.label || item.label.trim().length === 0) {
        return Response.json({
          success: false,
          error: 'Todos os itens devem ter um nome'
        }, { status: 400 });
      }
    }

    if (typeof priceCash !== 'number' || priceCash < 0) {
      return Response.json({
        success: false,
        error: 'Preço deve ser um número positivo'
      }, { status: 400 });
    }

    // Create package
    const packageData = {
      name: name.trim(),
      items,
      price_cash: priceCash,
      is_active: isActive,
      sort_order: sortOrder || 0,
      created_by_admin_id: adminData.adminId
    };

    if (imageUrl) {
      packageData.image_url = imageUrl;
    }

    const createdPackage = await base44.asServiceRole.entities.StreamerPackage.create(packageData);

    return Response.json({
      success: true,
      message: 'Pacote criado com sucesso',
      package: createdPackage
    });

  } catch (error) {
    console.error('Create streamer package error:', error);
    return Response.json({
      success: false,
      error: 'Erro ao criar pacote'
    }, { status: 500 });
  }
});