import { auth } from "../config/firebase";
export const apiBase = (
  process.env.EXPO_PUBLIC_ADMIN_API_BASE_URL || "http://localhost:3001"
).replace(/\/$/, "");
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  const r = await fetch(apiBase + path, {
    method,
    headers: {
      Authorization: `Bearer ${token || ""}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  if (r.status === 204) return undefined as T;
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Không thể kết nối máy chủ.");
  return data as T;
}
