import multer from 'multer';
import { AppError } from '../errors.js';

function extractNumber(message) {
  const match = /(\d+)/.exec(message || '');
  return match ? match[1] : '';
}

export function notFoundHandler(req, res) {
  const t = res.locals.t;
  res.status(404).render('404', {
    title: t('notFound.title'),
    message: t('notFound.message'),
  });
}

export function errorHandler(error, req, res, _next) {
  const t = res.locals.t;
  let status = error.status || 500;
  let message = error.message || t('error.generic500');

  if (error instanceof multer.MulterError) {
    status = 400;
    message =
      error.code === 'LIMIT_FILE_SIZE'
        ? t('error.multerFileSize')
        : t('error.multerGeneric', { detail: error.message });
  } else if (error instanceof AppError && error.code) {
    const key = `errorCode.${error.code}`;
    const translated = t(key, { n: extractNumber(error.message) });
    message = translated === key ? error.message : translated;
  } else if (status >= 500) {
    console.error(error);
    message = t('error.generic500');
  }

  if (res.headersSent) {
    return;
  }

  if (req.accepts('html')) {
    res.status(status).render('error', {
      title: status === 409 ? t('error.conflictTitle') : t('error.failureTitle'),
      status,
      message,
      backUrl: '/_pagedock/',
    });
    return;
  }

  res.status(status).json({ error: message });
}
