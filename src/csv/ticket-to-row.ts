import type { JiraTicket } from "../jira/jira-ticket.ts";
import { escape } from "./escape.ts";

export function ticketToRow(ticket: JiraTicket): string {
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
