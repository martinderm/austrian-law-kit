import { definePluginEntry, type OpenClawPluginApi } from "openclaw/plugin-sdk/core";
import { pluginSkeletonInfo } from "./src/index.js";

const PLANNED_TOOL_REGISTRATION_ORDER = pluginSkeletonInfo.toolsPlanned;

export default definePluginEntry({
  id: "openclaw-austrian-law",
  name: "OpenClaw Austrian Law Plugin",
  description: "Skeleton entry for Austrian law plugin (no tools registered yet).",
  register(api: OpenClawPluginApi) {
    api.logger.info(
      `[openclaw-austrian-law] skeleton loaded; planned tools=${PLANNED_TOOL_REGISTRATION_ORDER.join(", ")}; registration pending`,
    );

    // TODO(next step): register stub tool handlers using shared contracts.
  },
});
