import { STATE_FILE } from "./state-schema.ts";
import type { State } from "./state-schema.ts";

export async function writeState(state: State): Promise<void> {
  await Bun.write(STATE_FILE, JSON.stringify(state, null, 2));
}
