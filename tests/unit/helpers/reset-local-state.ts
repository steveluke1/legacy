import { execFileSync, type StdioOptions } from "node:child_process";
import path from "node:path";

function runProjectScript(scriptName: string, options?: { stdio?: StdioOptions; args?: string[] }) {
  execFileSync(process.execPath, [path.join(process.cwd(), "scripts", scriptName), ...(options?.args ?? [])], {
    cwd: process.cwd(),
    stdio: options?.stdio ?? "ignore",
  });
}

export function resetLocalState(options?: { stdio?: StdioOptions }) {
  runProjectScript("reset-local-state.mjs", options);
}

export function cleanupGeneratedState(options?: { stdio?: StdioOptions; withBuild?: boolean }) {
  runProjectScript("cleanup-generated-state.mjs", {
    stdio: options?.stdio,
    args: options?.withBuild ? ["--with-build"] : [],
  });
}
