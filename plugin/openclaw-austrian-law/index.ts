import { definePluginEntry, type OpenClawPluginApi } from "openclaw/plugin-sdk/core";
import { configureCacheRoot } from "./src/cache/cache-runtime.js";
import { TOOL_REGISTRY } from "./src/tools/registry.js";
import { formatToolResult } from "./src/tools/format-result.js";
import { validateToolRegistry } from "./src/tools/validate-registry.js";

function extractConfiguredCacheRoot(api: OpenClawPluginApi): string | undefined {
  const apiAny = api as unknown as {
    config?: { cacheRoot?: unknown };
    pluginConfig?: { cacheRoot?: unknown };
    getConfig?: () => { cacheRoot?: unknown };
  };

  const candidate = apiAny.config?.cacheRoot
    ?? apiAny.pluginConfig?.cacheRoot
    ?? apiAny.getConfig?.().cacheRoot;

  return typeof candidate === "string" ? candidate : undefined;
}

export default definePluginEntry({
  id: "openclaw-austrian-law",
  name: "OpenClaw Austrian Law Plugin",
  description: "Skeleton entry for Austrian law plugin (no tools registered yet).",
  register(api: OpenClawPluginApi) {
    configureCacheRoot(extractConfiguredCacheRoot(api));

    const validation = validateToolRegistry();
    if (!validation.ok) {
      api.logger.warn(
        `[openclaw-austrian-law] registry validation issues: ${validation.errors.join(" | ")}`,
      );
    }

    for (const entry of TOOL_REGISTRY) {
      api.registerTool({
        name: entry.definition.name,
        description: `${entry.definition.description} [${entry.definition.status}]`,
        parameters: entry.inputSchema,
        execute: async (_toolCallId, params) => {
          const result = await entry.stub(params);
          return formatToolResult(result);
        },
      });
    }

    api.logger.info(
      `[openclaw-austrian-law] registered ${TOOL_REGISTRY.length} stub tools (no productive logic).`,
    );
  },
});
