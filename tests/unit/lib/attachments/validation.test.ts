import assert from "node:assert/strict";
import test from "node:test";
import { hasExpectedFileSignature } from "../../../../lib/attachments/validation";

function file(bytes: number[], type: string) {
  return new File([new Uint8Array(bytes)], "upload", { type });
}

test("attachment signature validation", async (suite) => {
  await suite.test("accepts matching PDF and image signatures", async () => {
    assert.equal(
      await hasExpectedFileSignature(
        file([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37], "application/pdf")
      ),
      true
    );
    assert.equal(
      await hasExpectedFileSignature(
        file(
          [
            0x89, 0x50, 0x4e, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
          ],
          "image/png"
        )
      ),
      true
    );
  });

  await suite.test("rejects a MIME type that does not match the file", async () => {
    assert.equal(
      await hasExpectedFileSignature(file([0x3c, 0x68, 0x74, 0x6d, 0x6c], "image/png")),
      false
    );
  });
});
