import { describe, expect, test } from "bun:test";
import type { JiraTicket } from "../jira/jira-ticket.ts";
import { ticketToRow } from "./ticket-to-row.ts";

const baseTicket: JiraTicket = {
  key: "PROJ-1",
  summary: "Fix the login bug",
  status: "Done",
  issueType: "Bug",
  priority: "High",
  assignee: "John Doe",
  reporter: "Jane Smith",
  sprint: "Sprint 10",
  labels: ["backend", "auth"],
  fixVersions: ["v1.2"],
  resolutionDate: "2024-01-15",
  created: "2024-01-10",
  updated: "2024-01-15",
  description: "Login fails for SSO users",
  url: "https://jira.example.com/browse/PROJ-1",
};

describe("ticketToRow", () => {
  test("produces the correct comma-separated row in field order", () => {
    expect(ticketToRow(baseTicket)).toBe(
      "PROJ-1,Fix the login bug,Done,Bug,High,John Doe,Jane Smith,Sprint 10,backend; auth,v1.2,2024-01-15,2024-01-10,2024-01-15,https://jira.example.com/browse/PROJ-1"
    );
  });

  test("joins multiple labels with semicolon-space separator", () => {
    const row = ticketToRow({ ...baseTicket, labels: ["a", "b", "c"] });
    expect(row).toContain("a; b; c");
  });

  test("joins multiple fix versions with semicolon-space separator", () => {
    const row = ticketToRow({ ...baseTicket, fixVersions: ["v1", "v2"] });
    expect(row).toContain("v1; v2");
  });

  test("escapes commas inside the summary field", () => {
    const row = ticketToRow({ ...baseTicket, summary: "Fix login, SSO bug" });
    expect(row).toContain('"Fix login, SSO bug"');
  });

  test("produces an empty labels cell for an empty labels array", () => {
    const row = ticketToRow({ ...baseTicket, labels: [] });
    const cells = row.split(",");
    expect(cells[8]).toBe("");
  });

  test("produces an empty fix versions cell for an empty fixVersions array", () => {
    const row = ticketToRow({ ...baseTicket, fixVersions: [] });
    const cells = row.split(",");
    expect(cells[9]).toBe("");
  });
});
