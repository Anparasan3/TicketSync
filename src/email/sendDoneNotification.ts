import { Resend } from "resend";
import { config } from "../config.ts";
import type { JiraTicket } from "../jira/jiraTicket.ts";
import { buildHtml } from "./buildHtml.ts";

const resend = new Resend(config.RESEND_API_KEY);

export async function sendDoneNotification(tickets: JiraTicket[], prUrl: string): Promise<void> {
  const recipients = config.EMAIL_TO.split(",").map((e) => e.trim());
  const subject =
    tickets.length === 1
      ? `[TicketSync] ${tickets[0]!.key} moved to Done`
      : `[TicketSync] ${tickets.length} tickets moved to Done`;

  const { error } = await resend.emails.send({
    from: config.EMAIL_FROM,
    to: recipients,
    subject,
    html: buildHtml(tickets, prUrl),
  });

  if (error) {
    throw new Error("Resend email delivery failed", { cause: error });
  }

  console.log(`    Resend email sent to ${recipients.join(", ")}`);
}
