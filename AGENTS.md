# Project Overview

TicketSync is a Bun/TypeScript background poller. On each interval it:
1. Fetches Jira tickets that moved to Done since the last poll
2. Appends new tickets to a CSV file (local + GitHub)
3. Opens a GitHub PR with the updated CSV
4. Sends an email summary via Resend

**Stack:** Bun runtime · TypeScript (strict) · Zod · Resend · GitHub REST API · Jira REST API  
**No database, no UI framework, no React.**

## File map

| File | Responsibility |
|------|---------------|
| `index.ts` | Entry point — starts the poller |
| `src/poller.ts` | Poll loop and orchestration |
| `src/jira.ts` | Jira REST API client |
| `src/github.ts` | GitHub REST API client (branch, file upsert, PR) |
| `src/email.ts` | Resend email notification |
| `src/csv.ts` | CSV build and read/write helpers |
| `src/state.ts` | Persists last-polled timestamp and processed ticket keys |
| `src/config.ts` | Zod-validated environment config |

## Scripts

```
bun run start      # start the continuous poller
bun run dev        # start with --watch (auto-restart on change)
bun run poll       # one-shot poll (src/run-once.ts)
bunx tsc --noEmit  # type-check (no "typecheck" script exists)
```

# Important

1. Keep the code DRY. Re-use functions rather than duplicating logic.
2. This project uses **Zod** for all external data parsing (API responses, JSON files). Never use `as` casts on unknown data — write a `z.object(...)` schema and call `.parse()` or `.safeParse()` instead.
3. Use type inference as much as possible. Do not construct a new type manually when it can be derived from a Zod schema (`z.infer<typeof mySchema>`).
4. Split code by function — one responsibility per file. Don't repeat logic across files.
5. Use `bun` instead of `node` or `npm`.
6. Never use `any`, and avoid using `as`.
7. Don't use the `type` keyword — use `interface` instead.
8. Once changes are complete, always run `bunx tsc --noEmit` to ensure there are no type errors.

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

# TypeScript

* Always use strict equality: `===` or `!==`.

* One function or type per file.
  When a file imports something from another file, the entire file and all of its dependencies are also loaded. This can lead to unnecessary bloat at runtime. Limiting files to one construct aids in readability and unit-testability.

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
