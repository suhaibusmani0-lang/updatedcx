const normalize = (value) => String(value || '').trim().toLowerCase();

function filterCategoriesForSearch(categories, search) {
  const term = normalize(search);

  return (categories || []).filter((category) => {
    if (!category || category.isDeleted) return false;
    if (category.isActive === false) return false;

    if (!term) return true;

    const haystack = [category.name, category.slug, category.description]
      .filter(Boolean)
      .map(normalize)
      .join(' ');

    return haystack.includes(term);
  });
}

module.exports = {
  filterCategoriesForSearch,
};
