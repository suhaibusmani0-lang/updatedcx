export function parseBulkInventoryUpdates(input = "") {
  const updates = [];
  const errors = [];

  if (typeof input !== "string" || !input.trim()) {
    return {
      updates,
      errors: ["Please enter at least one SKU and stock value."],
    };
  }

  const lines = input.split(/\r?\n/);

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) return;

    const normalized = line.replace(/^[-*#]\s*/, "");
    const columns = normalized.split(/[\s,;|\t]+/).filter(Boolean);

    if (columns.length < 2) {
      errors.push(`Line ${index + 1}: expected SKU and stock value.`);
      return;
    }

    const sku = columns[0].toUpperCase();
    const stock = Number(columns[1]);

    if (!sku) {
      errors.push(`Line ${index + 1}: SKU is required.`);
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      errors.push(`Line ${index + 1}: stock must be a non-negative whole number.`);
      return;
    }

    updates.push({ sku, stock });
  });

  return { updates, errors };
}
