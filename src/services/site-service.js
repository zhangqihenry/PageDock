import fs from 'node:fs/promises';
import path from 'node:path';
import { AppError } from '../errors.js';
import { assertValidPathId, isValidPathId } from '../utils/path-id.js';

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

  async function list() {
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

      const [metadata, stats, sizeBytes] = await Promise.all([
        readMetadata(root),
        fs.stat(root),
        directorySize(root),
      ]);

      sites.push({
        pathId: entry.name,
        title:
          typeof metadata?.title === 'string' && metadata.title
            ? metadata.title
            : entry.name,
        description:
          typeof metadata?.description === 'string'
            ? metadata.description
            : '',
        version:
          typeof metadata?.version === 'string' ? metadata.version : '',
        uploadedAt: metadata?.uploadedAt || stats.mtime.toISOString(),
        sizeBytes,
      });
    }

    sites.sort((left, right) =>
      right.uploadedAt.localeCompare(left.uploadedAt),
    );
    return sites;
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
    list,
    remove,
    siteRoot,
    directorySize,
    metadataFile: METADATA_FILE,
  };
}
