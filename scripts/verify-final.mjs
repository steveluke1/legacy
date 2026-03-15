import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const nodeBin = process.execPath;
const pnpmEntrypoint = process.env.npm_execpath;

if (!pnpmEntrypoint) {
  throw new Error("verify:final requires npm_execpath from pnpm.");
}

const commands = [
  ["lint"],
  ["typecheck"],
  ["test:unit"],
  ["test:e2e"],
  ["build"],
];

function runPnpm(args) {
  const result = spawnSync(nodeBin, [pnpmEntrypoint, ...args], {
    cwd: root,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`pnpm ${args.join(" ")} failed with exit code ${result.status ?? 1}`);
  }
}

function runNode(args) {
  const result = spawnSync(nodeBin, args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`node ${args.join(" ")} failed with exit code ${result.status ?? 1}`);
  }
}

try {
  for (const args of commands) {
    runPnpm(args);
  }
} finally {
  runNode([path.join("scripts", "cleanup-generated-state.mjs"), "--with-build"]);
}
