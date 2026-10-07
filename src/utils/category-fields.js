import { AppError } from '../errors.js';

export const MAX_CATEGORY_NAME_LENGTH = 30;

export function normalizeCategoryName(value) {
  const name = String(value || '').trim();

  if (!name) {
    throw new AppError('请填写分类名称。', 400, 'CATEGORY_NAME_REQUIRED');
  }
  if (name.length > MAX_CATEGORY_NAME_LENGTH) {
    throw new AppError(
      `分类名称不能超过 ${MAX_CATEGORY_NAME_LENGTH} 个字符。`,
      400,
      'CATEGORY_NAME_TOO_LONG',
    );
  }
  return name;
}

// Pages remember the id of the category they were filed under. An id that
// no longer matches any category (a record written before categories
// existed, or one whose category was deleted mid-reassignment) falls back
// to the first category, so every page always lands somewhere visible.
export function resolveCategoryId(categoryId, categories) {
  return categories.some((category) => category.id === categoryId)
    ? categoryId
    : categories[0].id;
}
