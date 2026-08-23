import crypto from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { AppError, ConflictError } from '../errors.js';
import { assertValidPathId } from '../utils/path-id.js';
import {
  DEFAULT_SORT_ORDER,
  normalizeDescription,
  normalizeLinkUrl,
  normalizeTitle,
  normalizeVersion,
} from '../utils/metadata-fields.js';
import { renderLinkRedirectHtml } from '../utils/link-redirect-page.js';
import { extractZipSafely } from './zip-service.js';

const ACCEPTED_MIME_TYPES = Object.freeze({
  '.html': new Set([
    'text/html',
    'application/xhtml+xml',
    'application/octet-stream',
  ]),
  '.zip': new Set([
    'application/zip',
    'application/x-zip-compressed',
    'application/octet-stream',
  ]),
});

export function validateUploadFile(file) {
  if (!file) {
    throw new AppError('请选择要上传的 HTML 或 ZIP 文件。', 400, 'NO_FILE');
  }

  const extension = path.extname(file.originalname).toLowerCase();
  const acceptedMimeTypes = ACCEPTED_MIME_TYPES[extension];
  if (!acceptedMimeTypes || !acceptedMimeTypes.has(file.mimetype)) {
    throw new AppError(
      '只接受 .html 文件或 .zip 压缩包。',
      400,
      'INVALID_FILE_TYPE',
    );
  }
  return extension;
}

async function validateHtmlFile(htmlPath) {
  const handle = await fs.open(htmlPath, 'r');
  try {
    const sample = Buffer.alloc(64 * 1024);
    const { bytesRead } = await handle.read(sample, 0, sample.length, 0);
    if (sample.subarray(0, bytesRead).includes(0)) {
      throw new AppError(
        'HTML 文件包含无效的二进制内容。',
        400,
        'INVALID_HTML',
      );
    }
  } finally {
    await handle.close();
  }
}

async function writeMetadata(
  stagingRoot,
  pathId,
  title,
  description,
  version,
  sourceKind,
  sortOrder,
  sizeBytes,
  enabled,
) {
  const metadata = {
    schemaVersion: 6,
    pathId,
    type: 'page',
    title,
    description,
    version,
    // Which of the two accepted upload shapes this site came from — the
    // extracted files on disk look the same either way, so the export
    // feature has no other way to hand the admin back what they uploaded.
    sourceKind,
    sortOrder,
    uploadedAt: new Date().toISOString(),
    sizeBytes,
    enabled,
  };
  await fs.writeFile(
    path.join(stagingRoot, '.pagedock.json'),
    `${JSON.stringify(metadata, null, 2)}\n`,
    { encoding: 'utf8', flag: 'wx' },
  );
  return metadata;
}

// A "link" site has no uploaded content — its staging directory gets a
// generated index.html that immediately forwards visitors to `linkUrl`
// (see link-redirect-page.js), plus the same kind of metadata file a page
// upload writes. It's promoted through the exact same
// promoteStagingDirectory() path, so conflict/overwrite handling is
// identical to a regular upload.
async function writeLinkFiles(
  stagingRoot,
  pathId,
  title,
  description,
  version,
  linkUrl,
  sortOrder,
  enabled,
) {
  const html = renderLinkRedirectHtml(title, linkUrl);
  await fs.writeFile(path.join(stagingRoot, 'index.html'), html, {
    encoding: 'utf8',
    flag: 'wx',
  });

  const metadata = {
    schemaVersion: 6,
    pathId,
    type: 'link',
    title,
    description,
    version,
    linkUrl,
    sortOrder,
    uploadedAt: new Date().toISOString(),
    sizeBytes: Buffer.byteLength(html, 'utf8'),
    enabled,
  };
  await fs.writeFile(
    path.join(stagingRoot, '.pagedock.json'),
    `${JSON.stringify(metadata, null, 2)}\n`,
    { encoding: 'utf8', flag: 'wx' },
  );
  return metadata;
}

