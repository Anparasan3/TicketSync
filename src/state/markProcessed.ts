import { formatISO } from "date-fns";
import { readState, writeState } from "./stateIO.ts";

export async function markProcessed(keys: string[], polledAt: Date): Promise<void> {
  const state = await readState();
  const all = new Set([...state.processedKeys, ...keys]);
  const trimmed = [...all].slice(-5000);
  await writeState({
    lastPolledAt: formatISO(polledAt),
    processedKeys: trimmed,
  });
}
