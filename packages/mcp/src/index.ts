#!/usr/bin/env node
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { openData } from "./data";
import { projectFolders } from "./project";
import { createServer } from "./server";

// stdout carries the protocol, so anything this program says goes to stderr.
const { folders, warnings } = projectFolders(process.argv.slice(2), process.env, process.cwd());
const data = openData(folders, warnings);
serveStdio(() => createServer(data));
console.error("dbm-system-mcp running on stdio");
