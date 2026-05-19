export async function writeLocalCsv(filePath: string, content: string): Promise<void> {
  await Bun.write(filePath, content);
}
