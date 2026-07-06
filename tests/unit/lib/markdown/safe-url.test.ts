import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safeUrlTransform } from "../../../../lib/markdown/url";

describe("safeUrlTransform", () => {
  for (const url of [
    "https://example.com/path",
    "http://example.com/path",
    "mailto:hello@example.com",
    "/settings",
    "#message",
    "./relative",
    "../parent",
  ]) {
    it(`allows safe URL ${url}`, () => {
      assert.equal(safeUrlTransform(url), url);
    });
  }

  for (const url of [
    "javascript:alert(1)",
    "data:text/html;base64,PHNjcmlwdA==",
    "file:///etc/passwd",
    "nota url",
    "",
    "   ",
  ]) {
    it(`blocks unsafe URL ${url}`, () => {
      assert.equal(safeUrlTransform(url), "");
    });
  }

  it("trims before validating absolute URLs", () => {
    assert.equal(safeUrlTransform("  https://example.com  "), "https://example.com");
  });
});
