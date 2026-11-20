import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { registerStoreProjectDataTool } from "./store_project_data.js";
import { deleteProject, getProjectByName } from "../database/service.js";

async function connect(): Promise<Client> {
  const server = new McpServer({ name: "test", version: "0.0.0" });
  registerStoreProjectDataTool(server);
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await server.connect(serverSide);
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await client.connect(clientSide);
  return client;
}

function textOf(result: Awaited<ReturnType<Client["callTool"]>>): string {
  const [first] = result.content as Array<{ type: string; text: string }>;
  return first.text;
}

test("store_project_data stores a project with string metadata", async () => {
  const client = await connect();
  const name = `test-project-${randomUUID()}`;
  try {
    const result = await client.callTool({ name: "store_project_data", arguments: { project_name: name, metadata: { phase: "design", owner: "studio" } } });
    assert.notEqual(result.isError, true, textOf(result));
    assert.equal(JSON.parse(textOf(result)).success, true);
    assert.ok(getProjectByName(name), "the project must be in the database after a successful call");
  } finally {
    const stored = getProjectByName(name) as { id: number } | undefined;
    if (stored) deleteProject(stored.id);
    await client.close();
  }
});

test("store_project_data rejects metadata whose values are not strings, and stores nothing", async () => {
  const client = await connect();
  const name = `test-project-${randomUUID()}`;
  try {
    const result = await client.callTool({ name: "store_project_data", arguments: { project_name: name, metadata: { floors: 3 } } });
    assert.equal(result.isError, true, "metadata values must be strings");
    assert.equal(getProjectByName(name), null, "a rejected call must not store the project");
  } finally {
    await client.close();
  }
});
