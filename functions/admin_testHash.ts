import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Method 1: Used in admin_createAccount (encodeHex)
async function hashPasswordMethod1(password, salt) {
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
  
  // Using encodeHex-like approach
  const bytes = new Uint8Array(hashBuffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Method 2: SHA-256 only (possible mistake)
async function hashPasswordMethod2(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hashBuffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, testPassword } = await req.json();

    if (!email || !testPassword) {
      return Response.json({
        error: 'Email e testPassword obrigatórios'
      }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const admins = await base44.asServiceRole.entities.AdminUser.filter({
      email: normalizedEmail
    }, undefined, 1);

    if (admins.length === 0) {
      return Response.json({
        error: 'Admin não encontrado'
      }, { status: 404 });
    }

    const admin = admins[0];

    // Test all methods
    const hash1 = await hashPasswordMethod1(testPassword, admin.password_salt);
    const hash2 = await hashPasswordMethod2(testPassword);

    return Response.json({
      admin: {
        email: admin.email,
        username: admin.username
      },
      storedHash: admin.password_hash,
      storedSalt: admin.password_salt,
      testResults: {
        method1_PBKDF2: {
          hash: hash1,
          matches: hash1 === admin.password_hash
        },
        method2_SHA256_plain: {
          hash: hash2,
          matches: hash2 === admin.password_hash
        }
      }
    });

  } catch (error) {
    console.error('[admin_testHash] Error:', error);
    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});