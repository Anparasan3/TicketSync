import { config } from "./config.ts";
import { fetchDoneTicketsSince } from "./jira.ts";
import { buildCsvContent, readLocalCsv, writeLocalCsv } from "./csv.ts";
import { createTicketPR } from "./github.ts";
import { sendDoneNotification } from "./email.ts";
import { getLastPolledAt, getProcessedKeys, markProcessed } from "./state.ts";

export async function poll(): Promise<void> {
  const polledAt = new Date();
  const since = await getLastPolledAt();
  const processed = await getProcessedKeys();

  console.log(`[${polledAt.toISOString()}] Polling Jira for tickets done since ${since.toISOString()}`);

  let tickets = await fetchDoneTicketsSince(since);

  // Filter out already-processed tickets
  tickets = tickets.filter((t) => !processed.has(t.key));

  if (tickets.length === 0) {
    console.log("  No new Done tickets found.");
    await markProcessed([], polledAt);
    return;
  }

  console.log(`  Found ${tickets.length} new ticket(s): ${tickets.map((t) => t.key).join(", ")}`);

  // Update local CSV
  const existingCsv = await readLocalCsv(config.CSV_FILE_PATH);
  const updatedCsv = buildCsvContent(existingCsv, tickets);
  await writeLocalCsv(config.CSV_FILE_PATH, updatedCsv);
  console.log(`  Updated local CSV: ${config.CSV_FILE_PATH}`);

  // Create GitHub PR
  let prUrl = "";
  try {
    prUrl = await createTicketPR(tickets, updatedCsv);
    console.log(`  GitHub PR created: ${prUrl}`);
  } catch (err) {
    console.error(`  GitHub PR creation failed: ${err}`);
  }

  // Send email
  try {
    await sendDoneNotification(tickets, prUrl);
    console.log(`  Email notification sent to ${config.EMAIL_TO}`);
  } catch (err) {
    console.error(`  Email notification failed: ${err}`);
  }

  await markProcessed(tickets.map((t) => t.key), polledAt);
}

export async function startPoller(): Promise<void> {
  console.log(`TicketSync started. Poll interval: ${config.POLL_INTERVAL_MS / 1000}s`);
  console.log(`Jira project: ${config.JIRA_PROJECT_KEY} | GitHub repo: ${config.GITHUB_OWNER}/${config.GITHUB_REPO}`);

  // Run immediately on start
  await poll().catch((err) => console.error("Poll error:", err));

  setInterval(() => {
    poll().catch((err) => console.error("Poll error:", err));
  }, config.POLL_INTERVAL_MS);
}
