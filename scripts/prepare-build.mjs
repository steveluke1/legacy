import { rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const targets = [
  path.join(root, ".next"),
  path.join(root, "tsconfig.tsbuildinfo"),
];

async function prepareBuild() {
  for (const target of targets) {
    await rm(target, { recursive: true, force: true });
  }

  console.log("prepare:build cleaned generated state");
}

prepareBuild().catch((error) => {
  console.error("prepare:build failed", error);
  process.exitCode = 1;
});
