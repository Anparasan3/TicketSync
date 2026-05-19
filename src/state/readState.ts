import { existsSync } from "fs";
import { STATE_FILE, stateSchema } from "./stateSchema.ts";
import type { State } from "./stateSchema.ts";

export async function readState(): Promise<State> {
  if (!existsSync(STATE_FILE)) {
    return { lastPolledAt: new Date(Date.now() - 60_000).toISOString(), processedKeys: [] };
  }
  const text = await Bun.file(STATE_FILE).text();
  return stateSchema.parse(JSON.parse(text));
}
