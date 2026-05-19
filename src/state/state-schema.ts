import { z } from "zod";

export const STATE_FILE = ".ticketsync-state.json";

export const stateSchema = z.object({
  lastPolledAt: z.string(),
  processedKeys: z.array(z.string()),
});

export interface State {
  lastPolledAt: string;
  processedKeys: string[];
}
