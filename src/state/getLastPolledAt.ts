import { parseISO } from "date-fns";
import { readState } from "./stateIO.ts";

export async function getLastPolledAt(): Promise<Date> {
  const pollSince = process.env["POLL_SINCE"];
  if (pollSince) {
    return parseISO(pollSince);
  }
  const state = await readState();
  return parseISO(state.lastPolledAt);
}
