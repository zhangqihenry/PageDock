import crypto from 'node:crypto';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { verifyCsrfToken } from '../middleware/csrf.js';

function secureEqual(left, right) {
  const leftHash = crypto.createHash('sha256').update(left).digest();
  const rightHash = crypto.createHash('sha256').update(right).digest();
  return crypto.timingSafeEqual(leftHash, rightHash);
}

export function createAuthRouter(config) {
  const router = Router();
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: (req, res) => res.locals.t('auth.rateLimited'),
  });

  router.get('/login', (req, res) => {
    if (req.session.authenticated) {
      res.redirect(303, '/_pagedock/');
      return;
    }
    res.render('login', { title: res.locals.t('login.title'), error: null });
  });

  router.post(
    '/login',
    loginLimiter,
    verifyCsrfToken,
    async (req, res, next) => {
      const username = String(req.body.username || '');
      const password = String(req.body.password || '');

      if (
        !secureEqual(username, config.adminUser) ||
        !secureEqual(password, config.adminPassword)
      ) {
        res.status(401).render('login', {
          title: res.locals.t('login.title'),
          error: res.locals.t('auth.invalidCredentials'),
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
          res.redirect(303, '/_pagedock/');
        });
      });
    },
  );

  router.post('/logout', verifyCsrfToken, (req, res, next) => {
    req.session.destroy((error) => {
      if (error) {
        next(error);
        return;
      }
      res.clearCookie('pagedock.sid', { path: '/_pagedock' });
      res.redirect(303, '/');
    });
  });

  return router;
}
