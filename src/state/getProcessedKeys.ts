import { readState } from "./stateIO.ts";

export async function getProcessedKeys(): Promise<Set<string>> {
  const state = await readState();
  return new Set(state.processedKeys);
}
