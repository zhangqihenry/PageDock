import express from 'express';
import { notFoundHandler } from '../middleware/error-handler.js';
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

// A visit is the document a person navigated to — `/<site>/` (or any
// nested directory index) and explicit .html files. The stylesheets,
// scripts, and images that page then pulls in belong to the same visit,
// so counting them would multiply one page load into a dozen views.
function isDocumentRequest(remainder) {
  return remainder.endsWith('/') || /\.html?$/i.test(remainder);
}

export function createSiteDispatcher(siteService, { onPageView = null } = {}) {
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
      // Counted once the response is out and known to be a hit — a 404 for
      // a missing page inside the site isn't a view, but a 304 for a
      // revalidated one is. HEAD probes (uptime checks, link previews)
      // aren't someone reading the page.
      if (
        onPageView &&
        req.method === 'GET' &&
        res.statusCode < 400 &&
        isDocumentRequest(parsed.remainder)
      ) {
        onPageView();
      }
    });
    staticMiddleware(parsed.pathId)(req, res, (error) => {
      req.url = originalUrl;
      if (error) {
        next(error);
        return;
      }
      // `parsed.pathId` is a real, published site — a missing file inside
      // it is a genuine 404, not a path for the SPA shell's client-side
      // router to consider (that catch-all is for paths outside any site).
      notFoundHandler(req, res);
    });
  };
}
