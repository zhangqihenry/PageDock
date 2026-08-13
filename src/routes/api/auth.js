import crypto from 'node:crypto';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { verifyCsrfToken } from '../../middleware/csrf.js';

function secureEqual(left, right) {
  const leftHash = crypto.createHash('sha256').update(left).digest();
  const rightHash = crypto.createHash('sha256').update(right).digest();
  return crypto.timingSafeEqual(leftHash, rightHash);
}

export function createAuthApiRouter(config) {
  const router = Router();
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler(_req, res) {
      res.status(429).json({
        error: 'Too many login attempts. Please try again later.',
        code: 'RATE_LIMITED',
        params: {},
      });
    },
  });

  // The frontend calls this on boot (and whenever it opens the login modal)
  // to learn whether the current session is authenticated and to fetch a
  // fresh CSRF token for the next mutating request.
  router.get('/session', (req, res) => {
    res.json({
      authenticated: req.session.authenticated === true,
      csrfToken: res.locals.csrfToken,
    });
  });

  router.post('/login', loginLimiter, verifyCsrfToken, (req, res, next) => {
    const username = String(req.body?.username || '');
    const password = String(req.body?.password || '');

    if (
      !secureEqual(username, config.adminUser) ||
      !secureEqual(password, config.adminPassword)
    ) {
      res.status(401).json({
        error: 'Incorrect username or password.',
        code: 'INVALID_CREDENTIALS',
        params: {},
      });
      return;
    }

    req.session.regenerate((error) => {
      if (error) {
        next(error);
        return;
      }
      req.session.authenticated = true;
      req.session.csrfToken = crypto.randomBytes(32).toString('base64url');
      req.session.save((saveError) => {
        if (saveError) {
          next(saveError);
          return;
        }
        res.json({ authenticated: true, csrfToken: req.session.csrfToken });
      });
    });
  });

  router.post('/logout', verifyCsrfToken, (req, res, next) => {
    req.session.destroy((error) => {
      if (error) {
        next(error);
        return;
      }
      res.clearCookie('pagedock.sid', { path: '/_pagedock' });
      res.json({ authenticated: false });
    });
  });

  return router;
}
