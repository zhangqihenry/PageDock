import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { AppError } from '../errors.js';

const scrypt = promisify(crypto.scrypt);

// Only salted, slow password hashes are persisted. Never include them in
// catalog, upload, edit, or visibility responses.
export function siteResponse(metadata) {
  const { passwordHash, ...site } = metadata;
  return { ...site, passwordProtected: Boolean(passwordHash) };
}

export async function resolvePasswordHash(existingHash, { passwordProtected, password } = {}) {
  if (passwordProtected === undefined) return existingHash || null;
  if (passwordProtected === false || passwordProtected === 'false') return null;
  if (passwordProtected !== true && passwordProtected !== 'true') {
    throw new AppError('密码保护选项无效。', 400, 'INVALID_PASSWORD_PROTECTION');
  }
  if ((password === undefined || password === '') && existingHash) return existingHash;
  if (typeof password !== 'string' || [...password].length < 6) {
    throw new AppError('访问密码至少需要 6 个字符。', 400, 'SITE_PASSWORD_TOO_SHORT');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${hash.toString('hex')}`;
}

export async function verifySitePassword(password, passwordHash) {
  if (typeof password !== 'string' || typeof passwordHash !== 'string') return false;
  const match = /^scrypt:([a-f0-9]{32}):([a-f0-9]{128})$/.exec(passwordHash);
  if (!match) return false;
  const actual = await scrypt(password, match[1], 64);
  return crypto.timingSafeEqual(actual, Buffer.from(match[2], 'hex'));
}
