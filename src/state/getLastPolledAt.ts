import { parseISO } from "date-fns";
import { readState } from "./stateIO.ts";

export async function getLastPolledAt(): Promise<Date> {
  const state = await readState();
  return parseISO(state.lastPolledAt);
}
