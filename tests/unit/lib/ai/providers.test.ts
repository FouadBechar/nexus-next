import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { providerRegistry } from "../../../../lib/ai/providers/registry";

describe("providerRegistry", () => {
  it("returns registered providers by id", () => {
    assert.equal(providerRegistry.get("openrouter").id, "openrouter");
    assert.equal(providerRegistry.get("gemini").id, "gemini");
  });

  it("lists all registered providers", () => {
    assert.deepEqual(
      providerRegistry.list().map((provider) => provider.id).sort(),
      ["gemini", "openrouter"]
    );
  });

  it("throws for unregistered providers", () => {
    assert.throws(
      () =>
      providerRegistry.get("unknown" as Parameters<typeof providerRegistry.get>[0])
      ,
      /AI provider "unknown" is not registered\./
    );
  });
});
