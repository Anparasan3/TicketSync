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

export interface JiraIssueRaw {
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
    description: unknown;
  };
}
