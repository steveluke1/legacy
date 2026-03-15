import { copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const seedsDir = path.join(root, "data", "seeds");
const jsonDir = path.join(root, "data", "json");
const seedFiles = [
  "admins.seed.json",
  "characters.seed.json",
  "guilds.seed.json",
  "marketplace-listings.seed.json",
  "marketplace-orders.seed.json",
  "market-settings.seed.json",
  "notifications.seed.json",
  "password-resets.seed.json",
  "products.seed.json",
  "public-content.seed.json",
  "rankings.seed.json",
  "sessions.seed.json",
  "shop-orders.seed.json",
  "users.seed.json",
  "wallet-ledger.seed.json",
  "wallets.seed.json",
];

async function ensureSeedFilesExist() {
  await Promise.all(
    seedFiles.map(async (seedFile) => {
      await stat(path.join(seedsDir, seedFile));
    })
  );
}

async function resetLocalState() {
  await mkdir(jsonDir, { recursive: true });
  await ensureSeedFilesExist();

  for (const seedFile of seedFiles) {
    const source = path.join(seedsDir, seedFile);
    const target = path.join(jsonDir, seedFile.replace(/\.seed\.json$/, ".json"));
    await copyFile(source, target);
  }

  console.log(`reset:data synced ${seedFiles.length} seed files`);
}

resetLocalState().catch((error) => {
  console.error("reset:data failed", error);
  process.exitCode = 1;
});
