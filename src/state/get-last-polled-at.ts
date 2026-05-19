import { readState } from "./read-state.ts";

export async function getLastPolledAt(): Promise<Date> {
  const state = await readState();
  return new Date(state.lastPolledAt);
}
