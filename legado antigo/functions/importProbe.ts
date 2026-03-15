// importProbe - WITH import, tests if local imports work
// VERSION: v1

const BUILD_STAMP = "importProbe-v1";

import { callBridge } from './_shared/bridgeClient.js';

Deno.serve(async (req) => {
  try {
    const importOk = typeof callBridge === 'function';
    
    return Response.json({
      ok: true,
      data: {
        probe: "importProbe",
        import_ok: importOk,
        ts: new Date().toISOString()
      },
      _build: BUILD_STAMP
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: {
        code: 'IMPORT_FAILED',
        message: `Import failed: ${error.message}`,
        _build: BUILD_STAMP
      }
    }, { status: 500 });
  }
});