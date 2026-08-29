import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { processJsonPayload } from "../bin/cli.ts";

function test(name: string, fn: () => Promise<void> | void): Promise<void> {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      console.log(`ok - ${name}`);
    })
    .catch((error) => {
      console.error(`not ok - ${name}`);
      throw error;
    });
}

async function runCliJsonTests(): Promise<void> {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "openclaw-cli-json-test-"));

  try {
    // Test 1: Single Call Envelope
    await test("processJsonPayload processes single call envelope", async () => {
      const payload = {
        tool: "ris_fetch_segment",
        arguments: {
          sourceId: "NOR12032493",
        },
      };
      const { result, isOk } = await processJsonPayload(payload, undefined, tempDir);
      assert.equal(isOk, true);
      assert.equal(result.success, true);
      assert.equal(result.data.artifact.frontmatter.source_id, "NOR12032493");
    });

    // Test 2: Batch Call Envelope
    await test("processJsonPayload processes batch envelope with calls array", async () => {
      const payload = {
        calls: [
          {
            id: "call-1",
            tool: "ris_fetch_segment",
            arguments: { sourceId: "NOR12032493" },
          },
          {
            id: "call-2",
            tool: "ris_search",
            arguments: { query: "NOR12032493" },
          },
        ],
      };
      const { result, isOk } = await processJsonPayload(payload, undefined, tempDir);
      assert.equal(isOk, true);
      assert.equal(result.batch, true);
      assert.equal(result.total, 2);
      assert.equal(result.succeeded, 2);
      assert.equal(result.failed, 0);
      assert.equal(result.results[0].id, "call-1");
      assert.equal(result.results[0].success, true);
      assert.equal(result.results[1].id, "call-2");
      assert.equal(result.results[1].success, true);
    });

    // Test 3: Raw argument object with cliToolName
    await test("processJsonPayload processes raw arguments when cliToolName is passed", async () => {
      const payload = { sourceId: "NOR12032493" };
      const { result, isOk } = await processJsonPayload(payload, "ris_fetch_segment", tempDir);
      assert.equal(isOk, true);
      assert.equal(result.success, true);
      assert.equal(result.data.artifact.frontmatter.source_id, "NOR12032493");
    });

    // Test 4: Array payload directly
    await test("processJsonPayload processes array payload directly", async () => {
      const payload = [
        {
          id: "item-1",
          tool: "ris_fetch_segment",
          arguments: { sourceId: "NOR12032493" },
        },
      ];
      const { result, isOk } = await processJsonPayload(payload, undefined, tempDir);
      assert.equal(isOk, true);
      assert.equal(result.batch, true);
      assert.equal(result.results[0].id, "item-1");
    });

    // Test 5: Unknown tool in batch returns error without crashing entire batch
    await test("processJsonPayload handles invalid tool in batch gracefully", async () => {
      const payload = {
        calls: [
          {
            id: "bad-call",
            tool: "non_existing_tool",
            arguments: {},
          },
          {
            id: "good-call",
            tool: "ris_fetch_segment",
            arguments: { sourceId: "NOR12032493" },
          },
        ],
      };
      const { result, isOk } = await processJsonPayload(payload, undefined, tempDir);
      assert.equal(isOk, false); // isOk is false because at least 1 call failed
      assert.equal(result.batch, true);
      assert.equal(result.total, 2);
      assert.equal(result.succeeded, 1);
      assert.equal(result.failed, 1);
      assert.equal(result.results[0].ok, false);
      assert.equal(result.results[1].success, true);
    });

    // Test 6: ToolResult.success=false must propagate to the CLI exit decision
    await test("processJsonPayload marks unsuccessful ToolResult as failed", async () => {
      const { result, isOk } = await processJsonPayload({ laws: [] }, "ris_sync_laws", tempDir);
      assert.equal(result.success, false);
      assert.equal(isOk, false);
    });

    console.log("cli-json tests passed");
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

runCliJsonTests().catch((err) => {
  console.error("cli-json tests failed:", err);
  process.exit(1);
});
