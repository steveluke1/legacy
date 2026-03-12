import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  const bytes = new Uint8Array(hashBuffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({
        error: 'Email e senha são obrigatórios'
      }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find admin
    const admins = await base44.asServiceRole.entities.AdminUser.filter({
      email: normalizedEmail
    }, undefined, 1);

    if (admins.length === 0) {
      // List all admins (masked)
      const allAdmins = await base44.asServiceRole.entities.AdminUser.filter({});
      const adminList = allAdmins.map(a => ({
        email: a.email,
        username: a.username,
        is_active: a.is_active,
        salt_length: a.password_salt?.length || 0,
        hash_length: a.password_hash?.length || 0
      }));

      return Response.json({
        found: false,
        searchedEmail: normalizedEmail,
        totalAdminsInDB: allAdmins.length,
        adminList
      });
    }

    const admin = admins[0];

    // Test password hash
    const computedHash = await hashPassword(password, admin.password_salt);
    const hashMatches = computedHash === admin.password_hash;

    return Response.json({
      found: true,
      admin: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        is_active: admin.is_active,
        failed_login_attempts: admin.failed_login_attempts || 0,
        locked_until: admin.locked_until || null,
        last_login_at: admin.last_login_at || null
      },
      passwordTest: {
        saltLength: admin.password_salt?.length || 0,
        storedHashLength: admin.password_hash?.length || 0,
        computedHashLength: computedHash.length,
        hashMatches,
        storedHashPrefix: admin.password_hash.substring(0, 8),
        computedHashPrefix: computedHash.substring(0, 8)
      }
    });

  } catch (error) {
    console.error('[admin_diagnoseLogin] Error:', error);
    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});