import {
  definePluginEntry,
  type OpenClawPluginApi,
  type OpenClawPluginToolContext,
} from "openclaw/plugin-sdk/plugin-entry";
import {
  configureCacheRoot,
  resolveToolContextCacheRoot,
  runWithCacheRoot,
} from "./src/cache/cache-runtime.js";
import { configureJuslineBaseUrl } from "./src/jusline/runtime.js";
import { configureRisApiBaseUrl } from "./src/ris-api/runtime.js";
import { configureRisBaseUrl } from "./src/ris/runtime.js";
import { TOOL_REGISTRY } from "./src/tools/registry.js";
import { formatToolResult } from "./src/tools/format-result.js";
import { validateToolRegistry } from "./src/tools/validate-registry.js";
import { runWithWorkspaceDir } from "./src/config/settings.js";

function extractConfiguredCacheRoot(api: OpenClawPluginApi): string | undefined {
  const candidate = api.pluginConfig?.cacheRoot;
  return typeof candidate === "string" ? candidate : undefined;
}

function extractConfiguredRisBaseUrl(api: OpenClawPluginApi): string | undefined {
  const candidate = api.pluginConfig?.risBaseUrl;
  return typeof candidate === "string" ? candidate : undefined;
}

function extractConfiguredRisApiBaseUrl(api: OpenClawPluginApi): string | undefined {
  const candidate = api.pluginConfig?.risApiBaseUrl;
  return typeof candidate === "string" ? candidate : undefined;
}

function extractConfiguredJuslineBaseUrl(api: OpenClawPluginApi): string | undefined {
  const candidate = api.pluginConfig?.juslineBaseUrl;
  return typeof candidate === "string" ? candidate : undefined;
}

function resolveEffectiveCacheRoot(
  api: OpenClawPluginApi,
  ctx: OpenClawPluginToolContext,
): string | undefined {
  return resolveToolContextCacheRoot({
    configuredCacheRoot: extractConfiguredCacheRoot(api),
    workspaceDir: ctx.workspaceDir,
  });
}

export default definePluginEntry({
  id: "austrian-law-kit",
  name: "Austrian Law Kit",
  description: "Plugin entry for Austrian law research tools.",
  register(api: OpenClawPluginApi) {
    configureCacheRoot(extractConfiguredCacheRoot(api));
    configureRisBaseUrl(extractConfiguredRisBaseUrl(api));
    configureRisApiBaseUrl(extractConfiguredRisApiBaseUrl(api));
    configureJuslineBaseUrl(extractConfiguredJuslineBaseUrl(api));

    const validation = validateToolRegistry();
    if (!validation.ok) {
      api.logger.warn(
        `[austrian-law-kit] registry validation issues: ${validation.errors.join(" | ")}`,
      );
    }

    for (const entry of TOOL_REGISTRY) {
      api.registerTool((ctx) => ({
        name: entry.definition.name,
        description: `${entry.definition.description} [${entry.definition.status}]`,
        parameters: entry.inputSchema,
        execute: async (_toolCallId, params) => {
          const cacheRoot = resolveEffectiveCacheRoot(api, ctx);
          const result = await runWithWorkspaceDir(ctx.workspaceDir, () =>
            runWithCacheRoot(cacheRoot, () => entry.stub(params))
          );
          return formatToolResult(result);
        },
      }));
    }

    api.logger.info(
      `[austrian-law-kit] registered ${TOOL_REGISTRY.length} tools (mixed MVP/stub status).`,
    );
  },
});
