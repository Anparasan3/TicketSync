import { config } from "./config.ts";

export interface JiraTicket {
  key: string;
  summary: string;
  status: string;
  assignee: string;
  reporter: string;
  priority: string;
  issueType: string;
  labels: string[];
  fixVersions: string[];
  sprint: string;
  resolutionDate: string;
  created: string;
  updated: string;
  description: string;
  url: string;
}

interface JiraIssueRaw {
  key: string;
  fields: {
    summary: string;
    status: { name: string };
    assignee: { displayName: string } | null;
    reporter: { displayName: string } | null;
    priority: { name: string } | null;
    issuetype: { name: string };
    labels: string[];
    fixVersions: Array<{ name: string }>;
    customfield_10020?: Array<{ name?: string; title?: string }> | null;
    resolutiondate: string | null;
    created: string;
    updated: string;
    description: string | null;
  };
}

function authHeader(): string {
  const creds = Buffer.from(`${config.JIRA_EMAIL}:${config.JIRA_API_TOKEN}`).toString("base64");
  return `Basic ${creds}`;
}

async function jiraFetch(path: string, body?: unknown): Promise<unknown> {
  const url = `${config.JIRA_BASE_URL}/rest/api/3${path}`;
  const res = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: authHeader(),
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira API error ${res.status} for ${path}: ${text}`);
  }

  return res.json();
}

export async function fetchDoneTicketsSince(since: Date): Promise<JiraTicket[]> {
  const sinceStr = since.toISOString().replace("T", " ").split(".")[0]?.split(":").slice(0, 2).join(":");
  // JQL: tickets in the project that moved to Done after `since`
  const jql = `project = "${config.JIRA_PROJECT_KEY}" AND status = Done AND statusCategoryChangedDate >= "${sinceStr}" AND assignee = currentUser() ORDER BY updated DESC`;
  const fields = [
    "summary",
    "status",
    "assignee",
    "reporter",
    "priority",
    "issuetype",
    "labels",
    "fixVersions",
    "customfield_10020",
    "resolutiondate",
    "created",
    "updated",
    "description",
  ];

  const maxResults = 50;
  const tickets: JiraTicket[] = [];
  let nextPageToken: string | undefined;

  console.log(`  Fetching Jira tickets with JQL: ${jql}`);
  while (true) {
    const body: Record<string, unknown> = { jql, fields, maxResults };
    if (nextPageToken) body.nextPageToken = nextPageToken;

    const data = (await jiraFetch("/search/jql", body)) as {
      issues: JiraIssueRaw[];
      nextPageToken?: string;
    };

    console.log(`    Fetched ${data.issues.length} issue(s) from Jira API`);
    console.log(`    Issues keys: ${data.issues.map((i) => i.key).join(", ")}`);
    for (const issue of data.issues) {
      tickets.push(mapIssue(issue));
    }

    if (!data.nextPageToken || data.issues.length === 0) break;
    nextPageToken = data.nextPageToken;
  }

  return tickets;
}

function mapIssue(issue: JiraIssueRaw): JiraTicket {
  const f = issue.fields;

  const sprint =
    f.customfield_10020?.find((s) => s.name || s.title)?.name ??
    f.customfield_10020?.find((s) => s.name || s.title)?.title ??
    "";

    console.log(`    Mapped Jira issue ${issue.key} to ticket with sprint: "${sprint}"`);

  return {
    key: issue.key,
    summary: f.summary,
    status: f.status.name,
    assignee: f.assignee?.displayName ?? "Unassigned",
    reporter: f.reporter?.displayName ?? "",
    priority: f.priority?.name ?? "",
    issueType: f.issuetype.name,
    labels: f.labels,
    fixVersions: (f.fixVersions ?? []).map((v) => v.name),
    sprint,
    resolutionDate: f.resolutiondate ?? "",
    created: f.created,
    updated: f.updated,
    description: typeof f.description === "string" ? f.description : "",
    url: `${config.JIRA_BASE_URL}/browse/${issue.key}`,
  };
}
