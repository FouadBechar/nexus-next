const DEFAULT_APP_URL = "http://localhost:3000";
const APP_TITLE = "Nexus Next";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getAppUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || DEFAULT_APP_URL;

  return trimTrailingSlash(configuredUrl);
}

export function getAppTitle() {
  return APP_TITLE;
}
