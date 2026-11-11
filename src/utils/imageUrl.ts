// Local demo images stay on this PC even when its Wi-Fi address changes.
export function resolveImageUrl(uri?: string): string | undefined {
  if (!uri) return uri;
  try {
    const url = new URL(uri);
    const local =
      /^(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(
        url.hostname,
      );
    if (
      local &&
      url.port === "3001" &&
      /^\/uploads\/[a-f0-9-]+\.jpg$/.test(url.pathname)
    ) {
      return (
        (
          process.env.EXPO_PUBLIC_ADMIN_API_BASE_URL || "http://localhost:3001"
        ).replace(/\/$/, "") + url.pathname
      );
    }
  } catch {
    /* Let Image's existing error fallback handle invalid URLs. */
  }
  return uri;
}
