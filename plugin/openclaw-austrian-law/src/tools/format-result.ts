import type { ToolResult } from "../types/shared.js";

export type ToolContentMessage = {
  content: Array<{ type: "text"; text: string }>;
};

export function formatToolResult<T>(result: ToolResult<T>): ToolContentMessage {
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
}
