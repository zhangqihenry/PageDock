import {
  LOCALE_COOKIE,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  createTranslator,
} from '../i18n.js';

function parseCookieHeader(header) {
  const jar = {};
  if (!header) {
    return jar;
  }
  for (const part of header.split(';')) {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }
    const key = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();
    if (key) {
      jar[key] = decodeURIComponent(value);
    }
  }
  return jar;
}

export function createLocaleMiddleware(config) {
  return function locale(req, res, next) {
    const requested = typeof req.query.lang === 'string' ? req.query.lang : null;

    if (requested && SUPPORTED_LOCALES.includes(requested)) {
      res.cookie(LOCALE_COOKIE, requested, {
        maxAge: 400 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
        secure: config.cookieSecure,
      });
      const url = new URL(req.originalUrl, 'http://placeholder.invalid');
      url.searchParams.delete('lang');
      res.redirect(303, `${url.pathname}${url.search}`);
      return;
    }

    const cookies = parseCookieHeader(req.headers.cookie);
    const activeLocale = SUPPORTED_LOCALES.includes(cookies[LOCALE_COOKIE])
      ? cookies[LOCALE_COOKIE]
      : DEFAULT_LOCALE;

    req.locale = activeLocale;
    res.locals.lang = activeLocale;
    res.locals.t = createTranslator(activeLocale);
    next();
  };
}
