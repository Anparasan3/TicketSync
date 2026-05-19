import { describe, expect, test } from "bun:test";
import type { JiraTicket } from "../jira/jiraTicket.ts";
import { buildCsvContent } from "./buildCsvContent.ts";

const HEADER = "Key,Summary,Status,Issue Type,Priority,Assignee,Reporter,Sprint,Labels,Fix Versions,Resolution Date,Created,Updated,URL";

const baseTicket: JiraTicket = {
  key: "PROJ-1",
  summary: "Fix the login bug",
  status: "Done",
  issueType: "Bug",
  priority: "High",
  assignee: "John Doe",
  reporter: "Jane Smith",
  sprint: "Sprint 10",
  labels: [],
  fixVersions: [],
  resolutionDate: "2024-01-15",
  created: "2024-01-10",
  updated: "2024-01-15",
  description: "",
  url: "https://jira.example.com/browse/PROJ-1",
};

describe("buildCsvContent", () => {
  test("starts with the header row when existing content is empty", () => {
    const result = buildCsvContent("", [baseTicket]);
    expect(result.startsWith(HEADER)).toBe(true);
  });

  test("appends ticket rows after the existing header line", () => {
    const result = buildCsvContent(HEADER, [baseTicket]);
    const lines = result.trim().split("\n");
    expect(lines[0]).toBe(HEADER);
    expect(lines[1]).toContain("PROJ-1");
  });

  test("replaces non-header content with a fresh header before appending", () => {
    const result = buildCsvContent("garbage data", [baseTicket]);
    expect(result.startsWith("Key,")).toBe(true);
    expect(result).toContain("PROJ-1");
  });

  test("appends a row for each ticket", () => {
    const ticket2 = { ...baseTicket, key: "PROJ-2" };
    const result = buildCsvContent("", [baseTicket, ticket2]);
    expect(result).toContain("PROJ-1");
    expect(result).toContain("PROJ-2");
    expect(result.trim().split("\n").length).toBe(3);
  });

  test("always ends with a trailing newline", () => {
    const result = buildCsvContent("", [baseTicket]);
    expect(result.endsWith("\n")).toBe(true);
  });

  test("returns just the header line when tickets array is empty", () => {
    const result = buildCsvContent("", []);
    expect(result.trim()).toBe(HEADER);
  });

  test("preserves existing rows when appending new tickets", () => {
    const existingWithRow = `${HEADER}\nPROJ-0,Old ticket,Done,Bug,Low,A,B,S,,,,,,"https://jira.example.com/browse/PROJ-0"`;
    const result = buildCsvContent(existingWithRow, [baseTicket]);
    expect(result).toContain("PROJ-0");
    expect(result).toContain("PROJ-1");
  });
});
