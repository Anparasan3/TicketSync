import { format } from "date-fns";
import { z } from "zod";
import { config } from "../config.ts";
import type { JiraTicket } from "../jira/jiraTicket.ts";
import { buildPrBody } from "./buildPrBody.ts";
import { ghFetch, ghFetchOptional } from "./ghClient.ts";

const baseBranchSchema = z.object({ object: z.object({ sha: z.string() }) });
const fileSchema = z.object({ sha: z.string() });
const prSchema = z.object({ html_url: z.string() });

async function getBaseBranchSha(): Promise<string> {
  const data = baseBranchSchema.parse(
    await ghFetch(
      `/repos/${config.GITHUB_OWNER}/${config.GITHUB_REPO}/git/ref/heads/${config.GITHUB_BASE_BRANCH}`
    )
  );
  return data.object.sha;
}

async function getFileSha(): Promise<string | null> {
  const data = await ghFetchOptional(
    `/repos/${config.GITHUB_OWNER}/${config.GITHUB_REPO}/contents/${config.GITHUB_CSV_PATH}?ref=${config.GITHUB_BASE_BRANCH}`
  );
  return fileSchema.safeParse(data).data?.sha ?? null;
}

async function createBranch(branchName: string, sha: string): Promise<void> {
  await ghFetch(`/repos/${config.GITHUB_OWNER}/${config.GITHUB_REPO}/git/refs`, "POST", {
    ref: `refs/heads/${branchName}`,
    sha,
  });
}

async function upsertFile(
  branchName: string,
  content: string,
  commitMessage: string,
  fileSha?: string
): Promise<void> {
  const body: Record<string, unknown> = {
    message: commitMessage,
    content: Buffer.from(content).toString("base64"),
    branch: branchName,
  };
  if (fileSha !== undefined) body["sha"] = fileSha;

  await ghFetch(
    `/repos/${config.GITHUB_OWNER}/${config.GITHUB_REPO}/contents/${config.GITHUB_CSV_PATH}`,
    "PUT",
    body
  );
}

async function createPullRequest(branchName: string, title: string, body: string): Promise<string> {
  const data = prSchema.parse(
    await ghFetch(`/repos/${config.GITHUB_OWNER}/${config.GITHUB_REPO}/pulls`, "POST", {
      title,
      body,
      head: branchName,
      base: config.GITHUB_BASE_BRANCH,
    })
  );
  return data.html_url;
}

export async function createTicketPR(tickets: JiraTicket[], updatedCsvContent: string): Promise<string> {
  const ticketKeys = tickets.map((t) => t.key).join(", ");
  const branchName = `ticketsync/done-${format(new Date(), "yyyyMMdd-HHmmss")}`;

  const baseSha = await getBaseBranchSha();
  const existingFileSha = await getFileSha();

  await createBranch(branchName, baseSha);

  await upsertFile(
    branchName,
    updatedCsvContent,
    `[TicketSync] Mark ${ticketKeys} as Done`,
    existingFileSha ?? undefined
  );

  const prTitle =
    tickets.length === 1
      ? `[TicketSync] ${tickets[0]!.key} moved to Done`
      : `[TicketSync] ${tickets.length} tickets moved to Done`;

  return createPullRequest(branchName, prTitle, buildPrBody(tickets));
}
