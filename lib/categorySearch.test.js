const test = require('node:test');
const assert = require('node:assert/strict');

const { filterCategoriesForSearch } = require('./categorySearch');

test('filters categories by name and slug while excluding inactive or deleted items', () => {
  const categories = [
    { _id: '1', name: 'Living Room', slug: 'living-room', isActive: true, isDeleted: false },
    { _id: '2', name: 'Bedroom', slug: 'bedroom', isActive: false, isDeleted: false },
    { _id: '3', name: 'Office', slug: 'office', isActive: true, isDeleted: true },
    { _id: '4', name: 'Dining', slug: 'dining', isActive: true, isDeleted: false },
  ];

  const result = filterCategoriesForSearch(categories, 'living');

  assert.deepEqual(result.map((item) => item._id), ['1']);
});

test('returns all active categories when the search string is empty', () => {
  const categories = [
    { _id: '1', name: 'Living Room', slug: 'living-room', isActive: true, isDeleted: false },
    { _id: '2', name: 'Bedroom', slug: 'bedroom', isActive: true, isDeleted: false },
  ];

  const result = filterCategoriesForSearch(categories, '');

  assert.equal(result.length, 2);
});
