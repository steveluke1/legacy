import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const locks = new Map<string, Promise<void>>();

async function ensureDirectory(filePath: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content.replace(/^\uFEFF/, "")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export class JsonFileStore<T> {
  constructor(
    private readonly workingRelativePath: string,
    private readonly seedRelativePath: string,
    private readonly emptyValue: T
  ) {}

  private get workingPath() {
    return path.join(ROOT, this.workingRelativePath);
  }

  private get seedPath() {
    return path.join(ROOT, this.seedRelativePath);
  }

  async read(): Promise<T> {
    const working = await readJsonFile<T>(this.workingPath);

    if (working !== null) {
      return working;
    }

    const seeded = (await readJsonFile<T>(this.seedPath)) ?? this.emptyValue;
    await this.write(seeded);
    return seeded;
  }

  async write(value: T) {
    await ensureDirectory(this.workingPath);
    await writeFile(this.workingPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  }

  async update(mutator: (current: T) => T | Promise<T>) {
    const currentLock = locks.get(this.workingPath) ?? Promise.resolve();

    let release!: () => void;
    const nextLock = new Promise<void>((resolve) => {
      release = resolve;
    });

    const queuedLock = currentLock.then(() => nextLock);
    locks.set(this.workingPath, queuedLock);

    await currentLock;

    try {
      const current = await this.read();
      const next = await mutator(current);
      await this.write(next);
      return next;
    } finally {
      release();
      if (locks.get(this.workingPath) === queuedLock) {
        locks.delete(this.workingPath);
      }
    }
  }
}
