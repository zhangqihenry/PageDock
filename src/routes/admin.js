import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { AppError } from '../errors.js';
import { requireAuth } from '../middleware/require-auth.js';
import { verifyCsrfToken } from '../middleware/csrf.js';
import { formatBytes } from '../utils/file-size.js';

function createUploadMiddleware(config) {
  const storage = multer.diskStorage({
    destination: config.uploadDir,
    filename(_req, file, callback) {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
    },
  });

  return multer({
    storage,
    limits: {
      fileSize: config.maxUploadBytes,
      files: 1,
      fields: 10,
      fieldSize: 4096,
    },
    fileFilter(_req, file, callback) {
      const extension = path.extname(file.originalname).toLowerCase();
      if (extension !== '.html' && extension !== '.zip') {
        callback(
          new AppError(
            '只接受 .html 文件或 .zip 压缩包。',
            400,
            'INVALID_FILE_TYPE',
          ),
        );
        return;
      }
      callback(null, true);
    },
  }).single('siteFile');
}

function statusMessage(t, status) {
  const keys = {
    uploaded: 'admin.uploaded',
    deleted: 'admin.deleted',
  };
  return keys[status] ? t(keys[status]) : null;
}

export function createAdminRouter(config, services) {
  const router = Router();
  const upload = createUploadMiddleware(config);

  router.use(requireAuth);

  router.get('/', async (req, res) => {
    const sites = await services.siteService.list();
    const dateLocale = res.locals.lang === 'en' ? 'en-US' : 'zh-CN';
    res.render('admin', {
      title: res.locals.t('admin.title'),
      sites: sites.map((site) => ({
        ...site,
        formattedSize: formatBytes(site.sizeBytes),
        formattedDate: new Intl.DateTimeFormat(dateLocale, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(site.uploadedAt)),
      })),
      message: statusMessage(res.locals.t, req.query.status),
      limits: {
        upload: formatBytes(config.maxUploadBytes),
        extracted: formatBytes(config.maxExtractedBytes),
        files: config.maxZipFiles,
      },
    });
  });

  router.post('/upload', upload, verifyCsrfToken, async (req, res) => {
    await services.uploadSite({
      pathId: String(req.body.pathId || ''),
      description: String(req.body.description || ''),
      file: req.file,
      overwrite: req.body.overwrite === 'true',
    });
    res.redirect(303, '/_pagedock/?status=uploaded');
  });

  router.post('/sites/:pathId/delete', verifyCsrfToken, async (req, res) => {
    await services.siteService.remove(req.params.pathId);
    res.redirect(303, '/_pagedock/?status=deleted');
  });

  router.use((error, req, _res, next) => {
    if (!req.file?.path) {
      next(error);
      return;
    }
    fs.rm(req.file.path, { force: true }).then(
      () => next(error),
      () => next(error),
    );
  });

  return router;
}
