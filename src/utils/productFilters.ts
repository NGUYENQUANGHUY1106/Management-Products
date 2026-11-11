import { Product } from "../types/product";

export type PriceRange = { min?: number; max?: number };
export type ProductSort = "default" | "name" | "price-asc" | "price-desc";
export function parsePriceRange(from: string, to: string): PriceRange {
  function parse(value: string) {
    if (!value.trim()) return undefined;
    if (!/^\d+(\.\d+)?$/.test(value.trim())) throw new Error("Giá lọc phải là số không âm, ví dụ: 350000.");
    const number = Number(value);
    if (!Number.isFinite(number) || number > 1e12) throw new Error("Giá lọc tối đa là 1.000.000.000.000 VNĐ.");
    return number;
  }
  const min = parse(from), max = parse(to);
  if (min !== undefined && max !== undefined && min > max) throw new Error("Giá từ phải nhỏ hơn hoặc bằng giá đến.");
  return { min, max };
}
export function filterProducts(products: Product[], search: string, range: PriceRange, sort: ProductSort): Product[] {
  const query = search.trim().toLocaleLowerCase("vi");
  const result = products.filter(p => p.name.toLocaleLowerCase("vi").includes(query) && (range.min === undefined || p.price >= range.min) && (range.max === undefined || p.price <= range.max));
  if (sort === "name") result.sort((a, b) => a.name.localeCompare(b.name, "vi"));
  if (sort === "price-asc") result.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") result.sort((a, b) => b.price - a.price);
  return result;
}
