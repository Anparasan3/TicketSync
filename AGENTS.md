# Project Overview

TicketSync is a Bun/TypeScript background poller. On each interval it:
1. Fetches Jira tickets that moved to Done since the last poll
2. Appends new tickets to a CSV file (local + GitHub)
3. Opens a GitHub PR with the updated CSV
4. Sends an email summary via Resend

**Stack:** Bun runtime · TypeScript (strict) · Zod · date-fns · Resend · GitHub REST API · Jira REST API  
**No database, no UI framework, no React.**

## File map

```
index.ts                          Entry point — starts the poller
src/
  poller.ts                       Poll loop and orchestration
  run-once.ts                     One-shot poll entry point
  config.ts                       Zod-validated environment config
  csv/
    headers.ts                    HEADERS constant (shared column order)
    escape.ts                     CSV cell escaping (pure)
    ticket-to-row.ts              JiraTicket → CSV row string (pure)
    build-csv-content.ts          Build/append full CSV content (pure)
    read-local-csv.ts             Read CSV from disk
    write-local-csv.ts            Write CSV to disk
  jira/
    jira-ticket.ts                JiraTicket + JiraIssueRaw interfaces
    jira-client.ts                authHeader + jiraFetch HTTP helper
    map-issue.ts                  JiraIssueRaw → JiraTicket (pure)
    fetch-done-tickets-since.ts   Jira search API + pagination
  email/
    build-html.ts                 Build HTML email body (pure)
    send-done-notification.ts     Send email via Resend
  github/
    gh-client.ts                  ghFetch + ghFetchOptional HTTP helpers
    build-pr-body.ts              Build PR markdown body (pure)
    create-ticket-pr.ts           Branch, file upsert, PR orchestration
  state/
    state-schema.ts               Zod schema + State interface + STATE_FILE
    read-state.ts                 Read state from disk
    write-state.ts                Write state to disk
    get-last-polled-at.ts         Returns last poll timestamp as Date
    get-processed-keys.ts         Returns processed ticket keys as Set
    mark-processed.ts             Persist new keys + updated timestamp
```

## Scripts

```
bun run start        # start the continuous poller
bun run dev          # start with --watch (auto-restart on change)
bun run poll         # one-shot poll (src/run-once.ts)
bun run test         # run all tests
bun run typecheck    # type-check (bunx tsc --noEmit)
```

## Testing

Tests are co-located next to the file they test (`foo.ts` → `foo.test.ts`). Only pure functions get unit tests — IO functions (API calls, file I/O) are not unit tested.

```
src/csv/escape.test.ts
src/csv/ticket-to-row.test.ts
src/csv/build-csv-content.test.ts
src/email/build-html.test.ts
src/github/build-pr-body.test.ts
src/jira/map-issue.test.ts
```

**Making pure functions testable:** if a function would otherwise read from `config`, pass the config value in as a plain parameter instead. This keeps the function pure and lets tests pass values directly without setting env vars.

```ts
// ✅ pure — accepts jiraBaseUrl as a param
export function mapIssue(issue: JiraIssueRaw, jiraBaseUrl: string): JiraTicket { ... }

// ❌ impure — reads global config, can't test without env vars
export function mapIssue(issue: JiraIssueRaw): JiraTicket {
  return { ..., url: `${config.JIRA_BASE_URL}/browse/${issue.key}` };
}
```

# Important

1. Keep the code DRY. Re-use functions rather than duplicating logic.
2. This project uses **Zod** for all external data parsing (API responses, JSON files). Never use `as` casts on unknown data — write a `z.object(...)` schema and call `.parse()` or `.safeParse()` instead.
3. Use type inference as much as possible. Do not construct a new type manually when it can be derived from a Zod schema.
4. Split code by function — one responsibility per file. Don't repeat logic across files.
5. Use `bun` instead of `node` or `npm`.
6. Never use `any`, and avoid using `as`.
7. Don't use the `type` keyword — use `interface` instead.
8. Once changes are complete, always run `bun run typecheck` to ensure there are no type errors. Then run `bun run test` to confirm tests pass.

## External API pattern

When calling the GitHub or Jira APIs:
- Use a dedicated `ghFetch` / `jiraFetch` helper that throws a static-message error with `{ cause }` on non-OK responses.
- For resources that may not exist (404), use a separate `*Optional` fetcher that returns `null` instead of throwing — **do not** use `try/catch` just to swallow a 404.

```ts
// ✅ null on 404, throw on other errors
async function ghFetchOptional(path: string): Promise<unknown> { ... }

// ❌ try/catch just to handle "not found"
try { await ghFetch(path) } catch { return null; }
```

## Zod API response pattern

When parsing API responses, define a full zod schema. Use `satisfies z.ZodType<T>` to let TypeScript verify the schema matches the interface at compile time — no `as` needed.

```ts
const jiraIssueRawSchema = z.object({
  key: z.string(),
  fields: z.object({ ... }),
}) satisfies z.ZodType<JiraIssueRaw>;

// parse returns JiraIssueRaw — no cast needed
const issue = jiraIssueRawSchema.parse(rawData);
```

# TypeScript

* Always use strict equality: `===` or `!==`.

* One function or type per file.
  When a file imports something from another file, the entire file and all of its dependencies are also loaded. Limiting files to one construct aids readability and unit-testability.

  **Exception:** a constant that is only used by the file it lives in does not need its own file. A constant shared across multiple files belongs in its own file (e.g. `headers.ts`). An HTTP helper file may group the fetch layer (e.g. `ghFetch` + `ghFetchOptional`) when they share private implementation.

* Create Pure Functions.
  Pure functions always produce the same output for the same input and have no observable side effects. Identify pure code blocks and split them into their own function/file. This aids readability and unit-testability.

* Do not use `Array.forEach`.
  Use `for (const item of items)` — it's easier to read and supports `await` inside the loop.

* Dates: use `date-fns`.
  JavaScript's `Date` object is unreliable. Always use `date-fns` (already a project dependency) for formatting and manipulation. Never call `.toISOString()`, `.toUTCString()`, or similar `Date` methods in output strings.

* Use `Decimal.js` for math operations.
  `Number` uses floating-point precision, which causes unexpected behavior: `0.1 + 0.2 = 0.30000000000000004`.

* `try/catch` is a code-smell.
  Only use it when you want to alter the flow of business logic using data from the error. Do not use it merely to suppress an error.

* Always log the full error object.
  `console.error("Something failed", err)` — not `console.error(err.message)` and not `console.error(\`...\${err}\`)` (string interpolation only gives `.toString()`).

* Prefer logging and returning over throwing an error.
  This aids testability and is more performant. Throw only when the code path absolutely cannot continue.

* When throwing an error, use a static message and specify `cause`.
  Static messages make error aggregation easier.
  ```ts
  throw new Error("Jira API request failed", { cause: { status: res.status, path } });
  ```

* Prefer type inference.
  Do not annotate types the compiler can already infer.
  ```ts
  ✅ arrayOfStrings.map(x => x.substring(0, 1))
  ❌ arrayOfStrings.map((x: string) => x.substring(0, 1))
  ```

Remember, TypeScript is just JavaScript. Be aware of pitfalls: <https://github.com/denysdovhan/wtfjs>
