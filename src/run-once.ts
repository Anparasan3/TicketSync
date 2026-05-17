import { poll } from "./poller.ts";

await poll().catch((err) => {
  console.error("Poll error:", err);
  process.exit(1);
});
