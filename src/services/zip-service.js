import fs from 'node:fs/promises';
import path from 'node:path';
import unzipper from 'unzipper';
import { AppError } from '../errors.js';

const ZIP_SIGNATURES = new Set(['504b0304', '504b0506']);
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = Buffer.from([
  0x50, 0x4b, 0x05, 0x06,
]);
const MAX_ZIP_COMMENT_BYTES = 0xffff;
const UNIX_FILE_TYPE_MASK = 0xf000;
const UNIX_SYMLINK_TYPE = 0xa000;

export function validateZipEntryPath(entryPath) {
  if (
    typeof entryPath !== 'string' ||
    !entryPath ||
    entryPath.includes('\0') ||
    entryPath.includes('\\') ||
    entryPath.startsWith('/') ||
    /^[A-Za-z]:/.test(entryPath)
  ) {
    throw new AppError(
      `ZIP 中包含不安全的路径：${entryPath || '(empty)'}`,
      400,
      'UNSAFE_ZIP_PATH',
    );
  }

  const isDirectory = entryPath.endsWith('/');
  const segments = entryPath.split('/');
  if (isDirectory) {
    segments.pop();
  }

  if (
    segments.length === 0 ||
    segments.some(
      (segment) => segment === '' || segment === '.' || segment === '..',
    )
  ) {
    throw new AppError(
      `ZIP 中包含不安全的路径：${entryPath}`,
      400,
      'UNSAFE_ZIP_PATH',
    );
  }

  const normalized = segments.join('/');
  if (path.posix.basename(normalized) === '.pagedock.json') {
    throw new AppError(
      'ZIP 不能包含 PageDock 的内部元数据文件。',
      400,
      'RESERVED_ZIP_FILE',
    );
  }
  return { normalized, isDirectory };
}

function getDeclaredSize(entry) {
  const size = Number(
    entry.uncompressedSize ?? entry.vars?.uncompressedSize ?? 0,
  );
  if (!Number.isSafeInteger(size) || size < 0) {
    throw new AppError(
      `ZIP 条目大小无效：${entry.path}`,
      400,
      'INVALID_ZIP_SIZE',
    );
  }
  return size;
}

function isSymlink(entry) {
  const attributes = Number(
    entry.externalFileAttributes ??
      entry.vars?.externalFileAttributes ??
      0,
  );
  const unixMode = (attributes >>> 16) & 0xffff;
  return (unixMode & UNIX_FILE_TYPE_MASK) === UNIX_SYMLINK_TYPE;
}

async function assertZipSignature(zipPath) {
  const handle = await fs.open(zipPath, 'r');
  try {
    const signature = Buffer.alloc(4);
    const { bytesRead } = await handle.read(signature, 0, 4, 0);
    if (
      bytesRead !== 4 ||
      !ZIP_SIGNATURES.has(signature.toString('hex').toLowerCase())
    ) {
      throw new AppError(
        '上传文件不是有效的 ZIP 压缩包。',
        400,
        'INVALID_ZIP_SIGNATURE',
      );
    }
  } finally {
    await handle.close();
  }
}

async function inspectCentralDirectory(zipPath, maxZipFiles) {
  const stats = await fs.stat(zipPath);
  const tailLength = Math.min(
    stats.size,
    22 + MAX_ZIP_COMMENT_BYTES,
  );
  if (tailLength < 22) {
    throw new AppError('ZIP 压缩包结构无效。', 400, 'INVALID_ZIP');
  }

  const handle = await fs.open(zipPath, 'r');
  try {
    const tail = Buffer.alloc(tailLength);
    await handle.read(tail, 0, tailLength, stats.size - tailLength);
    const eocdOffset = tail.lastIndexOf(END_OF_CENTRAL_DIRECTORY_SIGNATURE);
    if (eocdOffset === -1 || eocdOffset + 22 > tail.length) {
      throw new AppError('ZIP 压缩包结构无效。', 400, 'INVALID_ZIP');
    }

    const diskNumber = tail.readUInt16LE(eocdOffset + 4);
    const centralDirectoryDisk = tail.readUInt16LE(eocdOffset + 6);
    const entriesOnDisk = tail.readUInt16LE(eocdOffset + 8);
    const totalEntries = tail.readUInt16LE(eocdOffset + 10);
    const centralDirectorySize = tail.readUInt32LE(eocdOffset + 12);
    const centralDirectoryOffset = tail.readUInt32LE(eocdOffset + 16);
    const commentLength = tail.readUInt16LE(eocdOffset + 20);

    if (
      diskNumber !== 0 ||
      centralDirectoryDisk !== 0 ||
      entriesOnDisk !== totalEntries
    ) {
      throw new AppError(
        '不支持分卷 ZIP 压缩包。',
        400,
        'MULTI_DISK_ZIP',
      );
    }
    if (
      totalEntries === 0xffff ||
      centralDirectorySize === 0xffffffff ||
      centralDirectoryOffset === 0xffffffff
    ) {
      throw new AppError(
        '当前上传限制不需要 ZIP64，已拒绝该压缩包。',
        400,
        'ZIP64_NOT_ALLOWED',
      );
    }
    if (totalEntries > maxZipFiles) {
      throw new AppError(
        `ZIP 文件条目超过 ${maxZipFiles} 个的限制。`,
        400,
        'ZIP_FILE_COUNT_LIMIT',
      );
    }
    if (
      eocdOffset + 22 + commentLength !== tail.length ||
      centralDirectoryOffset + centralDirectorySize > stats.size
    ) {
      throw new AppError('ZIP 压缩包结构无效。', 400, 'INVALID_ZIP');
    }

    return totalEntries;
  } finally {
    await handle.close();
  }
}

