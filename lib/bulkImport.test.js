import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBadge, parseNumberValue } from './bulkImport.js';

test('normalizeBadge preserves supported badge casing', () => {
  assert.equal(normalizeBadge('best seller'), 'Best Seller');
  assert.equal(normalizeBadge('new'), 'New');
  assert.equal(normalizeBadge('sale'), 'Sale');
});

test('parseNumberValue handles currency strings and commas', () => {
  assert.equal(parseNumberValue('₹1,299'), 1299);
  assert.equal(parseNumberValue('10'), 10);
  assert.equal(parseNumberValue(''), null);
});
