import crypto from 'node:crypto';
import { AppError } from '../errors.js';

function tokensMatch(expected, received) {
  if (typeof expected !== 'string' || typeof received !== 'string') {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

export function exposeCsrfToken(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('base64url');
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
}

export function verifyCsrfToken(req, _res, next) {
  const received = req.body?._csrf || req.get('x-csrf-token');
  if (!tokensMatch(req.session?.csrfToken, received)) {
    next(new AppError('请求校验失败，请刷新页面后重试。', 403, 'INVALID_CSRF'));
    return;
  }
  next();
}
