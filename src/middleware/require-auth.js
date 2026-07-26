export function requireAuth(req, res, next) {
  if (req.session?.authenticated === true) {
    next();
    return;
  }

  if (req.accepts('html')) {
    res.redirect(303, '/_pagedock/login');
    return;
  }

  res.status(401).json({ error: 'Authentication required' });
}
