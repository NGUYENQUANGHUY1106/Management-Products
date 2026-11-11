export function favoritesKey(projectId: string, uid: string): string {
  return `@management-product/favorites/v1/${encodeURIComponent(projectId)}/${encodeURIComponent(uid)}`;
}

export function parseFavorites(raw: string | null): string[] {
  if (raw === null) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || !value.every(id => typeof id === "string" && id.length > 0)) throw new Error("Invalid favorites data");
  return [...new Set(value as string[])];
}

export function toggleFavorite(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id];
}
