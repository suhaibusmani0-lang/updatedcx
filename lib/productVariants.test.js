const test = require('node:test');
const assert = require('node:assert/strict');
const { getResolvedVariant, getVariantOptionValues } = require('./productVariants');

test('returns the matching variant for a selected size and color', () => {
  const variants = [
    { size: 'S', color: 'Black', stock: 4, sku: 'SKU-1', price: 100, salePrice: 90 },
    { size: 'M', color: 'Red', stock: 2, sku: 'SKU-2', price: 120, salePrice: 110 },
  ];

  const match = getResolvedVariant(variants, 'M', 'Red');
  assert.equal(match?.sku, 'SKU-2');
  assert.equal(match?.stock, 2);
});

test('falls back to base option values when no variant rows exist', () => {
  const sizes = ['S', 'M'];
  const colors = ['Black', 'White'];

  assert.deepEqual(getVariantOptionValues(sizes, [], 'size'), ['S', 'M']);
  assert.deepEqual(getVariantOptionValues(colors, [], 'color'), ['Black', 'White']);
});
