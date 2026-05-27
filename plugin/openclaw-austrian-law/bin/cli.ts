import { configureCacheRoot } from "../src/cache/cache-runtime.js";
import { configureRisBaseUrl } from "../src/ris/runtime.js";
import { configureRisApiBaseUrl } from "../src/ris-api/runtime.js";
import { configureJuslineBaseUrl } from "../src/jusline/runtime.js";
import { risSearchStub } from "../src/tools/ris_search.js";
import { risFetchSegmentStub } from "../src/tools/ris_fetch_segment.js";
import { risFetchWholeLawStub } from "../src/tools/ris_fetch_whole_law.js";
import { juslineFetchDiscussionsStub } from "../src/tools/jusline_fetch_discussions.js";
import { juslineListDecisionsStub } from "../src/tools/jusline_list_decisions.js";
import path from "node:path";

const toolMap: Record<string, Function> = {
  ris_search: risSearchStub,
  ris_fetch_segment: risFetchSegmentStub,
  ris_fetch_whole_law: risFetchWholeLawStub,
  jusline_fetch_discussions: juslineFetchDiscussionsStub,
  jusline_list_decisions: juslineListDecisionsStub,
};

async function main() {
  const args = process.argv.slice(2);
  
  let toolName = "";
  let toolArgsJson = "";
  
  // Parse options
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--workspace" && i + 1 < args.length) {
      const workspaceDir = args[i + 1];
      configureCacheRoot(path.resolve(workspaceDir, "memory/references/austrian-law"));
      i++;
    } else if (args[i] === "--cache-root" && i + 1 < args.length) {
      configureCacheRoot(path.resolve(args[i + 1]));
      i++;
    } else if (args[i] === "--ris-base-url" && i + 1 < args.length) {
      configureRisBaseUrl(args[i + 1]);
      i++;
    } else if (args[i] === "--ris-api-base-url" && i + 1 < args.length) {
      configureRisApiBaseUrl(args[i + 1]);
      i++;
    } else if (args[i] === "--jusline-base-url" && i + 1 < args.length) {
      configureJuslineBaseUrl(args[i + 1]);
      i++;
    } else if (!toolName) {
      toolName = args[i];
    } else if (!toolArgsJson) {
      toolArgsJson = args[i];
    }
  }

  if (!toolName) {
    console.error("Usage: npx tsx bin/cli.js [options] <tool_name> [arguments_json]");
    console.error("Options:");
    console.error("  --workspace <dir>        Derive cache root in agent workspace");
    console.error("  --cache-root <dir>        Directly set cache root directory");
    console.error("  --ris-base-url <url>      Override RIS base URL");
    console.error("  --ris-api-base-url <url>  Override RIS API base URL");
    console.error("  --jusline-base-url <url>  Override JUSLINE base URL");
    console.error("Available tools:", Object.keys(toolMap).join(", "));
    process.exit(1);
  }

  const tool = toolMap[toolName];
  if (!tool) {
    console.error(`Unknown tool: ${toolName}`);
    process.exit(1);
  }

  let toolArgs = {};
  if (toolArgsJson) {
    try {
      toolArgs = JSON.parse(toolArgsJson);
    } catch (e) {
      console.error("Failed to parse arguments JSON:", e);
      process.exit(1);
    }
  }

  try {
    const result = await tool(toolArgs);
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) {
      process.exit(1);
    }
  } catch (e) {
    console.error("Error executing tool:", e);
    process.exit(1);
  }
}

main();
