import fs from 'node:fs/promises';
import path from 'node:path';
import { AppError } from '../errors.js';
import { assertValidPathId, isValidPathId } from '../utils/path-id.js';
import {
  normalizeDescription,
  normalizeLinkUrl,
  normalizeSortOrder,
  normalizeTitle,
  normalizeVersion,
} from '../utils/metadata-fields.js';
import { renderLinkRedirectHtml } from '../utils/link-redirect-page.js';

const METADATA_FILE = '.pagedock.json';

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function directorySize(directoryPath) {
  let total = 0;
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === METADATA_FILE) {
      continue;
    }

    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      total += await directorySize(entryPath);
    } else if (entry.isFile()) {
      total += (await fs.stat(entryPath)).size;
    }
  }

  return total;
}

async function readMetadata(siteRoot) {
  try {
    const raw = await fs.readFile(path.join(siteRoot, METADATA_FILE), 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }
}

async function writeMetadata(siteRoot, metadata) {
  await fs.writeFile(
    path.join(siteRoot, METADATA_FILE),
    `${JSON.stringify(metadata, null, 2)}\n`,
    'utf8',
  );
}

async function describeSite(pathId, root) {
  const [metadata, stats, sizeBytes] = await Promise.all([
    readMetadata(root),
    fs.stat(root),
    directorySize(root),
  ]);

  return {
    pathId,
    // Absent/unrecognized `type` means this record predates the "link"
    // site feature — always a page.
    type: metadata?.type === 'link' ? 'link' : 'page',
    title:
      typeof metadata?.title === 'string' && metadata.title
        ? metadata.title
        : pathId,
    description:
      typeof metadata?.description === 'string' ? metadata.description : '',
    version: typeof metadata?.version === 'string' ? metadata.version : '',
    linkUrl:
      metadata?.type === 'link' && typeof metadata.linkUrl === 'string'
        ? metadata.linkUrl
        : '',
    uploadedAt: metadata?.uploadedAt || stats.mtime.toISOString(),
    sizeBytes,
    enabled: metadata?.enabled !== false,
    sortOrder: normalizeSortOrder(metadata?.sortOrder),
  };
}

export function createSiteService(config) {
  function siteRoot(pathId) {
    assertValidPathId(pathId);
    return path.join(config.sitesDir, pathId);
  }

  async function initialize() {
    await fs.mkdir(config.dataDir, { recursive: true });
    await fs.mkdir(config.sitesDir, { recursive: true });
    await fs.mkdir(config.toolDataDir, { recursive: true });

    // A process restart means no upload transaction can still be active.
    await fs.rm(config.workDir, { recursive: true, force: true });
    await fs.mkdir(config.uploadDir, { recursive: true });
    await fs.mkdir(config.stagingDir, { recursive: true });
  }

  async function exists(pathId) {
    const root = siteRoot(pathId);
    try {
      const [rootStat, indexStat] = await Promise.all([
        fs.stat(root),
        fs.stat(path.join(root, 'index.html')),
      ]);
      return rootStat.isDirectory() && indexStat.isFile();
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
        return false;
      }
      throw error;
    }
  }

  async function isPublished(pathId) {
    if (!(await exists(pathId))) {
      return false;
    }
    const metadata = await readMetadata(siteRoot(pathId));
    return metadata?.enabled !== false;
  }

  async function list({ includeDisabled = false } = {}) {
    const entries = await fs.readdir(config.sitesDir, { withFileTypes: true });
    const sites = [];

    for (const entry of entries) {
      if (!entry.isDirectory() || !isValidPathId(entry.name)) {
        continue;
      }

      const root = path.join(config.sitesDir, entry.name);
      if (!(await pathExists(path.join(root, 'index.html')))) {
        continue;
      }

      const site = await describeSite(entry.name, root);
      if (includeDisabled || site.enabled) {
        sites.push(site);
      }
    }

    sites.sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return right.sortOrder - left.sortOrder;
      }
      return right.uploadedAt.localeCompare(left.uploadedAt);
    });
    return sites;
  }

  async function get(pathId) {
    const root = siteRoot(pathId);
    if (!(await exists(pathId))) {
      throw new AppError('要修改的网页不存在。', 404, 'SITE_NOT_FOUND');
    }
    return describeSite(pathId, root);
  }

  async function update(pathId, { title, description, version, linkUrl }) {
    const root = siteRoot(pathId);
    if (!(await exists(pathId))) {
      throw new AppError('要修改的网页不存在。', 404, 'SITE_NOT_FOUND');
    }

    const normalizedTitle = normalizeTitle(title);
    const normalizedDescription = normalizeDescription(description);
    const normalizedVersion = normalizeVersion(version);

    const existingMetadata = await readMetadata(root);
    // A site's type is fixed at creation and never trusted from the
    // request — it's read back from what's already on disk, so editing
    // can't be used to flip a page into a link or vice versa.
    const isLink = existingMetadata?.type === 'link';
    let normalizedLinkUrl = '';

    if (isLink) {
      normalizedLinkUrl = normalizeLinkUrl(linkUrl);
      // The redirect target changed — regenerate the stub page that
      // forwards visitors, same as the one createLinkSite() wrote.
      await fs.writeFile(
        path.join(root, 'index.html'),
        renderLinkRedirectHtml(normalizedTitle, normalizedLinkUrl),
        'utf8',
      );
    }

    const [stats, sizeBytes] = await Promise.all([
      fs.stat(root),
      directorySize(root),
    ]);

    const metadata = {
      ...existingMetadata,
      schemaVersion: 5,
      pathId,
      type: isLink ? 'link' : 'page',
      title: normalizedTitle,
      description: normalizedDescription,
      version: normalizedVersion,
      uploadedAt: existingMetadata?.uploadedAt || stats.mtime.toISOString(),
      sizeBytes,
    };
    if (isLink) {
      metadata.linkUrl = normalizedLinkUrl;
    }
    await writeMetadata(root, metadata);
    return metadata;
  }

  async function setSortOrder(pathId, sortOrder) {
    const root = siteRoot(pathId);
    if (!(await exists(pathId))) {
      throw new AppError('要修改的网页不存在。', 404, 'SITE_NOT_FOUND');
    }

    const normalizedSortOrder = normalizeSortOrder(sortOrder);

    const [existingMetadata, site] = await Promise.all([
      readMetadata(root),
      describeSite(pathId, root),
    ]);
    const metadata = {
      ...existingMetadata,
      schemaVersion: 5,
      pathId,
      title: site.title,
      description: site.description,
      version: site.version,
      sortOrder: normalizedSortOrder,
      uploadedAt: site.uploadedAt,
      sizeBytes: site.sizeBytes,
      enabled: site.enabled,
    };
    await writeMetadata(root, metadata);
    return metadata;
  }

  // Saves every row of the admin table's sort-order column in one go.
  // Entries for a pathId that no longer exists (e.g. deleted in another
  // tab before this save) are skipped rather than failing the whole batch.
  async function setSortOrders(entries) {
    for (const entry of entries) {
      const pathId = String(entry?.pathId || '');
      if (!isValidPathId(pathId) || !(await exists(pathId))) {
        continue;
      }
      await setSortOrder(pathId, entry.sortOrder);
    }
  }

  async function setEnabled(pathId, enabled) {
    const root = siteRoot(pathId);
    if (!(await exists(pathId))) {
      throw new AppError('要修改的网页不存在。', 404, 'SITE_NOT_FOUND');
    }

    const [existingMetadata, site] = await Promise.all([
      readMetadata(root),
      describeSite(pathId, root),
    ]);
    const metadata = {
      ...existingMetadata,
      schemaVersion: 5,
      pathId,
      title: site.title,
      description: site.description,
      version: site.version,
      sortOrder: site.sortOrder,
      uploadedAt: site.uploadedAt,
      sizeBytes: site.sizeBytes,
      enabled: Boolean(enabled),
    };
    await writeMetadata(root, metadata);
    return metadata;
  }

  async function remove(pathId) {
    const root = siteRoot(pathId);
    if (!(await exists(pathId))) {
      throw new AppError('要删除的网页不存在。', 404, 'SITE_NOT_FOUND');
    }
    await fs.rm(root, { recursive: true, force: false });
  }

  return {
    initialize,
    exists,
    isPublished,
    list,
    get,
    update,
    setEnabled,
    setSortOrder,
    setSortOrders,
    remove,
    siteRoot,
    directorySize,
    metadataFile: METADATA_FILE,
  };
}
