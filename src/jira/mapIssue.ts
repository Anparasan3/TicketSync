import type { JiraIssueRaw, JiraTicket } from "./jiraTicket.ts";

export function mapIssue(issue: JiraIssueRaw, jiraBaseUrl: string): JiraTicket {
  const f = issue.fields;

  const sprint =
    f.customfield_10020?.find((s) => s.name ?? s.title)?.name ??
    f.customfield_10020?.find((s) => s.name ?? s.title)?.title ??
    "";

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
    url: `${jiraBaseUrl}/browse/${issue.key}`,
  };
}
