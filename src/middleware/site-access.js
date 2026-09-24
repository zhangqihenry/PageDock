import crypto from 'node:crypto';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { AppError } from '../errors.js';
import { verifyCsrfToken } from './csrf.js';
import { assertValidPathId, isValidPathId } from '../utils/path-id.js';
import { verifySitePassword } from '../utils/site-password.js';
import { splitRequestUrl } from '../routes/site-dispatcher.js';

export function createSiteAccess(config, siteService, dynamicTools = []) {
  const router = Router();
  const toolIds = new Map(dynamicTools.map((tool) => [tool.id.toLowerCase(), tool.id]));
  const cookieName = (pathId) => `pagedock.access.${pathId}`;
  const signature = (pathId, passwordHash, expires) => crypto
    .createHmac('sha256', config.sessionSecret)
    .update(JSON.stringify(['site-access', pathId, passwordHash, expires]))
    .digest('hex');

  function hasAccess(req, pathId, passwordHash) {
    const prefix = `${cookieName(pathId)}=`;
    const value = (req.headers.cookie || '').split(';')
      .map((part) => part.trim()).find((part) => part.startsWith(prefix))?.slice(prefix.length);
    const match = /^(\d+)\.([a-f0-9]{64})$/.exec(value || '');
    if (!match || Number(match[1]) <= Date.now()) return false;
    const expected = signature(pathId, passwordHash, match[1]);
    return crypto.timingSafeEqual(Buffer.from(match[2], 'hex'), Buffer.from(expected, 'hex'));
  }

  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  async function publishedAccess(pathId) {
    assertValidPathId(pathId);
    const access = await siteService.getAccess(pathId);
    if (!access?.enabled) throw new AppError('网页不存在或已停用。', 404, 'SITE_NOT_FOUND');
    return access;
  }

  router.get('/:pathId', async (req, res) => {
    const access = await publishedAccess(req.params.pathId);
    const site = await siteService.get(req.params.pathId);
    res.json({ title: site.title, passwordProtected: Boolean(access.passwordHash) });
  });

  const unlockLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler(_req, res) {
      res.status(429).json({ error: '密码尝试次数过多，请稍后重试。', code: 'UNLOCK_RATE_LIMITED', params: {} });
    },
  });

  router.post('/:pathId', verifyCsrfToken, unlockLimiter, async (req, res) => {
    const { pathId } = req.params;
    const access = await publishedAccess(pathId);
    if (access.passwordHash) {
      if (!(await verifySitePassword(req.body?.password, access.passwordHash))) {
        throw new AppError('访问密码错误，请重试。', 401, 'INVALID_SITE_PASSWORD');
      }
      const expires = String(Date.now() + config.sessionTtlMs);
      res.cookie(cookieName(pathId), `${expires}.${signature(pathId, access.passwordHash, expires)}`, {
        path: `/${pathId}`,
        httpOnly: true,
        sameSite: 'lax',
        secure: config.cookieSecure,
        maxAge: config.sessionTtlMs,
      });
    }
    // Only return to a path inside this site, including nested pages and
    // query strings. URL normalization rejects encoded traversal/backslashes.
    let returnTo = `/${pathId}/`;
    try {
      const target = new URL(String(req.body?.returnTo || ''), 'https://pagedock.invalid');
      const decoded = decodeURIComponent(target.pathname);
      const parsedTarget = splitRequestUrl(target.pathname);
      if (target.origin === 'https://pagedock.invalid' &&
          parsedTarget?.pathId === pathId &&
          !decoded.includes('\\') && !decoded.split('/').some((part) => part === '..' || part === '.')) {
        returnTo = `/${pathId}${parsedTarget.remainder || '/'}${target.search}${target.hash}`;
      }
    } catch { /* Fall back to the site's homepage. */ }
    res.json({ returnTo });
  });

  async function guard(req, res, next) {
    const parsed = splitRequestUrl(req.url);
    if (!parsed || !isValidPathId(parsed.pathId)) return next();
    // Express tool mounts are case-insensitive. Resolve their registered
    // spelling too so case variants cannot bypass the site's password.
    const pathId = /^\/api(?:\/|$)/i.test(parsed.remainder)
      ? toolIds.get(parsed.pathId.toLowerCase()) || parsed.pathId
      : parsed.pathId;
    const access = await siteService.getAccess(pathId);
    if (!access?.passwordHash) return next();
    res.set('Cache-Control', 'private, no-store');
    res.vary('Cookie');
    if (!access.enabled) throw new AppError('网页不存在或已停用。', 404, 'SITE_NOT_FOUND');
    if (hasAccess(req, pathId, access.passwordHash)) return next();
    if (req.method === 'GET' || req.method === 'HEAD') {
      res.redirect(303, `/_pagedock/unlock/${encodeURIComponent(pathId)}?returnTo=${encodeURIComponent(req.originalUrl)}`);
      return;
    }
    throw new AppError('请输入访问密码。', 401, 'SITE_PASSWORD_REQUIRED');
  }

  return { router, guard };
}
