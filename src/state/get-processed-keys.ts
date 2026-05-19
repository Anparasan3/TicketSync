import { readState } from "./read-state.ts";

export async function getProcessedKeys(): Promise<Set<string>> {
  const state = await readState();
  return new Set(state.processedKeys);
}
