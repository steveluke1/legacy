import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { generateCorrelationId, safeParseJson } from './_shared/marketHelpers.js';

Deno.serve(async (req) => {
  const correlationId = generateCorrelationId();
  
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({
        success: false,
        error: 'Não autorizado',
        correlationId
      }, {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await req.text();
    const data = safeParseJson(body);
    
    if (!data || !data.character_name) {
      return Response.json({
        success: false,
        error: 'character_name é obrigatório',
        correlationId
      }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // TODO: Validar personagem no servidor de jogo
    // Por enquanto, stub retorna dados básicos
    
    // Buscar personagem no banco (se existir em GameCharacter)
    try {
      const characters = await base44.asServiceRole.entities.GameCharacter.filter({
        character_name: data.character_name
      }, undefined, 1);
      
      if (characters.length > 0) {
        const char = characters[0];
        return Response.json({
          success: true,
          character: {
            name: char.character_name,
            class: char.class_code,
            level: char.level,
            exists: true
          },
          correlationId,
          notes: {
            source: 'GameCharacter',
            validated: true
          }
        }, {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (e) {
      // Entity não existe ou erro, continuar com stub
    }
    
    // Stub: aceitar qualquer personagem mas marcar como não validado
    return Response.json({
      success: true,
      character: {
        name: data.character_name,
        class: 'unknown',
        level: 0,
        exists: false
      },
      correlationId,
      notes: {
        source: 'stub',
        validated: false,
        warning: 'Validação de personagem não integrada com servidor'
      }
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Erro ao validar personagem',
      correlationId
    }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});