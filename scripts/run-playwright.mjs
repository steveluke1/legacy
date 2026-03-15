import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const playwrightCli = path.resolve(__dirname, "..", "node_modules", "@playwright", "test", "cli.js");

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Nao foi possivel reservar uma porta livre para o Playwright.")));
        return;
      }

      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(port);
      });
    });
  });
}

async function main() {
  const port = await findFreePort();
  const args = process.argv.slice(2);

  const child = spawn(process.execPath, [playwrightCli, "test", ...args], {
    stdio: "inherit",
    env: {
      ...process.env,
      PLAYWRIGHT_PORT: String(port),
      NEXT_DIST_DIR: ".next-e2e",
    },
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 1);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});