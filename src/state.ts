import { existsSync } from "fs";

const STATE_FILE = ".ticketsync-state.json";

interface State {
  lastPolledAt: string;
  processedKeys: string[];
}

async function readState(): Promise<State> {
  if (!existsSync(STATE_FILE)) {
    return { lastPolledAt: new Date(Date.now() - 60_000).toISOString(), processedKeys: [] };
  }
  const text = await Bun.file(STATE_FILE).text();
  return JSON.parse(text) as State;
}

async function writeState(state: State): Promise<void> {
  await Bun.write(STATE_FILE, JSON.stringify(state, null, 2));
}

export async function getLastPolledAt(): Promise<Date> {
  const state = await readState();
  return new Date(state.lastPolledAt);
}

export async function getProcessedKeys(): Promise<Set<string>> {
  const state = await readState();
  return new Set(state.processedKeys);
}

export async function markProcessed(keys: string[], polledAt: Date): Promise<void> {
  const state = await readState();
  const all = new Set([...state.processedKeys, ...keys]);
  // Keep at most the last 5000 keys to prevent unbounded growth
  const trimmed = [...all].slice(-5000);
  await writeState({
    lastPolledAt: polledAt.toISOString(),
    processedKeys: trimmed,
  });
}
