import { config } from "../config.ts";

const BASE = "https://api.github.com";

export function ghHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${config.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export async function ghFetch(path: string, method = "GET", body?: unknown): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: ghHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error("GitHub API request failed", { cause: { status: res.status, method, path, text } });
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function ghFetchOptional(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: ghHeaders() });

  if (res.status === 404) return null;

  if (!res.ok) {
    const text = await res.text();
    throw new Error("GitHub API request failed", { cause: { status: res.status, path, text } });
  }

  return res.json();
}
