#!/usr/bin/env node
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { openData } from "./data";
import { createServer } from "./server";

// stdout carries the protocol, so anything this program says goes to stderr.
const data = openData(process.cwd());
serveStdio(() => createServer(data));
console.error("dbm-system-mcp running on stdio");
