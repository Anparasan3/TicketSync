import { existsSync } from "fs";
import { formatISO, subMilliseconds } from "date-fns";
import { STATE_FILE, stateSchema } from "./stateSchema.ts";
import type { State } from "./stateSchema.ts";

export async function readState(): Promise<State> {
  if (!existsSync(STATE_FILE)) {
    return { lastPolledAt: formatISO(subMilliseconds(new Date(), 60_000)), processedKeys: [] };
  }
  const text = await Bun.file(STATE_FILE).text();
  return stateSchema.parse(JSON.parse(text));
}

export async function writeState(state: State): Promise<void> {
  await Bun.write(STATE_FILE, JSON.stringify(state, null, 2));
}
