import type { JiraTicket } from "../jira/jiraTicket.ts";
import { HEADERS } from "./headers.ts";
import { ticketToRow } from "./ticketToRow.ts";

export function buildCsvContent(existingContent: string, tickets: JiraTicket[]): string {
  const headerLine = HEADERS.join(",");
  let content = existingContent.trim();

  if (!content || !content.startsWith("Key,")) {
    content = headerLine;
  }

  for (const ticket of tickets) {
    content += "\n" + ticketToRow(ticket);
  }

  return content + "\n";
}
