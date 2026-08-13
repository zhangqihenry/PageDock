export function requireAuth(req, res, next) {
  if (req.session?.authenticated === true) {
    next();
    return;
  }

  res.status(401).json({
    error: 'Authentication required.',
    code: 'AUTH_REQUIRED',
    params: {},
  });
}
