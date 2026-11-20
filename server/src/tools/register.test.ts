import { test } from "node:test";
import assert from "node:assert/strict";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "./register.js";

test("registerTools does not load test modules as tools", async () => {
  const logged: string[] = [];
  const originals = [console.error, console.warn];
  const capture = (...args: unknown[]) => { logged.push(args.map(String).join(" ")); };
  console.error = capture;
  console.warn = capture;
  try {
    await registerTools(new McpServer({ name: "test", version: "0.0.0" }));
  } finally {
    [console.error, console.warn] = originals;
  }
  assert.ok(logged.some((line) => line.includes("store_room_data")));
  assert.equal(logged.filter((line) => line.includes(".test.")).length, 0);
});
