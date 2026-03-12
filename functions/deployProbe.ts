// deployProbe - NO imports, pure deployment verification
// VERSION: v1

const BUILD_STAMP = "deployProbe-v1";

Deno.serve(async (req) => {
  return Response.json({
    ok: true,
    data: {
      probe: "deployProbe",
      ts: new Date().toISOString(),
      test: "NO_IMPORTS_PURE_DEPLOY_VERIFICATION"
    },
    _build: BUILD_STAMP
  });
});