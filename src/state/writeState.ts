import { STATE_FILE } from "./stateSchema.ts";
import type { State } from "./stateSchema.ts";

export async function writeState(state: State): Promise<void> {
  await Bun.write(STATE_FILE, JSON.stringify(state, null, 2));
}
