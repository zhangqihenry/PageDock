import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { AppError } from '../errors.js';
import { requireAuth } from '../middleware/require-auth.js';
import { verifyCsrfToken } from '../middleware/csrf.js';
import { formatBytes } from '../utils/file-size.js';
import { formatUploadedAt } from '../utils/date.js';

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
    updated: 'admin.updated',
    disabled: 'admin.disabled',
    enabled: 'admin.enabled',
  };
  return keys[status] ? t(keys[status]) : null;
}

export function createAdminRouter(config, services) {
  const router = Router();
  const upload = createUploadMiddleware(config);

  router.use(requireAuth);

  router.get('/', async (req, res) => {
    const sites = await services.siteService.list({ includeDisabled: true });
    res.render('admin', {
      title: res.locals.t('admin.title'),
      sites: sites.map((site) => ({
        ...site,
        formattedSize: formatBytes(site.sizeBytes),
        formattedDate: formatUploadedAt(site.uploadedAt),
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
      title: String(req.body.title || ''),
      description: String(req.body.description || ''),
      version: String(req.body.version || ''),
      sortOrder: String(req.body.sortOrder || ''),
      file: req.file,
      overwrite: req.body.overwrite === 'true',
    });
    res.redirect(303, '/_pagedock/?status=uploaded');
  });

  router.get('/sites/:pathId/edit', async (req, res) => {
    const site = await services.siteService.get(req.params.pathId);
    res.render('edit', {
      title: res.locals.t('edit.title'),
      site: {
        ...site,
        formattedDate: formatUploadedAt(site.uploadedAt),
      },
      limits: {
        upload: formatBytes(config.maxUploadBytes),
        extracted: formatBytes(config.maxExtractedBytes),
        files: config.maxZipFiles,
      },
    });
  });

  router.post('/sites/:pathId/edit', upload, verifyCsrfToken, async (req, res) => {
    const pathId = req.params.pathId;
    const title = String(req.body.title || '');
    const description = String(req.body.description || '');
    const version = String(req.body.version || '');
    const sortOrder = String(req.body.sortOrder || '');

    if (req.file) {
      await services.uploadSite({
        pathId,
        title,
        description,
        version,
        sortOrder,
        file: req.file,
        overwrite: true,
      });
    } else {
      await services.siteService.update(pathId, {
        title,
        description,
        version,
        sortOrder,
      });
    }
    res.redirect(303, '/_pagedock/?status=updated');
  });

  router.post('/sites/:pathId/delete', verifyCsrfToken, async (req, res) => {
    await services.siteService.remove(req.params.pathId);
    res.redirect(303, '/_pagedock/?status=deleted');
  });

  router.post('/sites/:pathId/visibility', verifyCsrfToken, async (req, res) => {
    if (req.body.enabled !== 'true' && req.body.enabled !== 'false') {
      throw new AppError('网页状态无效。', 400, 'INVALID_SITE_STATUS');
    }
    const enabled = req.body.enabled === 'true';
    await services.siteService.setEnabled(req.params.pathId, enabled);
    res.redirect(303, `/_pagedock/?status=${enabled ? 'enabled' : 'disabled'}`);
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
