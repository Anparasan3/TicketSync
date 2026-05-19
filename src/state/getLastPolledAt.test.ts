import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, unlinkSync } from "fs";
import { getLastPolledAt } from "./getLastPolledAt.ts";
import { STATE_FILE } from "./stateSchema.ts";

describe("getLastPolledAt", () => {
  let savedContent: string | null = null;
  let savedPollSince: string | undefined;

  beforeEach(async () => {
    savedContent = existsSync(STATE_FILE) ? await Bun.file(STATE_FILE).text() : null;
    savedPollSince = process.env["POLL_SINCE"];
    delete process.env["POLL_SINCE"];
  });

  afterEach(async () => {
    if (savedContent !== null) {
      await Bun.write(STATE_FILE, savedContent);
    } else if (existsSync(STATE_FILE)) {
      unlinkSync(STATE_FILE);
    }
    if (savedPollSince !== undefined) {
      process.env["POLL_SINCE"] = savedPollSince;
    } else {
      delete process.env["POLL_SINCE"];
    }
  });

  test("returns the stored lastPolledAt timestamp as a Date", async () => {
    await Bun.write(
      STATE_FILE,
      JSON.stringify({ lastPolledAt: "2026-01-15T10:30:00.000Z", processedKeys: [] })
    );

    const date = await getLastPolledAt();

    expect(date).toBeInstanceOf(Date);
    expect(date.toISOString()).toBe("2026-01-15T10:30:00.000Z");
  });

  test("returns a Date approximately 60 seconds in the past when state file is missing", async () => {
    if (existsSync(STATE_FILE)) unlinkSync(STATE_FILE);

    const before = Date.now();
    const date = await getLastPolledAt();
    const after = Date.now();

    expect(date).toBeInstanceOf(Date);
    expect(date.getTime()).toBeGreaterThanOrEqual(before - 61_000);
    expect(date.getTime()).toBeLessThanOrEqual(after - 59_000);
  });
});
