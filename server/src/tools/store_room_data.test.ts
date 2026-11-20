import { test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { registerStoreRoomDataTool } from "./store_room_data.js";

function captureSchema() {
  let shape: z.ZodRawShape = {};
  registerStoreRoomDataTool({ tool: (_n: string, _d: string, s: z.ZodRawShape) => { shape = s; } } as any);
  return z.object(shape);
}

test("store_room_data accepts string-to-string metadata", () => {
  const schema = captureSchema();
  assert.ok(schema.safeParse({ project_name: "p", rooms: [{ room_id: "1", metadata: { a: "b" } }] }).success);
});

test("store_room_data rejects non-string metadata values", () => {
  const schema = captureSchema();
  assert.equal(schema.safeParse({ project_name: "p", rooms: [{ room_id: "1", metadata: { a: 1 } }] }).success, false);
});
