const FILE_SIGNATURE_LENGTH = 12;

function matchesBytes(
  bytes: Uint8Array,
  expected: number[],
  offset = 0
) {
  return expected.every((value, index) => bytes[offset + index] === value);
}

function isText(bytes: Uint8Array) {
  return !bytes.includes(0);
}

/**
 * Browser-provided MIME types are advisory. Check lightweight signatures before
 * processing or storing an upload; this is intentionally not an antivirus scan.
 */
export async function hasExpectedFileSignature(file: File) {
  const bytes = new Uint8Array(
    await file.slice(0, FILE_SIGNATURE_LENGTH).arrayBuffer()
  );

  switch (file.type) {
    case "image/png":
      return matchesBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/jpeg":
      return matchesBytes(bytes, [0xff, 0xd8, 0xff]);
    case "image/webp":
      return (
        matchesBytes(bytes, [0x52, 0x49, 0x46, 0x46]) &&
        matchesBytes(bytes, [0x57, 0x45, 0x42, 0x50], 8)
      );
    case "application/pdf":
      return matchesBytes(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]);
    case "text/plain":
    case "text/markdown":
      return isText(bytes);
    default:
      return false;
  }
}
