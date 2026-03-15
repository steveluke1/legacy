import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const distArg = process.argv.find((arg) => arg.startsWith("--dist="));
const distDir = distArg ? distArg.slice("--dist=".length) : ".next-e2e";
const tsconfigPath = path.join(root, "tsconfig.json");

async function clean() {
  await rm(path.join(root, distDir), { recursive: true, force: true });
  await rm(path.join(root, "tsconfig.tsbuildinfo"), { recursive: true, force: true });
}

function runBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["./node_modules/next/dist/bin/next", "build"], {
      cwd: root,
      stdio: "inherit",
      env: {
        ...process.env,
        NEXT_DIST_DIR: distDir,
      },
    });

    child.on("exit", (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal);
        return;
      }

      if (code === 0) {
        resolve(undefined);
        return;
      }

      reject(new Error(`next build for ${distDir} failed with exit code ${code ?? 1}`));
    });
  });
}

const originalTsconfig = await readFile(tsconfigPath, "utf8");

try {
  await clean();
  await runBuild();
  console.log(`build generated ${distDir}`);
} finally {
  await writeFile(tsconfigPath, originalTsconfig, "utf8");
}
