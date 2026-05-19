import { HEADERS } from "./headers.ts";

export function buildInitialCsv(): string {
  return HEADERS.join(",") + "\n";
}
