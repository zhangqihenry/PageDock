import { AppError } from '../errors.js';

export const MAX_DESCRIPTION_LENGTH = 300;
export const MAX_TITLE_LENGTH = 100;
export const MAX_VERSION_LENGTH = 40;
export const DEFAULT_SORT_ORDER = 0;
export const MAX_SORT_ORDER = 999999;
export const MAX_LINK_URL_LENGTH = 2000;
// A site is either an uploaded page (HTML/ZIP, the default) or a "link" —
// a bookmark-like entry that forwards visitors to an external URL instead
// of serving uploaded content. Missing/unrecognized `type` on stored
// metadata is always treated as 'page' for backward compatibility with
// records written before this field existed.
export const SITE_TYPES = Object.freeze(['page', 'link']);

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

// Validates and canonicalizes a "link" site's target URL. Only http/https
// are accepted — this string ends up both in an href the admin UI/catalog
// render directly and in a server-generated redirect page, so schemes like
// `javascript:` or `data:` must never pass through.
export function normalizeLinkUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw) {
    throw new AppError('请填写目标网址。', 400, 'LINK_URL_REQUIRED');
  }
  if (raw.length > MAX_LINK_URL_LENGTH) {
    throw new AppError(
      `目标网址不能超过 ${MAX_LINK_URL_LENGTH} 个字符。`,
      400,
      'LINK_URL_TOO_LONG',
    );
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new AppError(
      '请填写有效的网址，需以 http:// 或 https:// 开头。',
      400,
      'INVALID_LINK_URL',
    );
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new AppError(
      '请填写有效的网址，需以 http:// 或 https:// 开头。',
      400,
      'INVALID_LINK_URL',
    );
  }
  return parsed.toString();
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
