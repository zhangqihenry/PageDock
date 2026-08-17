import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { AppError } from '../../errors.js';
import { requireAuth } from '../../middleware/require-auth.js';
import { verifyCsrfToken } from '../../middleware/csrf.js';

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

export function createAdminSitesRouter(
  config,
  { siteService, uploadSite, createLinkSite },
) {
  const router = Router();
  const upload = createUploadMiddleware(config);

  router.use(requireAuth);

  router.get('/', async (_req, res) => {
    const sites = await siteService.list({ includeDisabled: true });
    res.json({
      sites,
      limits: {
        maxUploadBytes: config.maxUploadBytes,
        maxExtractedBytes: config.maxExtractedBytes,
        maxZipFiles: config.maxZipFiles,
      },
    });
  });

  router.post('/', upload, verifyCsrfToken, async (req, res) => {
    const pathId = String(req.body.pathId || '');
    const title = String(req.body.title || '');
    const description = String(req.body.description || '');
    const version = String(req.body.version || '');
    const overwrite = req.body.overwrite === 'true';

    const metadata =
      req.body.type === 'link'
        ? await createLinkSite({
            pathId,
            title,
            description,
            version,
            linkUrl: String(req.body.linkUrl || ''),
            overwrite,
          })
        : await uploadSite({
            pathId,
            title,
            description,
            version,
            file: req.file,
            overwrite,
          });
    res.status(201).json(metadata);
  });

  router.patch('/:pathId', upload, verifyCsrfToken, async (req, res) => {
    const pathId = req.params.pathId;
    const title = String(req.body.title || '');
    const description = String(req.body.description || '');
    const version = String(req.body.version || '');

    let metadata;
    if (req.file) {
      metadata = await uploadSite({
        pathId,
        title,
        description,
        version,
        file: req.file,
        overwrite: true,
      });
    } else {
      // linkUrl is only applied when the site already on disk is a "link"
      // type (see siteService.update) — harmless to always pass it.
      metadata = await siteService.update(pathId, {
        title,
        description,
        version,
        linkUrl: String(req.body.linkUrl || ''),
      });
    }
    res.json(metadata);
  });

  router.delete('/:pathId', verifyCsrfToken, async (req, res) => {
    await siteService.remove(req.params.pathId);
    res.status(204).end();
  });

  router.post('/:pathId/visibility', verifyCsrfToken, async (req, res) => {
    if (req.body.enabled !== true && req.body.enabled !== false) {
      throw new AppError('网页状态无效。', 400, 'INVALID_SITE_STATUS');
    }
    const metadata = await siteService.setEnabled(
      req.params.pathId,
      req.body.enabled,
    );
    res.json(metadata);
  });

  // Mirrors the admin table's single "save order" submit, which posts
  // every row's pathId/sortOrder pair in one request.
  router.post('/sort-order', verifyCsrfToken, async (req, res) => {
    const entries = Array.isArray(req.body.entries) ? req.body.entries : [];
    await siteService.setSortOrders(
      entries.map((entry) => ({
        pathId: String(entry?.pathId || ''),
        sortOrder: entry?.sortOrder,
      })),
    );
    res.status(204).end();
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
