import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

export abstract class JsonStore {
  constructor(protected readonly dataDir: string) {}

  protected async readJson<T>(filename: string): Promise<T | null> {
    try {
      return JSON.parse(await readFile(join(this.dataDir, filename), "utf8")) as T;
    } catch {
      return null;
    }
  }

  protected async writeJson<T>(filename: string, data: T): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
    await writeFile(join(this.dataDir, filename), JSON.stringify(data, null, 2) + "\n");
  }
}