async function writeEntry(entry, destination, limits, state) {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const output = await fs.open(destination, 'wx');
  const input = entry.stream();

  try {
    for await (const chunk of input) {
      state.actualBytes += chunk.length;
      if (state.actualBytes > limits.maxExtractedBytes) {
        throw new AppError(
          'ZIP 解压后的实际总大小超过限制。',
          400,
          'EXTRACTED_SIZE_LIMIT',
        );
      }
      let offset = 0;
      while (offset < chunk.length) {
        const { bytesWritten } = await output.write(
          chunk,
          offset,
          chunk.length - offset,
        );
        if (bytesWritten === 0) {
          throw new Error('Unable to make progress while writing ZIP entry');
        }
        offset += bytesWritten;
      }
    }
  } finally {
    input.destroy();
    await output.close();
  }
}

export async function extractZipSafely(zipPath, destinationRoot, limits) {
  await assertZipSignature(zipPath);
  const expectedEntryCount = await inspectCentralDirectory(
    zipPath,
    limits.maxZipFiles,
  );

  let archive;
  try {
    archive = await unzipper.Open.file(zipPath);
  } catch {
    throw new AppError(
      'ZIP 压缩包损坏或无法读取。',
      400,
      'INVALID_ZIP',
    );
  }

  if (
    archive.files.length !== expectedEntryCount ||
    archive.files.length > limits.maxZipFiles
  ) {
    throw new AppError(
      'ZIP 中央目录的条目数量不一致。',
      400,
      'INVALID_ZIP',
    );
  }

  const preparedEntries = [];
  const seenPaths = new Set();
  const filePaths = new Set();
  let declaredBytes = 0;

  for (const entry of archive.files) {
    const safePath = validateZipEntryPath(entry.path);
    if (seenPaths.has(safePath.normalized)) {
      throw new AppError(
        `ZIP 中包含重复路径：${safePath.normalized}`,
        400,
        'DUPLICATE_ZIP_PATH',
      );
    }
    seenPaths.add(safePath.normalized);

    if (
      safePath.isDirectory !== (entry.type === 'Directory') ||
      (entry.flags & 0x1) !== 0
    ) {
      throw new AppError(
        `ZIP 中包含不支持或加密的条目：${safePath.normalized}`,
        400,
        'UNSUPPORTED_ZIP_ENTRY',
      );
    }

    if (isSymlink(entry)) {
      throw new AppError(
        `ZIP 中不允许符号链接：${safePath.normalized}`,
        400,
        'ZIP_SYMLINK',
      );
    }

    if (entry.type !== 'File' && entry.type !== 'Directory') {
      throw new AppError(
        `ZIP 中包含不支持的条目类型：${safePath.normalized}`,
        400,
        'UNSUPPORTED_ZIP_ENTRY',
      );
    }

    const segments = safePath.normalized.split('/');
    for (let index = 1; index < segments.length; index += 1) {
      const ancestor = segments.slice(0, index).join('/');
      if (filePaths.has(ancestor)) {
        throw new AppError(
          `ZIP 中存在文件与目录路径冲突：${safePath.normalized}`,
          400,
          'ZIP_PATH_CONFLICT',
        );
      }
    }

    if (entry.type === 'File') {
      for (const existingPath of seenPaths) {
        if (
          existingPath !== safePath.normalized &&
          existingPath.startsWith(`${safePath.normalized}/`)
        ) {
          throw new AppError(
            `ZIP 中存在文件与目录路径冲突：${safePath.normalized}`,
            400,
            'ZIP_PATH_CONFLICT',
          );
        }
      }
      filePaths.add(safePath.normalized);

      if (![0, 8].includes(entry.compressionMethod)) {
        throw new AppError(
          `ZIP 条目使用了不支持的压缩方式：${safePath.normalized}`,
          400,
          'UNSUPPORTED_ZIP_COMPRESSION',
        );
      }

      declaredBytes += getDeclaredSize(entry);
      if (declaredBytes > limits.maxExtractedBytes) {
        throw new AppError(
          'ZIP 声明的解压后总大小超过限制。',
          400,
          'EXTRACTED_SIZE_LIMIT',
        );
      }
    }

    preparedEntries.push({ entry, ...safePath });
  }

  const state = { actualBytes: 0 };
  for (const prepared of preparedEntries) {
    const destination = path.join(
      destinationRoot,
      ...prepared.normalized.split('/'),
    );
    const relative = path.relative(destinationRoot, destination);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new AppError(
        `ZIP 路径超出目标目录：${prepared.normalized}`,
        400,
        'UNSAFE_ZIP_PATH',
      );
    }

    if (prepared.entry.type === 'Directory') {
      await fs.mkdir(destination, { recursive: true });
    } else {
      await writeEntry(prepared.entry, destination, limits, state);
    }
  }

  return {
    fileCount: preparedEntries.filter(({ entry }) => entry.type === 'File')
      .length,
    extractedBytes: state.actualBytes,
  };
}
