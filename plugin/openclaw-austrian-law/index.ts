import { definePluginEntry, type OpenClawPluginApi } from "openclaw/plugin-sdk/core";
import { TOOL_REGISTRY } from "./src/tools/registry.js";

export default definePluginEntry({
  id: "openclaw-austrian-law",
  name: "OpenClaw Austrian Law Plugin",
  description: "Skeleton entry for Austrian law plugin (no tools registered yet).",
  register(api: OpenClawPluginApi) {
    const toolNames = TOOL_REGISTRY.map((entry) => entry.definition.name);
    const stubCount = TOOL_REGISTRY.filter((entry) => entry.definition.status === "stub").length;

    api.logger.info(
      `[openclaw-austrian-law] skeleton loaded; registryTools=${toolNames.join(", ")}; stubs=${stubCount}`,
    );

    // TODO(next step): wire TOOL_REGISTRY into api.registerTool(...) as non-productive stubs.
  },
});
