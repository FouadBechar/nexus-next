import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_CHAT_TITLE_CHARS,
  MAX_PERSISTED_CONVERSATION_CHARS,
  MAX_PERSISTED_MESSAGES,
  chatCreateSchema,
  messagesSaveSchema,
} from "../../../../lib/validation/chat";

test("chat validation", async (suite) => {
  await suite.test("trims and bounds chat titles", () => {
    const parsed = chatCreateSchema.parse({ title: "  Project notes  " });

    assert.equal(parsed.title, "Project notes");
    assert.equal(
      chatCreateSchema.safeParse({ title: "x".repeat(MAX_CHAT_TITLE_CHARS + 1) })
        .success,
      false
    );
  });

  await suite.test("rejects malformed persisted messages and oversized histories", () => {
    assert.equal(
      messagesSaveSchema.safeParse({
        messages: [{ role: "system", content: "Not persisted" }],
      }).success,
      false
    );

    assert.equal(
      messagesSaveSchema.safeParse({
        messages: Array.from({ length: MAX_PERSISTED_MESSAGES + 1 }, () => ({
          role: "user",
          content: "Hello",
        })),
      }).success,
      false
    );

    assert.equal(
      messagesSaveSchema.safeParse({
        messages: [
          {
            role: "user",
            content: "x".repeat(MAX_PERSISTED_CONVERSATION_CHARS / 2),
          },
          {
            role: "assistant",
            content: "x".repeat(MAX_PERSISTED_CONVERSATION_CHARS / 2 + 1),
          },
        ],
      }).success,
      false
    );
  });
});
