import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runAttachmentPipeline } from "../../../../lib/attachments/pipeline";

describe("runAttachmentPipeline", () => {
  it("extracts supported text attachments", async () => {
    const file = new File(["  Hello from Nexus  "], "note.txt", {
      type: "text/plain",
    });

    assert.deepEqual(await runAttachmentPipeline(file), {
      extractedText: "Hello from Nexus",
      extractionStatus: "readable",
      extractionTruncated: false,
      pipelineStatus: "completed",
    });
  });

  it("marks empty text attachments as empty", async () => {
    const file = new File(["   "], "empty.md", {
      type: "text/markdown",
    });

    assert.deepEqual(await runAttachmentPipeline(file), {
      extractedText: "",
      extractionStatus: "empty",
      extractionTruncated: false,
      pipelineStatus: "completed",
    });
  });

  it("leaves images without extracted text", async () => {
    const file = new File(["image-bytes"], "photo.png", {
      type: "image/png",
    });

    assert.deepEqual(await runAttachmentPipeline(file), {
      extractedText: "",
      extractionTruncated: false,
      pipelineStatus: "completed",
    });
  });
});
