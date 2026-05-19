import { config } from "../config.ts";

function authHeader(): string {
  const creds = Buffer.from(`${config.JIRA_EMAIL}:${config.JIRA_API_TOKEN}`).toString("base64");
  return `Basic ${creds}`;
}

export async function jiraFetch(path: string, body?: unknown): Promise<unknown> {
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
    throw new Error("Jira API request failed", { cause: { status: res.status, path, body: text } });
  }

  return res.json();
}
