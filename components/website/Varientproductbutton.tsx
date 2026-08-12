"use client";

import { useState, useMemo, useCallback } from "react";
import ProductGalleries from "@/components/website/ProductGalleries";

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

export const Varientproductbutton = ({
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
}: ProductVariantPanelProps) => {
  const [selectedVariantImage, setSelectedVariantImage] = useState<string>(image);

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
    if (variant?.image && variant.image.trim()) {
      setSelectedVariantImage(variant.image.trim());
      return;
    }
    setSelectedVariantImage(image);
  }, [image]);

  return (
    <div className="w-full">
      <ProductGalleries images={galleryImages} name={name} badge={badge} />
    </div>
  );
};