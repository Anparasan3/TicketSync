import { format } from "date-fns";
import { z } from "zod";
import { config } from "../config.ts";
import { jiraFetch } from "./jiraClient.ts";
import type { JiraIssueRaw, JiraTicket } from "./jiraTicket.ts";
import { mapIssue } from "./mapIssue.ts";

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
    fixVersions: z.array(z.object({ name: z.string() })).optional().default([]),
    customfield_10020: z
      .array(z.object({ name: z.string().optional(), title: z.string().optional() }))
      .nullable()
      .optional(),
    resolutiondate: z.string().nullable(),
    created: z.string(),
    updated: z.string(),
    description: z.unknown(),
  }),
}) satisfies z.ZodType<JiraIssueRaw>;

const searchResponseSchema = z.object({
  issues: z.array(jiraIssueRawSchema),
  nextPageToken: z.string().optional(),
});

export async function fetchDoneTicketsSince(since: Date): Promise<JiraTicket[]> {
  const sinceStr = format(since, "yyyy-MM-dd HH:mm");

  const jql = `project = "${config.JIRA_PROJECT_KEY}" AND status = Done AND statusCategoryChangedDate >= "${sinceStr}" AND (assignee = currentUser() OR reporter = currentUser()) ORDER BY updated DESC`;

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
  console.log(`  Jira search URL: ${config.JIRA_BASE_URL}/issues/?jql=${encodeURIComponent(jql)}`);

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
