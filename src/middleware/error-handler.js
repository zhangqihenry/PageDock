import multer from 'multer';
import { AppError } from '../errors.js';

export function notFoundHandler(req, res) {
  res.status(404).render('404', {
    title: '页面不存在',
    message: '请求的页面或网页不存在。',
  });
}

export function errorHandler(error, req, res, _next) {
  let status = error.status || 500;
  let message = error.message || '服务器发生错误。';

  if (error instanceof multer.MulterError) {
    status = 400;
    message =
      error.code === 'LIMIT_FILE_SIZE'
        ? '上传文件超过允许的大小限制。'
        : `上传失败：${error.message}`;
  } else if (!(error instanceof AppError) && status >= 500) {
    console.error(error);
    message = '服务器发生错误，请稍后重试。';
  }

  if (res.headersSent) {
    return;
  }

  if (req.accepts('html')) {
    res.status(status).render('error', {
      title: status === 409 ? '路径冲突' : '操作失败',
      status,
      message,
      backUrl: '/_pagedock/',
    });
    return;
  }

  res.status(status).json({ error: message });
}
