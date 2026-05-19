import { describe, expect, test } from "bun:test";
import { escape } from "./escape.ts";

describe("escape", () => {
  test("returns a plain string unchanged", () => {
    expect(escape("hello")).toBe("hello");
  });

  test("wraps in double-quotes when value contains a comma", () => {
    expect(escape("a,b")).toBe('"a,b"');
  });

  test("wraps in double-quotes and escapes inner double-quotes", () => {
    expect(escape('say "hi"')).toBe('"say ""hi"""');
  });

  test("wraps in double-quotes when value contains a newline", () => {
    expect(escape("line1\nline2")).toBe('"line1\nline2"');
  });

  test("handles empty string", () => {
    expect(escape("")).toBe("");
  });

  test("handles a value that is only a comma", () => {
    expect(escape(",")).toBe('","');
  });

  test("handles a value with both a comma and quotes", () => {
    expect(escape('"a,b"')).toBe('"""a,b"""');
  });
});
