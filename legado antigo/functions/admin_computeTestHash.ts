import { encodeHex } from 'https://deno.land/std@0.224.0/encoding/hex.ts';

// Identical to adminLogin and admin_createAccount
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
  
  return encodeHex(new Uint8Array(hashBuffer));
}

function generateSalt() {
  return encodeHex(crypto.getRandomValues(new Uint8Array(16)));
}

Deno.serve(async (req) => {
  try {
    const { password } = await req.json();
    
    if (!password) {
      return Response.json({
        success: false,
        error: 'Password required'
      }, { status: 400 });
    }

    const salt = generateSalt();
    const hash = await hashPassword(password, salt);

    return Response.json({
      success: true,
      salt,
      hash,
      salt_length: salt.length,
      hash_length: hash.length,
      note: 'Use these values to create an AdminUser record'
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});