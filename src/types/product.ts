export type ProductData = { name: string; price: number; soluong: number; image: string };
// Document ID is metadata; it is never written as a fifth field.
export type Product = ProductData & { id: string };
