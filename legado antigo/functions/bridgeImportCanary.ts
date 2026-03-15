// functions/bridgeImportCanary.js
// Canary function to verify local imports of _shared/bridgeClient.js work in production
// VERSION: 4.0.0 - Final canonical verification

const BUILD_STAMP = "bridgeImportCanary-v4";

import { callBridge } from './_shared/bridgeClient.js';

Deno.serve(async (req) => {
  try {
    // Verify import works (callBridge is a function)
    const importOk = typeof callBridge === 'function';
    
    return Response.json({
      ok: true,
      data: {
        import_ok: importOk,
        module: 'bridgeClient',
        timestamp: new Date().toISOString()
      },
      _build: BUILD_STAMP
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: {
        code: 'IMPORT_FAILED',
        message: `Failed to import bridgeClient: ${error.message}`,
        _build: BUILD_STAMP
      }
    }, { status: 500 });
  }
});