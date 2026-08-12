"use client";

import { useState, useMemo, useCallback } from "react";

import ProductActions from "@/components/website/ProductActions";

interface ProductVariant {
  size?: string;
  color?: string;
  stock?: number;
  sku?: string;
  price?: number | null;
  salePrice?: number | null;
  image?: string;
}

interface ProductImage {
  url: string;
  alt?: string;
}

interface ProductVariantPanelProps {
  productId: string;
  name: string;
  image: string;
  price: number;
  slug: string;
  stock: number;
  sizes?: string[] | string;
  colors?: string[] | string;
  variants?: ProductVariant[];
  images?: ProductImage[];
  badge?: string;
}

export default function ProductVariantPanel({
  productId,
  name,
  image,
  price,
  slug,
  stock,
  sizes = [],
  colors = [],
  variants = [],
  images = [],
  badge,
}: ProductVariantPanelProps) {
  const [selectedVariantImage, setSelectedVariantImage] = useState<string>(image);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const galleryImages = useMemo(() => {
    const normalized = Array.isArray(images)
      ? images.map((img) => ({ url: String(img?.url || ""), alt: String(img?.alt || name) }))
      : [];

    const result: ProductImage[] = [];
    if (selectedVariantImage) {
      result.push({ url: selectedVariantImage, alt: `${name} view` });
    }

    normalized.forEach((img) => {
      if (!result.some((entry) => entry.url === img.url) && img.url) {
        result.push(img);
      }
    });

    if (result.length === 0 && image) {
      result.push({ url: image, alt: name });
    }

    return result;
  }, [images, selectedVariantImage, image, name]);

  const handleVariantChange = useCallback((variant: ProductVariant | null) => {
    setSelectedVariant(variant ?? null);
    if (variant?.image && variant.image.trim()) {
      setSelectedVariantImage(variant.image.trim());
      return;
    }
    setSelectedVariantImage(image);
  }, [image]);

  const displayPrice = selectedVariant?.salePrice ?? selectedVariant?.price ?? price;

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">MRP</span>
          <span className="text-xl font-bold text-[#C1121F]">₹{displayPrice.toLocaleString()}</span>
        </div>
        {selectedVariant?.sku && (
          <p className="mt-1 text-xs font-medium text-gray-500">SKU {selectedVariant.sku}</p>
        )}
      </div>

      <div className="w-full flex flex-col pt-4">
        <ProductActions
          productId={productId}
          name={name}
          image={image}
          price={price}
          slug={slug}
          stock={stock}
          sizes={sizes}
          colors={colors}
          variants={variants}
          onVariantChange={handleVariantChange}
        />
      </div>
    </div>
  );
}
