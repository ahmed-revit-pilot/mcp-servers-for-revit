#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createRequire } from "module";
import { registerTools } from "./tools/register.js";

const { version } = createRequire(import.meta.url)("../package.json") as {
  version: string;
};

// Create the server instance
const server = new McpServer({
  name: "mcp-server-for-revit",
  version,
});

// Start the server
async function main() {
  // Register tools
  await registerTools(server);

  // Connect to the transport layer
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Revit MCP Server start success");
}

main().catch((error) => {
  console.error("Error starting Revit MCP Server:", error);
  process.exit(1);
});