async function promoteStagingDirectory(stagingRoot, targetRoot, overwrite) {
  let targetExists = false;
  try {
    targetExists = (await fs.stat(targetRoot)).isDirectory();
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  if (targetExists && !overwrite) {
    throw new ConflictError(
      '该网页名称或访问路径已经存在。请选择“覆盖替换”后重新上传，或取消本次操作。',
    );
  }

  if (!targetExists) {
    await fs.rename(stagingRoot, targetRoot);
    return;
  }

  const backupRoot = `${stagingRoot}.backup`;
  await fs.rename(targetRoot, backupRoot);
  try {
    await fs.rename(stagingRoot, targetRoot);
  } catch (error) {
    await fs.rename(backupRoot, targetRoot);
    throw error;
  }
  await fs.rm(backupRoot, { recursive: true, force: true });
}

export function createUploadService(config, siteService) {
  async function uploadSite({
    pathId,
    title,
    description,
    version,
    file,
    overwrite = false,
  }) {
    assertValidPathId(pathId);
    const normalizedTitle = normalizeTitle(title);
    const normalizedDescription = normalizeDescription(description);
    const normalizedVersion = normalizeVersion(version);
    const extension = validateUploadFile(file);
    const stagingRoot = path.join(
      config.stagingDir,
      `${Date.now()}-${crypto.randomUUID()}`,
    );
    const targetRoot = siteService.siteRoot(pathId);
    let enabled = true;
    // The sort order is only ever set from the admin table, never here — an
    // upload (including replacing a page's file) always keeps whatever sort
    // order the page already had, and a brand new page gets the default.
    let sortOrder = DEFAULT_SORT_ORDER;
    let promoted = false;

    if (overwrite && (await siteService.exists(pathId))) {
      const existing = await siteService.get(pathId);
      enabled = existing.enabled;
      sortOrder = existing.sortOrder;
    }

    await fs.mkdir(stagingRoot, { recursive: false });

    try {
      if (extension === '.html') {
        await validateHtmlFile(file.path);
        await fs.copyFile(
          file.path,
          path.join(stagingRoot, 'index.html'),
          fsConstants.COPYFILE_EXCL,
        );
      } else {
        await extractZipSafely(file.path, stagingRoot, {
          maxExtractedBytes: config.maxExtractedBytes,
          maxZipFiles: config.maxZipFiles,
        });
      }

      let indexStats;
      try {
        indexStats = await fs.stat(path.join(stagingRoot, 'index.html'));
      } catch (error) {
        if (error.code === 'ENOENT') {
          throw new AppError(
            'ZIP 根目录下必须存在 index.html。',
            400,
            'MISSING_INDEX',
          );
        }
        throw error;
      }

      if (!indexStats.isFile()) {
        throw new AppError(
          'ZIP 根目录下的 index.html 必须是普通文件。',
          400,
          'INVALID_INDEX',
        );
      }

      const sizeBytes = await siteService.directorySize(stagingRoot);
      const metadata = await writeMetadata(
        stagingRoot,
        pathId,
        normalizedTitle,
        normalizedDescription,
        normalizedVersion,
        extension === '.zip' ? 'zip' : 'html',
        sortOrder,
        sizeBytes,
        enabled,
      );
      await promoteStagingDirectory(stagingRoot, targetRoot, overwrite);
      promoted = true;
      return metadata;
    } finally {
      await fs.rm(file.path, { force: true }).catch(() => {});
      if (!promoted) {
        await fs.rm(stagingRoot, { recursive: true, force: true }).catch(() => {});
      }
    }
  }

  // Same shape as uploadSite (validate → stage → promote), but for a "link"
  // site: no file involved, the staged content is a generated redirect page.
  async function createLinkSite({
    pathId,
    title,
    description,
    version,
    linkUrl,
    overwrite = false,
  }) {
    assertValidPathId(pathId);
    const normalizedTitle = normalizeTitle(title);
    const normalizedDescription = normalizeDescription(description);
    const normalizedVersion = normalizeVersion(version);
    const normalizedLinkUrl = normalizeLinkUrl(linkUrl);
    const stagingRoot = path.join(
      config.stagingDir,
      `${Date.now()}-${crypto.randomUUID()}`,
    );
    const targetRoot = siteService.siteRoot(pathId);
    let enabled = true;
    let sortOrder = DEFAULT_SORT_ORDER;
    let promoted = false;

    if (overwrite && (await siteService.exists(pathId))) {
      const existing = await siteService.get(pathId);
      enabled = existing.enabled;
      sortOrder = existing.sortOrder;
    }

    await fs.mkdir(stagingRoot, { recursive: false });

    try {
      const metadata = await writeLinkFiles(
        stagingRoot,
        pathId,
        normalizedTitle,
        normalizedDescription,
        normalizedVersion,
        normalizedLinkUrl,
        sortOrder,
        enabled,
      );
      await promoteStagingDirectory(stagingRoot, targetRoot, overwrite);
      promoted = true;
      return metadata;
    } finally {
      if (!promoted) {
        await fs.rm(stagingRoot, { recursive: true, force: true }).catch(() => {});
      }
    }
  }

  return { uploadSite, createLinkSite };
}

export { ACCEPTED_MIME_TYPES };
export {
  DEFAULT_SORT_ORDER,
  MAX_DESCRIPTION_LENGTH,
  MAX_LINK_URL_LENGTH,
  MAX_SORT_ORDER,
  MAX_TITLE_LENGTH,
  MAX_VERSION_LENGTH,
  normalizeDescription,
  normalizeLinkUrl,
  normalizeSortOrder,
  normalizeTitle,
  normalizeVersion,
} from '../utils/metadata-fields.js';
