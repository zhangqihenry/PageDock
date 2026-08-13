import { AppError } from '../errors.js';

export const MAX_CATALOG_TITLE_LENGTH = 100;
export const MAX_CATALOG_SUBTITLE_LENGTH = 300;

// Mirrors the validation shape of metadata-fields.js: the catalog title is
// required (it's the page's main heading), the subtitle is optional.
export function normalizeCatalogTitle(value) {
  const title = String(value || '').trim();

  if (!title) {
    throw new AppError('请填写目录标题。', 400, 'CATALOG_TITLE_REQUIRED');
  }
  if (title.length > MAX_CATALOG_TITLE_LENGTH) {
    throw new AppError(
      `目录标题不能超过 ${MAX_CATALOG_TITLE_LENGTH} 个字符。`,
      400,
      'CATALOG_TITLE_TOO_LONG',
    );
  }
  return title;
}

export function normalizeCatalogSubtitle(value) {
  const subtitle = String(value || '')
    .replace(/\r\n?/g, '\n')
    .trim();

  if (subtitle.length > MAX_CATALOG_SUBTITLE_LENGTH) {
    throw new AppError(
      `目录副标题不能超过 ${MAX_CATALOG_SUBTITLE_LENGTH} 个字符。`,
      400,
      'CATALOG_SUBTITLE_TOO_LONG',
    );
  }
  return subtitle;
}
