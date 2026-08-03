import express from 'express';
import { isValidPathId } from '../utils/path-id.js';

function splitRequestUrl(requestUrl) {
  const queryIndex = requestUrl.indexOf('?');
  const rawPath =
    queryIndex === -1 ? requestUrl : requestUrl.slice(0, queryIndex);
  const query = queryIndex === -1 ? '' : requestUrl.slice(queryIndex);
  const match = rawPath.match(/^\/([^/]+)(\/.*)?$/);
  if (!match) {
    return null;
  }

  try {
    return {
      pathId: decodeURIComponent(match[1]),
      remainder: match[2] || '',
      query,
    };
  } catch {
    return null;
  }
}

export function createSiteDispatcher(siteService) {
  const middlewareCache = new Map();

  function staticMiddleware(pathId) {
    if (!middlewareCache.has(pathId)) {
      middlewareCache.set(
        pathId,
        express.static(siteService.siteRoot(pathId), {
          dotfiles: 'ignore',
          etag: true,
          fallthrough: true,
          index: 'index.html',
          lastModified: true,
          redirect: false,
          setHeaders(res, filePath) {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            if (filePath.endsWith('index.html')) {
              res.setHeader('Cache-Control', 'no-cache');
            }
          },
        }),
      );
    }
    return middlewareCache.get(pathId);
  }

  return async function siteDispatcher(req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }

    const parsed = splitRequestUrl(req.url);
    if (!parsed || !isValidPathId(parsed.pathId)) {
      next();
      return;
    }
    if (!(await siteService.isPublished(parsed.pathId))) {
      next();
      return;
    }

    if (parsed.remainder === '') {
      res.redirect(308, `/${encodeURIComponent(parsed.pathId)}/`);
      return;
    }

    const originalUrl = req.url;
    req.url = `${parsed.remainder}${parsed.query}`;
    res.once('finish', () => {
      req.url = originalUrl;
    });
    staticMiddleware(parsed.pathId)(req, res, (error) => {
      req.url = originalUrl;
      next(error);
    });
  };
}
