import { z } from "zod";
import { config } from "../config.ts";
import { jiraFetch } from "./jira-client.ts";
import type { JiraIssueRaw, JiraTicket } from "./jira-ticket.ts";
import { mapIssue } from "./map-issue.ts";

const jiraIssueRawSchema = z.object({
  key: z.string(),
  fields: z.object({
    summary: z.string(),
    status: z.object({ name: z.string() }),
    assignee: z.object({ displayName: z.string() }).nullable(),
    reporter: z.object({ displayName: z.string() }).nullable(),
    priority: z.object({ name: z.string() }).nullable(),
    issuetype: z.object({ name: z.string() }),
    labels: z.array(z.string()),
    fixVersions: z.array(z.object({ name: z.string() })),
    customfield_10020: z
      .array(z.object({ name: z.string().optional(), title: z.string().optional() }))
      .nullable()
      .optional(),
    resolutiondate: z.string().nullable(),
    created: z.string(),
    updated: z.string(),
    description: z.string().nullable(),
  }),
}) satisfies z.ZodType<JiraIssueRaw>;

const searchResponseSchema = z.object({
  issues: z.array(jiraIssueRawSchema),
  nextPageToken: z.string().optional(),
});

export async function fetchDoneTicketsSince(since: Date): Promise<JiraTicket[]> {
  const sinceStr = since
    .toISOString()
    .replace("T", " ")
    .split(".")[0]
    ?.split(":")
    .slice(0, 2)
    .join(":");

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

    const data = searchResponseSchema.parse(await jiraFetch("/search/jql", body));

    console.log(`    Fetched ${data.issues.length} issue(s) from Jira API`);
    console.log(`    Issue keys: ${data.issues.map((i) => i.key).join(", ")}`);

    for (const issue of data.issues) {
      console.log(`    Mapped Jira issue ${issue.key} to ticket with sprint: "${issue.fields.customfield_10020?.find((s) => s.name ?? s.title)?.name ?? ""}"`);
      tickets.push(mapIssue(issue, config.JIRA_BASE_URL));
    }

    if (!data.nextPageToken || data.issues.length === 0) break;
    nextPageToken = data.nextPageToken;
  }

  return tickets;
}
