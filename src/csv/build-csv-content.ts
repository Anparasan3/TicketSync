import type { JiraTicket } from "../jira/jira-ticket.ts";
import { HEADERS } from "./headers.ts";
import { ticketToRow } from "./ticket-to-row.ts";

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
