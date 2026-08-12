export interface ProductBadgeSource {
  badge?: string | null;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  salePrice?: number | null;
  price?: number;
}

export function getProductBadge(product: ProductBadgeSource): string {
  const explicit = String(product.badge || "").trim();
  if (explicit) return explicit.toUpperCase();
  if (product.isBestSeller) return "BEST SELLER";
  if (product.isNewArrival) return "NEW";

  const salePrice = Number(product.salePrice);
  const price = Number(product.price);
  if (Number.isFinite(salePrice) && Number.isFinite(price) && salePrice < price) return "SALE";

  return "";
}
