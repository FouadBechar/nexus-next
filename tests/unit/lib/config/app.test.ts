import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { getAppTitle, getAppUrl } from "../../../../lib/config/app";

const originalEnv = { ...process.env };

describe("app config", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("uses the localhost URL when no app URL is configured", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.APP_URL;

    assert.equal(getAppUrl(), "http://localhost:3000");
  });

  it("prefers NEXT_PUBLIC_APP_URL and trims trailing slashes", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://nexus.example.com///";
    process.env.APP_URL = "https://internal.example.com";

    assert.equal(getAppUrl(), "https://nexus.example.com");
  });

  it("falls back to APP_URL", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.APP_URL = "https://internal.example.com/";

    assert.equal(getAppUrl(), "https://internal.example.com");
  });

  it("exposes the public app title", () => {
    assert.equal(getAppTitle(), "Nexus Next");
  });
});
