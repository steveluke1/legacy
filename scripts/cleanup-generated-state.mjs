import { rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const removeBuildOutput = process.argv.includes("--with-build");

const targets = [
  "playwright-report",
  "test-results",
  "tsconfig.tsbuildinfo",
  ".next-e2e",
];

if (removeBuildOutput) {
  targets.push(".next");
}

async function cleanupGeneratedState() {
  await Promise.all(targets.map((target) => rm(path.join(root, target), { recursive: true, force: true })));
  console.log(`cleanup:generated removed ${targets.join(", ")}`);
}

cleanupGeneratedState().catch((error) => {
  console.error("cleanup:generated failed", error);
  process.exitCode = 1;
});
