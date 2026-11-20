import test from "node:test";
import assert from "node:assert/strict";
import type { z } from "zod";
import { registerStoreProjectDataTool } from "../../../../server/build/tools/store_project_data.js";

function captureShape(): Record<string, z.ZodType> {
  let shape: Record<string, z.ZodType> = {};
  registerStoreProjectDataTool({ tool: (_n: string, _d: string, s: Record<string, z.ZodType>) => { shape = s; } } as any);
  return shape;
}

test("store_project_data metadata is a string-to-string record", () => {
  const metadata = captureShape().metadata;
  assert.ok(metadata.safeParse({ key: "value" }).success);
  assert.equal(metadata.safeParse({ key: 1 }).success, false);
});
