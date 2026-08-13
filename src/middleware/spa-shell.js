import fs from 'node:fs';
import path from 'node:path';

// Serves the built frontend's index.html for every GET/HEAD request that
// reaches this point in the stack — which, by the time it's mounted in
// app.js, means the request wasn't a static asset, a JSON API route, a
// dynamic tool route, or a published site. Vue Router then decides
// client-side whether that path is Home, Admin, or "not found".
//
// index.html is read once and cached in memory: it never changes while the
// process is running (a new build produces a new process via redeploy), and
// re-reading it from disk on every request would be wasted work.
export function createSpaShellMiddleware(distDir) {
  const indexPath = path.join(distDir, 'index.html');
  let cachedHtml = null;

  function loadHtml() {
    if (cachedHtml === null) {
      cachedHtml = fs.readFileSync(indexPath, 'utf8');
    }
    return cachedHtml;
  }

  return function spaShell(req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }

    let html;
    try {
      html = loadHtml();
    } catch (error) {
      if (error.code === 'ENOENT') {
        res
          .status(500)
          .type('text/plain')
          .send(
            'PageDock: frontend build not found. Run `npm run build` ' +
              '(or `npm run dev`) before starting the server.',
          );
        return;
      }
      next(error);
      return;
    }

    res.status(200).type('html').send(html);
  };
}
