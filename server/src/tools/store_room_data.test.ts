import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { registerStoreRoomDataTool } from "./store_room_data.js";
import { deleteProject, getProjectByName, getRoomsByProjectId, storeProject } from "../database/service.js";

async function connect(): Promise<Client> {
  const server = new McpServer({ name: "test", version: "0.0.0" });
  registerStoreRoomDataTool(server);
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

async function withProject(run: (client: Client, name: string, projectId: number) => Promise<void>): Promise<void> {
  const client = await connect();
  const name = `test-project-${randomUUID()}`;
  const projectId = storeProject({ project_name: name });
  try {
    await run(client, name, projectId);
  } finally {
    deleteProject(projectId);
    await client.close();
  }
}

test("store_room_data stores rooms with string metadata", () =>
  withProject(async (client, name, projectId) => {
    const result = await client.callTool({ name: "store_room_data", arguments: { project_name: name, rooms: [{ room_id: "101", room_name: "Office", metadata: { finish: "carpet" } }] } });
    assert.notEqual(result.isError, true, textOf(result));
    assert.equal(JSON.parse(textOf(result)).success, true);
    assert.equal(getRoomsByProjectId(projectId).length, 1, "the room must be stored");
  }));

test("store_room_data rejects room metadata whose values are not strings, and stores nothing", () =>
  withProject(async (client, name, projectId) => {
    const result = await client.callTool({ name: "store_room_data", arguments: { project_name: name, rooms: [{ room_id: "101", metadata: { seats: 4 } }] } });
    assert.equal(result.isError, true, "room metadata values must be strings");
    assert.equal(getRoomsByProjectId(projectId).length, 0, "a rejected call must not store rooms");
    assert.ok(getProjectByName(name));
  }));
