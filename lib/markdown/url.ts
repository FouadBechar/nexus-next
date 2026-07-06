const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

function isRelativeUrl(value: string) {
  return (
    value.startsWith("/") ||
    value.startsWith("#") ||
    value.startsWith("./") ||
    value.startsWith("../")
  );
}

export function safeUrlTransform(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) return "";

  if (isRelativeUrl(trimmedValue)) {
    return trimmedValue;
  }

  try {
    const url = new URL(trimmedValue);

    return SAFE_LINK_PROTOCOLS.has(url.protocol) ? trimmedValue : "";
  } catch {
    return "";
  }
}
