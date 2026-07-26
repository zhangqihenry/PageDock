export function createAdminHostMiddleware(adminHost) {
  return function adminHostMiddleware(req, res, next) {
    const hostHeader = req.get('host') || '';
    let requestHostname = '';
    try {
      requestHostname = new URL(`http://${hostHeader}`).hostname.toLowerCase();
    } catch {
      requestHostname = '';
    }

    if (!adminHost || requestHostname === adminHost) {
      next();
      return;
    }

    res.status(404).render('404', {
      title: '页面不存在',
      message: '请求的页面不存在。',
    });
  };
}
