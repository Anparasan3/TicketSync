import { existsSync } from "fs";

export async function readLocalCsv(filePath: string): Promise<string> {
  if (!existsSync(filePath)) return "";
  return Bun.file(filePath).text();
}
