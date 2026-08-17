import { configureCacheRoot } from "../src/cache/cache-runtime.js";
import { configureSettingsWorkspaceDir, runWithWorkspaceDir } from "../src/config/settings.js";
import { configureRisBaseUrl } from "../src/ris/runtime.js";
import { configureRisApiBaseUrl } from "../src/ris-api/runtime.js";
import { configureJuslineBaseUrl } from "../src/jusline/runtime.js";
import { risSearchStub } from "../src/tools/ris_search.js";
import { risFetchSegmentStub } from "../src/tools/ris_fetch_segment.js";
import { risFetchWholeLawStub } from "../src/tools/ris_fetch_whole_law.js";
import { risSyncLawsStub } from "../src/tools/ris_sync_laws.js";
import { juslineFetchDiscussionsStub } from "../src/tools/jusline_fetch_discussions.js";
import { juslineListDecisionsStub } from "../src/tools/jusline_list_decisions.js";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

export const toolMap: Record<string, Function> = {
  ris_search: risSearchStub,
  ris_fetch_segment: risFetchSegmentStub,
  ris_fetch_whole_law: risFetchWholeLawStub,
  ris_sync_laws: risSyncLawsStub,
  jusline_fetch_discussions: juslineFetchDiscussionsStub,
  jusline_list_decisions: juslineListDecisionsStub,
};

export interface ToolCallItem {
  id?: string;
  tool?: string;
  name?: string;
  action?: string;
  arguments?: Record<string, unknown>;
  params?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface BatchRequestEnvelope {
  workspace?: string;
  batch?: ToolCallItem[];
  calls?: ToolCallItem[];
  requests?: ToolCallItem[];
}

export interface SingleRequestEnvelope extends ToolCallItem {}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8").trim();
}

function printHelp(): void {
  console.log(`
Austrian Law Kit CLI — JSON-gesteuerter Aufrufmodus für RIS & JUSLINE

Verwendung:
  npm run cli -- [Optionen] <tool_name> [arguments_json]
  npm run cli -- [Optionen] --file <pfad/zu/request.json>
  npm run cli -- [Optionen] --stdin

Optionen:
  -f, --file, -i, --input <pfad>  JSON-Datei als Input (Einzelaufruf oder Batch)
  -o, --output, --out <pfad>      Ergebnis-JSON zusätzlich in Datei speichern
  --stdin, -                      JSON über Standard-Input (Pipe) einlesen
  --workspace <dir>               Ziel-Agent-Workspace für relative Caches
  --cache-root <dir>              Direkter Pfad zum Cache-Wurzelverzeichnis
  --ris-base-url <url>            Override RIS Base-URL
  --ris-api-base-url <url>        Override RIS OGD API Base-URL
  --jusline-base-url <url>        Override JUSLINE Base-URL
  -h, --help                      Diese Hilfe anzeigen

Verfügbare Kern-Tools:
  - ris_search: Suche nach Bundes-, Landes- oder Gemeinderecht
  - ris_fetch_segment: Abruf eines konkreten Paragrafen
  - ris_fetch_whole_law: Abruf eines Gesetzesvolltexts (unterstützt auch query für Auto-Resolve)
  - ris_sync_laws: Synchronisation/Download mehrerer Gesetze via Name/Query in einem Schritt
  - jusline_fetch_discussions: Kommentare & Diskussionen
  - jusline_list_decisions: OGH/VwGH Judikaturlisten OGH/VwGH-Entscheidungslisten

JSON-Strukturbeispiele:

1. Einzelaufruf (Envelope):
{
  "tool": "ris_fetch_segment",
  "arguments": {
    "sourceId": "NOR12032493"
  }
}

2. Batch-Aufruf (Mehrere Abfragen in einer Datei):
{
  "calls": [
    {
      "id": "suche-mrg",
      "tool": "ris_search",
      "arguments": { "query": "Mietrechtsgesetz" }
    },
    {
      "id": "segment-mrg-2",
      "tool": "ris_fetch_segment",
      "arguments": { "sourceId": "NOR12032493" }
    }
  ]
}

3. Reines Argumente-JSON mit Tool-Angabe in CLI:
  npm run cli -- ris_search -f query.json
`);
}

