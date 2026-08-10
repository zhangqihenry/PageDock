import { AppError } from '../errors.js';

export const MAX_DESCRIPTION_LENGTH = 300;
export const MAX_TITLE_LENGTH = 100;
export const MAX_VERSION_LENGTH = 40;
export const DEFAULT_SORT_ORDER = 0;
export const MAX_SORT_ORDER = 999999;

export function normalizeDescription(value) {
  const description = String(value || '')
    .replace(/\r\n?/g, '\n')
    .trim();

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw new AppError(
      `网页说明不能超过 ${MAX_DESCRIPTION_LENGTH} 个字符。`,
      400,
      'DESCRIPTION_TOO_LONG',
    );
  }
  return description;
}

export function normalizeTitle(value) {
  const title = String(value || '').trim();

  if (!title) {
    throw new AppError('请填写网页标题。', 400, 'TITLE_REQUIRED');
  }
  if (title.length > MAX_TITLE_LENGTH) {
    throw new AppError(
      `网页标题不能超过 ${MAX_TITLE_LENGTH} 个字符。`,
      400,
      'TITLE_TOO_LONG',
    );
  }
  return title;
}

export function normalizeVersion(value) {
  const version = String(value || '').trim();

  if (version.length > MAX_VERSION_LENGTH) {
    throw new AppError(
      `版本号不能超过 ${MAX_VERSION_LENGTH} 个字符。`,
      400,
      'VERSION_TOO_LONG',
    );
  }
  return version;
}

// Returns a non-negative integer. Pages sort by this number from high to
// low, tied pages falling back to most-recently-uploaded first. Anything
// that isn't a plain non-negative whole number (empty, a decimal, a
// negative number, non-numeric text) is silently treated as the default,
// rather than rejected — this field is edited inline in a table, not
// through a validated form.
export function normalizeSortOrder(value) {
  const raw = String(value ?? '').trim();
  if (!/^\d+$/.test(raw)) {
    return DEFAULT_SORT_ORDER;
  }

  const sortOrder = Number(raw);
  if (!Number.isSafeInteger(sortOrder)) {
    return DEFAULT_SORT_ORDER;
  }
  return Math.min(sortOrder, MAX_SORT_ORDER);
}
