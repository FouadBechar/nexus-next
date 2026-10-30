import { strict as assert } from "node:assert";
import { toSpeechText } from "../../../../lib/utils/voice";

assert.equal(
  toSpeechText("## Update\n\nSee [the guide](https://example.com) and `run this`."),
  "Update. See the guide and run this."
);

assert.equal(
  toSpeechText("- First item\n- Second item\n\n```ts\nconst hidden = true;\n```"),
  "First item Second item. Code block omitted."
);
