import { readState } from "./readState.ts";

export async function getLastPolledAt(): Promise<Date> {
  const state = await readState();
  return new Date(state.lastPolledAt);
}
