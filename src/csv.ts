import { existsSync } from "fs";
import { join } from "path";
import type { JiraTicket } from "./jira.ts";

const HEADERS = [
  "Key",
  "Summary",
  "Status",
  "Issue Type",
  "Priority",
  "Assignee",
  "Reporter",
  "Sprint",
  "Labels",
  "Fix Versions",
  "Resolution Date",
  "Created",
  "Updated",
  "URL",
];

function escape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function ticketToRow(ticket: JiraTicket): string {
  const cells = [
    ticket.key,
    ticket.summary,
    ticket.status,
    ticket.issueType,
    ticket.priority,
    ticket.assignee,
    ticket.reporter,
    ticket.sprint,
    ticket.labels.join("; "),
    ticket.fixVersions.join("; "),
    ticket.resolutionDate,
    ticket.created,
    ticket.updated,
    ticket.url,
  ];
  return cells.map(escape).join(",");
}

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

export function readLocalCsv(filePath: string): string {
  if (!existsSync(filePath)) return "";
  return Bun.file(filePath).text() as unknown as string;
}

export async function writeLocalCsv(filePath: string, content: string): Promise<void> {
  await Bun.write(filePath, content);
}

export function buildInitialCsv(): string {
  return HEADERS.join(",") + "\n";
}
