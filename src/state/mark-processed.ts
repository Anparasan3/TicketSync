import { readState } from "./read-state.ts";
import { writeState } from "./write-state.ts";

export async function markProcessed(keys: string[], polledAt: Date): Promise<void> {
  const state = await readState();
  const all = new Set([...state.processedKeys, ...keys]);
  const trimmed = [...all].slice(-5000);
  await writeState({
    lastPolledAt: polledAt.toISOString(),
    processedKeys: trimmed,
  });
}
