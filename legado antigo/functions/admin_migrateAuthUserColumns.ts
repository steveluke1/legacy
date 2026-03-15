import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2';

/**
 * ADMIN ONLY: Add game_user_num column to auth_users table in Supabase
 * Run this once to migrate the schema
 */

const BUILD_SIGNATURE = 'admin-migrate-auth-columns-20260106-v1';

// Supabase admin singleton
let _supabase = null;
function getSupabaseAdmin() {
  if (_supabase) return _supabase;
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Missing Supabase secrets');
  _supabase = createClient(url, key, { auth: { persistSession: false } });
  return _supabase;
}

Deno.serve(async (req) => {
  const correlationId = crypto.randomUUID();
  
  try {
    console.log(`[admin_migrateAuthUserColumns:${correlationId}] stage=START build=${BUILD_SIGNATURE}`);
    
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Admin-only endpoint
    if (user?.role !== 'admin') {
      console.warn(`[admin_migrateAuthUserColumns:${correlationId}] stage=AUTH_DENIED role=${user?.role}`);
      return Response.json({
        ok: false,
        error: { code: 'FORBIDDEN', message: 'Acesso negado: apenas administradores' }
      }, { status: 403 });
    }
    
    const supabase = getSupabaseAdmin();
    
    // Add game_user_num column if it doesn't exist
    console.log(`[admin_migrateAuthUserColumns:${correlationId}] stage=ALTER_TABLE adding_game_user_num`);
    
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE auth_users 
        ADD COLUMN IF NOT EXISTS game_user_num BIGINT;
        
        CREATE INDEX IF NOT EXISTS idx_auth_users_game_user_num 
        ON auth_users(game_user_num);
      `
    });
    
    if (alterError) {
      console.error(`[admin_migrateAuthUserColumns:${correlationId}] stage=ALTER_ERROR error=${alterError.message}`);
      
      // Try direct SQL execution instead
      const { error: directError } = await supabase
        .from('auth_users')
        .select('game_user_num')
        .limit(1);
      
      if (directError && directError.message.includes('column') && directError.message.includes('does not exist')) {
        console.error(`[admin_migrateAuthUserColumns:${correlationId}] stage=COLUMN_MISSING_FATAL`);
        return Response.json({
          ok: false,
          error: { 
            code: 'MIGRATION_FAILED', 
            message: 'Não foi possível adicionar coluna. Execute manualmente no Supabase SQL Editor: ALTER TABLE auth_users ADD COLUMN game_user_num BIGINT;',
            details: alterError.message
          }
        }, { status: 500 });
      }
    }
    
    console.log(`[admin_migrateAuthUserColumns:${correlationId}] stage=SUCCESS`);
    
    return Response.json({
      ok: true,
      data: {
        message: 'Migração concluída: coluna game_user_num adicionada à tabela auth_users',
        executed_sql: 'ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS game_user_num BIGINT'
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error(`[admin_migrateAuthUserColumns:${correlationId}] stage=FATAL_ERROR error=${error.message}`);
    return Response.json({
      ok: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    }, { status: 500 });
  }
});