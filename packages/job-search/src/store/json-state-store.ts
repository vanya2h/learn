import { JsonStore } from "./json-store.js";
import type { FetchState, StateStore } from "./types.js";

type StateMap = Record<string, FetchState>;

export class JsonStateStore extends JsonStore implements StateStore {
  async get(key: string): Promise<FetchState | null> {
    return ((await this.readJson<StateMap>("state.json")) ?? {})[key] ?? null;
  }

  async set(key: string, state: FetchState): Promise<void> {
    const map = (await this.readJson<StateMap>("state.json")) ?? {};
    map[key] = state;
    await this.writeJson("state.json", map);
  }
}
