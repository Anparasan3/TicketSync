import { describe, expect, test } from "bun:test";
import type { JiraIssueRaw } from "./jiraTicket.ts";
import { mapIssue } from "./mapIssue.ts";

const BASE_URL = "https://jira.example.com";

function makeRawIssue(fieldOverrides: Partial<JiraIssueRaw["fields"]> = {}): JiraIssueRaw {
  return {
    key: "PROJ-1",
    fields: {
      summary: "Fix the login bug",
      status: { name: "Done" },
      assignee: { displayName: "John Doe" },
      reporter: { displayName: "Jane Smith" },
      priority: { name: "High" },
      issuetype: { name: "Bug" },
      labels: ["backend"],
      fixVersions: [{ name: "v1.2" }],
      customfield_10020: [{ name: "Sprint 10" }],
      resolutiondate: "2024-01-15",
      created: "2024-01-10",
      updated: "2024-01-15",
      description: "Login fails for SSO users",
      ...fieldOverrides,
    },
  };
}

describe("mapIssue", () => {
  test("maps all fields to the correct JiraTicket properties", () => {
    const ticket = mapIssue(makeRawIssue(), BASE_URL);
    expect(ticket.key).toBe("PROJ-1");
    expect(ticket.summary).toBe("Fix the login bug");
    expect(ticket.status).toBe("Done");
    expect(ticket.assignee).toBe("John Doe");
    expect(ticket.reporter).toBe("Jane Smith");
    expect(ticket.priority).toBe("High");
    expect(ticket.issueType).toBe("Bug");
    expect(ticket.labels).toEqual(["backend"]);
    expect(ticket.fixVersions).toEqual(["v1.2"]);
    expect(ticket.sprint).toBe("Sprint 10");
    expect(ticket.resolutionDate).toBe("2024-01-15");
    expect(ticket.created).toBe("2024-01-10");
    expect(ticket.updated).toBe("2024-01-15");
    expect(ticket.description).toBe("Login fails for SSO users");
    expect(ticket.url).toBe(`${BASE_URL}/browse/PROJ-1`);
  });

  test("falls back to 'Unassigned' when assignee is null", () => {
    const ticket = mapIssue(makeRawIssue({ assignee: null }), BASE_URL);
    expect(ticket.assignee).toBe("Unassigned");
  });

  test("falls back to empty string when reporter is null", () => {
    const ticket = mapIssue(makeRawIssue({ reporter: null }), BASE_URL);
    expect(ticket.reporter).toBe("");
  });

  test("falls back to empty string when priority is null", () => {
    const ticket = mapIssue(makeRawIssue({ priority: null }), BASE_URL);
    expect(ticket.priority).toBe("");
  });

  test("falls back to empty string when resolutiondate is null", () => {
    const ticket = mapIssue(makeRawIssue({ resolutiondate: null }), BASE_URL);
    expect(ticket.resolutionDate).toBe("");
  });

  test("falls back to empty string when description is null", () => {
    const ticket = mapIssue(makeRawIssue({ description: null }), BASE_URL);
    expect(ticket.description).toBe("");
  });

  test("falls back to empty string when sprint field is null", () => {
    const ticket = mapIssue(makeRawIssue({ customfield_10020: null }), BASE_URL);
    expect(ticket.sprint).toBe("");
  });

  test("falls back to empty string when sprint field is undefined", () => {
    const ticket = mapIssue(makeRawIssue({ customfield_10020: undefined }), BASE_URL);
    expect(ticket.sprint).toBe("");
  });

  test("uses the sprint title when name is absent", () => {
    const ticket = mapIssue(makeRawIssue({ customfield_10020: [{ title: "Sprint Alpha" }] }), BASE_URL);
    expect(ticket.sprint).toBe("Sprint Alpha");
  });

  test("constructs the Jira browse URL from jiraBaseUrl and issue key", () => {
    const ticket = mapIssue(makeRawIssue(), "https://mycompany.atlassian.net");
    expect(ticket.url).toBe("https://mycompany.atlassian.net/browse/PROJ-1");
  });

  test("extracts fix version names from fixVersions objects", () => {
    const ticket = mapIssue(makeRawIssue({ fixVersions: [{ name: "v1.0" }, { name: "v2.0" }] }), BASE_URL);
    expect(ticket.fixVersions).toEqual(["v1.0", "v2.0"]);
  });

  test("returns empty fixVersions array when fixVersions is empty", () => {
    const ticket = mapIssue(makeRawIssue({ fixVersions: [] }), BASE_URL);
    expect(ticket.fixVersions).toEqual([]);
  });
});
