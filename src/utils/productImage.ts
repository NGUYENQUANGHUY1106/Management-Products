// Old local upload URLs must use the current computer's LAN address in Expo Go.
// Public image URLs remain unchanged; no Firestore fields are added or rewritten.
export function resolveProductImageUrl(uri: string, apiBase: string): string {
  try {
    const url = new URL(uri);
    const parts = url.hostname.split(".").map(Number);
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]" ||
      (parts.length === 4 && (parts[0] === 10 || (parts[0] === 192 && parts[1] === 168) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)));
    if (local && /^\/uploads\/[a-f0-9-]+\.jpg$/i.test(url.pathname)) return apiBase.replace(/\/$/, "") + url.pathname;
  } catch { /* The image component displays its fallback for malformed URLs. */ }
  return uri;
}
