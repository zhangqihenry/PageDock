import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import yazl from 'yazl';
import { AppError } from '../errors.js';

const METADATA_FILE = '.pagedock.json';

// Every regular file under `root`, as POSIX-style paths relative to it.
// PageDock's own metadata file is left out so an exported archive is
// exactly what a re-upload would accept — extractZipSafely() rejects any
// ZIP that carries a .pagedock.json of its own.
async function collectFiles(root, prefix = '') {
  const entries = await fs.readdir(path.join(root, prefix), {
    withFileTypes: true,
  });
  const files = [];

  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    if (!prefix && entry.name === METADATA_FILE) {
      continue;
    }

    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(root, relative)));
    } else if (entry.isFile()) {
      files.push(relative);
    }
    // Anything else (symlink, socket, device) is skipped: uploads can never
    // produce one, so its presence means the data directory was edited from
    // outside PageDock and it isn't part of the uploaded site.
  }

  return files;
}

// Hands an uploaded site back in the shape it arrived in: a single-file
// HTML upload exports as one .html file, a ZIP upload is repacked from the
// extracted tree. Which one a site was is recorded on upload (and inferred
// for older records) — see site-service.js.
export function createExportService(siteService) {
  async function prepareExport(pathId) {
    const site = await siteService.get(pathId);

    if (site.type === 'link') {
      throw new AppError(
        '网址类型的网页没有可导出的文件。',
        400,
        'EXPORT_NOT_AVAILABLE',
      );
    }

    const root = siteService.siteRoot(pathId);

    if (site.sourceKind === 'html') {
      return {
        kind: 'html',
        filename: `${pathId}.html`,
        stream: createReadStream(path.join(root, 'index.html')),
      };
    }

    const files = await collectFiles(root);
    const archive = new yazl.ZipFile();
    for (const relative of files) {
      archive.addFile(path.join(root, ...relative.split('/')), relative);
    }
    archive.end();

    return {
      kind: 'zip',
      filename: `${pathId}.zip`,
      stream: archive.outputStream,
    };
  }

  return { prepareExport };
}