async function executeSingleCall(
  toolName: string,
  toolArgs: Record<string, unknown>,
  workspaceDir?: string,
): Promise<any> {
  const tool = toolMap[toolName];
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}. Available: ${Object.keys(toolMap).join(", ")}`);
  }

  if (workspaceDir) {
    return await runWithWorkspaceDir(workspaceDir, () => tool(toolArgs));
  }
  return await tool(toolArgs);
}

export async function processJsonPayload(
  parsedPayload: unknown,
  cliToolName?: string,
  workspaceDir?: string,
): Promise<{ result: any; isOk: boolean }> {
  // Case A: Array of tool calls (Batch)
  if (Array.isArray(parsedPayload)) {
    const results: any[] = [];
    let succeeded = 0;
    let failed = 0;

    for (let index = 0; index < parsedPayload.length; index++) {
      const item = parsedPayload[index] as ToolCallItem;
      const callTool = item.tool || item.name || item.action || cliToolName;
      const callArgs = item.arguments || item.params || item;
      const callId = item.id || `call-${index + 1}`;

      if (!callTool) {
        results.push({
          id: callId,
          ok: false,
          error: { code: "VALIDATION_ERROR", message: "Missing tool name in batch item" },
        });
        failed++;
        continue;
      }

      try {
        const singleResult = await executeSingleCall(callTool, callArgs, workspaceDir);
        const ok = singleResult?.ok !== false;
        if (ok) succeeded++;
        else failed++;
        results.push({
          id: callId,
          tool: callTool,
          ok,
          ...singleResult,
        });
      } catch (err: any) {
        failed++;
        results.push({
          id: callId,
          tool: callTool,
          ok: false,
          error: { message: err?.message || String(err) },
        });
      }
    }

    const batchResult = {
      ok: failed === 0,
      batch: true,
      total: parsedPayload.length,
      succeeded,
      failed,
      results,
    };
    return { result: batchResult, isOk: batchResult.ok };
  }

  // Case B: Object payload
  if (typeof parsedPayload === "object" && parsedPayload !== null) {
    const obj = parsedPayload as Record<string, any>;

    // Case B.1: Envelope with batch/calls/requests array
    const callList: ToolCallItem[] | undefined = obj.batch || obj.calls || obj.requests;
    if (Array.isArray(callList)) {
      const effectiveWorkspace = obj.workspace || workspaceDir;
      return await processJsonPayload(callList, cliToolName, effectiveWorkspace);
    }

    // Case B.2: Envelope with tool + arguments
    const explicitTool = obj.tool || obj.name || obj.action;
    if (explicitTool && typeof explicitTool === "string") {
      const effectiveTool = explicitTool;
      const effectiveArgs = obj.arguments || obj.params || {};
      const effectiveWorkspace = obj.workspace || workspaceDir;
      const singleResult = await executeSingleCall(effectiveTool, effectiveArgs, effectiveWorkspace);
      return { result: singleResult, isOk: singleResult?.ok !== false };
    }

    // Case B.3: Raw arguments object with cliToolName
    if (cliToolName) {
      const singleResult = await executeSingleCall(cliToolName, obj, workspaceDir);
      return { result: singleResult, isOk: singleResult?.ok !== false };
    }
  }

  throw new Error(
    "Invalid JSON input: Expected an envelope { tool: '...', arguments: { ... } }, a batch { calls: [ ... ] }, or pass tool name on CLI with arguments object.",
  );
}

async function main() {
  const args = process.argv.slice(2);

  let toolName = "";
  let toolArgsJson = "";
  let inputFilePath = "";
  let outputFilePath = "";
  let useStdin = false;
  let workspaceDir: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "-h" || arg === "--help") {
      printHelp();
      process.exit(0);
    } else if (arg === "--workspace" && i + 1 < args.length) {
      workspaceDir = path.resolve(args[++i]);
      configureSettingsWorkspaceDir(workspaceDir);
    } else if (arg === "--cache-root" && i + 1 < args.length) {
      configureCacheRoot(path.resolve(args[++i]));
    } else if (arg === "--ris-base-url" && i + 1 < args.length) {
      configureRisBaseUrl(args[++i]);
    } else if (arg === "--ris-api-base-url" && i + 1 < args.length) {
      configureRisApiBaseUrl(args[++i]);
    } else if (arg === "--jusline-base-url" && i + 1 < args.length) {
      configureJuslineBaseUrl(args[++i]);
    } else if ((arg === "-f" || arg === "--file" || arg === "-i" || arg === "--input") && i + 1 < args.length) {
      inputFilePath = path.resolve(args[++i]);
    } else if ((arg === "-o" || arg === "--output" || arg === "--out") && i + 1 < args.length) {
      outputFilePath = path.resolve(args[++i]);
    } else if (arg === "--stdin" || arg === "-") {
      useStdin = true;
    } else if (!toolName && toolMap[arg]) {
      toolName = arg;
    } else if (!toolName && !toolArgsJson && !inputFilePath && !useStdin) {
      toolName = arg;
    } else if (!toolArgsJson) {
      toolArgsJson = arg;
    }
  }

  let rawJson = "";

  if (useStdin) {
    rawJson = await readStdin();
  } else if (inputFilePath) {
    try {
      rawJson = readFileSync(inputFilePath, "utf8");
    } catch (err: any) {
      console.error(`Failed to read input file "${inputFilePath}":`, err?.message || err);
      process.exit(1);
    }
  } else if (toolArgsJson) {
    rawJson = toolArgsJson;
  }

  // If no raw JSON given and no tool name, show help
  if (!rawJson && !toolName) {
    printHelp();
    process.exit(1);
  }

  let parsedPayload: unknown = {};
  if (rawJson) {
    try {
      parsedPayload = JSON.parse(rawJson);
    } catch (e: any) {
      console.error("Failed to parse JSON input:", e?.message || e);
      process.exit(1);
    }
  }

  try {
    const { result, isOk } = await processJsonPayload(
      rawJson ? parsedPayload : {},
      toolName || undefined,
      workspaceDir,
    );

    const formattedOutput = JSON.stringify(result, null, 2);
    console.log(formattedOutput);

    if (outputFilePath) {
      try {
        mkdirSync(path.dirname(outputFilePath), { recursive: true });
        writeFileSync(outputFilePath, formattedOutput, "utf8");
      } catch (err: any) {
        console.error(`Warning: Failed to write output file "${outputFilePath}":`, err?.message || err);
      }
    }

    if (!isOk) {
      process.exit(1);
    }
  } catch (e: any) {
    console.error("Error executing tool:", e?.message || e);
    process.exit(1);
  }
}

// Execute main if run directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("cli.ts") || process.argv[1]?.endsWith("cli.js")) {
  main();
}
