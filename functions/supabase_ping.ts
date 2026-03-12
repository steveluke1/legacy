import { createClient } from 'npm:@supabase/supabase-js@2';

let _sb = null;
function getSupabaseAdmin() {
  if (_sb) return _sb;
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Missing Supabase secrets');
  _sb = createClient(url, key, { auth: { persistSession: false } });
  return _sb;
}

Deno.serve(async (req) => {
  try {
    const supabase = getSupabaseAdmin();

    // Lightweight connectivity test - count auth_users without fetching data
    const { count, error } = await supabase
      .from('auth_users')
      .select('user_id', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      console.error('Supabase ping failed:', error.message);
      return Response.json({
        ok: false,
        error: {
          code: 'SUPABASE_PING_FAILED',
          message: 'Supabase connection failed'
        }
      }, { status: 503 });
    }

    // Success (count can be 0 or any number, both mean connection works)
    return Response.json({
      ok: true,
      ts: new Date().toISOString()
    });

  } catch (error) {
    console.error('Supabase ping error:', error.message);
    return Response.json({
      ok: false,
      error: {
        code: 'SUPABASE_PING_ERROR',
        message: 'Supabase ping internal error'
      }
    }, { status: 500 });
  }
});