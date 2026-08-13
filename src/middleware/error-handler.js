import multer from 'multer';
import { AppError } from '../errors.js';

// Every AppError message that carries a numeric limit (e.g. "cannot exceed
// 300 characters") gets that number pulled out as `params.n`, so the
// frontend's i18n dictionary can interpolate it into the localized string
// without the backend needing to know the viewer's language.
function extractParams(message) {
  const match = /(\d+)/.exec(message || '');
  return match ? { n: match[1] } : {};
}

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Not found', code: 'NOT_FOUND', params: {} });
}

export function errorHandler(error, _req, res, _next) {
  if (res.headersSent) {
    return;
  }

  let status = error.status || 500;
  let code = 'APP_ERROR';
  let message = error.message || 'A server error occurred.';
  let params = {};

  if (error instanceof multer.MulterError) {
    status = 400;
    if (error.code === 'LIMIT_FILE_SIZE') {
      code = 'UPLOAD_TOO_LARGE';
    } else {
      code = 'UPLOAD_ERROR';
      params = { detail: error.message };
    }
    message = error.message;
  } else if (error instanceof AppError) {
    code = error.code;
    params = extractParams(error.message);
  } else if (status >= 500) {
    console.error(error);
    message = 'A server error occurred. Please try again later.';
  }

  res.status(status).json({ error: message, code, params });
}
