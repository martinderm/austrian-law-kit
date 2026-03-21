import { definePluginEntry, type OpenClawPluginApi } from "openclaw/plugin-sdk/core";
import { TOOL_NAMES } from "./src/index.js";

export default definePluginEntry({
  id: "openclaw-austrian-law",
  name: "OpenClaw Austrian Law Plugin",
  description: "Skeleton entry for Austrian law plugin (no tools registered yet).",
  register(api: OpenClawPluginApi) {
    api.logger.info(
      `[openclaw-austrian-law] skeleton loaded; planned tools=${TOOL_NAMES.join(", ")}; registration pending`,
    );
  },
});
