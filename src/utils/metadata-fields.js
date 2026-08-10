import { AppError } from '../errors.js';

export const MAX_DESCRIPTION_LENGTH = 300;
export const MAX_TITLE_LENGTH = 100;
export const MAX_VERSION_LENGTH = 40;
export const MIN_SORT_ORDER = -999999;
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

// Returns an integer, or null when no sort order was provided. Pages with a
// sort order are shown above pages without one, ordered by that number from
// high to low; pages without one fall back to most-recently-uploaded first.
export function normalizeSortOrder(value) {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return null;
  }

  if (!/^-?\d+$/.test(raw)) {
    throw new AppError('排序数字必须是整数。', 400, 'SORT_ORDER_INVALID');
  }

  const sortOrder = Number(raw);
  if (
    !Number.isSafeInteger(sortOrder) ||
    sortOrder < MIN_SORT_ORDER ||
    sortOrder > MAX_SORT_ORDER
  ) {
    throw new AppError(
      `排序数字必须在 ${MIN_SORT_ORDER} 到 ${MAX_SORT_ORDER} 之间。`,
      400,
      'SORT_ORDER_INVALID',
    );
  }
  return sortOrder;
}
