export const CATEGORY_KEYS = {
  DOMESTIC: 'domestic',
  FOOD: 'food',
  EDUCATION: 'education',
  FUN: 'fun',
  OTHER: 'other',
};

export const EXPENSE_CATEGORIES = [
  {
    color: '#00A86B',
    icon: 'home',
    key: CATEGORY_KEYS.DOMESTIC,
    label: 'Custos Domésticos',
  },
  {
    color: '#F97316',
    icon: 'restaurant',
    key: CATEGORY_KEYS.FOOD,
    label: 'Custo Alimentação',
  },
  {
    color: '#3B82F6',
    icon: 'school',
    key: CATEGORY_KEYS.EDUCATION,
    label: 'Custo Ensino',
  },
  {
    color: '#A855F7',
    icon: 'game-controller',
    key: CATEGORY_KEYS.FUN,
    label: 'Diversão',
  },
  {
    color: '#8B949E',
    icon: 'pricetag',
    key: CATEGORY_KEYS.OTHER,
    label: 'Outros',
  },
];

export const getCategoryByKey = (categoryKey) => (
  EXPENSE_CATEGORIES.find((category) => category.key === categoryKey)
  || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]
);

export const getCategoryLabel = (categoryKey, customCategory) => {
  if (categoryKey === CATEGORY_KEYS.OTHER && customCategory) {
    return customCategory;
  }

  return getCategoryByKey(categoryKey).label;
};

export const normalizeCategoryKey = (categoryKey) => {
  if (EXPENSE_CATEGORIES.some((category) => category.key === categoryKey)) {
    return categoryKey;
  }

  return CATEGORY_KEYS.OTHER;
};

export const inferCategoryKey = (categoryLabel) => {
  const normalizedLabel = String(categoryLabel || '').trim().toLowerCase();
  const matchedCategory = EXPENSE_CATEGORIES.find(
    (category) => category.label.toLowerCase() === normalizedLabel
  );

  return matchedCategory?.key || CATEGORY_KEYS.OTHER;
};
