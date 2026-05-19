import { z } from "zod";

const schema = z.object({
  // Jira
  JIRA_BASE_URL: z.string().url(),
  JIRA_EMAIL: z.string().email(),
  JIRA_API_TOKEN: z.string().min(1),
  JIRA_PROJECT_KEY: z.string().min(1),

  // Polling
  POLL_INTERVAL_MS: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 300_000)),

  // Optional: override the "poll since" date for manual testing (ISO 8601, e.g. 2026-05-08T23:09:11Z)
  POLL_SINCE: z.string().optional(),

  // CSV
  CSV_FILE_PATH: z.string().optional().default("tickets.csv"),

  // GitHub
  GITHUB_TOKEN: z.string().min(1),
  GITHUB_OWNER: z.string().min(1),
  GITHUB_REPO: z.string().min(1),
  GITHUB_CSV_PATH: z.string().optional().default("tickets.csv"),
  GITHUB_BASE_BRANCH: z.string().optional().default("main"),

  // Email
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().email(),
  EMAIL_TO: z.string().min(1), // comma-separated for multiple recipients
});

function loadConfig() {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Missing or invalid environment variables:");
    for (const issue of result.error.issues) {
      console.error(`   ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}

export const config = loadConfig();
