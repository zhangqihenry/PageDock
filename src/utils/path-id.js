import { AppError } from '../errors.js';

export const PATH_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
export const RESERVED_PATH_IDS = new Set(['_pagedock']);

export function isValidPathId(value) {
  return (
    typeof value === 'string' &&
    PATH_ID_PATTERN.test(value) &&
    !RESERVED_PATH_IDS.has(value.toLowerCase())
  );
}

export function assertValidPathId(value) {
  if (!isValidPathId(value)) {
    throw new AppError(
      '路径标识只能包含字母、数字、连字符和下划线，长度为 1–64 个字符，且不能使用保留名称。',
      400,
      'INVALID_PATH_ID',
    );
  }
  return value;
}
