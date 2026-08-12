function parseOptionValues(values) {
  if (Array.isArray(values)) {
    return values
      .flatMap((value) => String(value ?? "").split(","))
      .map((value) => value.trim())
      .filter(Boolean);
  }

  if (typeof values === "string") {
    return values
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeVariant(variant = {}) {
  return {
    size: String(variant.size || "").trim(),
    color: String(variant.color || "").trim(),
    stock: Number(variant.stock || 0),
    sku: String(variant.sku || "").trim(),
    price: typeof variant.price === "number" && !Number.isNaN(variant.price) ? variant.price : null,
    salePrice: typeof variant.salePrice === "number" && !Number.isNaN(variant.salePrice) ? variant.salePrice : null,
    image: String(variant.image || "").trim(),
  };
}

function getResolvedVariant(variants = [], selectedSize = "", selectedColor = "") {
  const normalizedVariants = (Array.isArray(variants) ? variants : [])
    .filter((variant) => variant && typeof variant === "object")
    .map((variant) => normalizeVariant(variant));

  if (normalizedVariants.length === 0) {
    return null;
  }

  return (
    normalizedVariants.find((variant) => {
      const matchesSize = !selectedSize || !variant.size || variant.size === selectedSize;
      const matchesColor = !selectedColor || !variant.color || variant.color === selectedColor;
      return matchesSize && matchesColor;
    }) || null
  );
}

function getVariantOptionValues(baseValues, variants = [], key) {
  const normalizedVariants = (Array.isArray(variants) ? variants : [])
    .filter((variant) => variant && typeof variant === "object")
    .map((variant) => normalizeVariant(variant));

  if (normalizedVariants.length > 0) {
    const values = normalizedVariants
      .map((variant) => variant[key])
      .filter((value) => Boolean(value));

    return Array.from(new Set(values));
  }

  return parseOptionValues(baseValues);
}

module.exports = {
  parseOptionValues,
  normalizeVariant,
  getResolvedVariant,
  getVariantOptionValues,
};
