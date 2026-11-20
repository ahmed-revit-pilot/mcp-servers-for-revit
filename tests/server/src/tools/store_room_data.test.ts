import test from "node:test";
import assert from "node:assert/strict";
import type { z } from "zod";
import { registerStoreRoomDataTool } from "../../../../server/build/tools/store_room_data.js";

function captureShape(): Record<string, z.ZodType> {
  let shape: Record<string, z.ZodType> = {};
  registerStoreRoomDataTool({ tool: (_n: string, _d: string, s: Record<string, z.ZodType>) => { shape = s; } } as any);
  return shape;
}

test("store_room_data room metadata is a string-to-string record", () => {
  const rooms = captureShape().rooms;
  assert.ok(rooms.safeParse([{ room_id: "1", metadata: { key: "value" } }]).success);
  assert.equal(rooms.safeParse([{ room_id: "1", metadata: { key: 1 } }]).success, false);
});
