import { existsSync } from "fs";

export async function readLocalCsv(filePath: string): Promise<string> {
  if (!existsSync(filePath)) return "";
  return Bun.file(filePath).text();
}

export async function writeLocalCsv(filePath: string, content: string): Promise<void> {
  await Bun.write(filePath, content);
}
