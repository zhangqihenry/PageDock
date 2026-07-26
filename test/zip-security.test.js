import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { validateZipEntryPath } from '../src/services/zip-service.js';
import {
  createTestConfig,
  createZip,
  login,
  removeTestData,
  uploadFile,
} from '../test-support/helpers.js';

test('ZIP entry path validation blocks traversal and ambiguous paths', () => {
  for (const unsafe of [
    '../index.html',
    'folder/../../index.html',
    '/absolute/index.html',
    'C:/index.html',
    'folder\\index.html',
    'folder//index.html',
    './index.html',
    'bad\0name',
  ]) {
    assert.throws(() => validateZipEntryPath(unsafe), {
      code: 'UNSAFE_ZIP_PATH',
    });
  }

  assert.deepEqual(validateZipEntryPath('assets/style.css'), {
    normalized: 'assets/style.css',
    isDirectory: false,
  });
});

test('rejects ZIP without a root index.html and cleans temporary data', async (t) => {
  const config = await createTestConfig();
  t.after(() => removeTestData(config));
  const app = await createApp({ config });
  const agent = request.agent(app);
  const adminPage = await login(agent);
  const zip = await createZip([
    { name: 'nested/index.html', content: '<h1>Nested only</h1>' },
  ]);

  const response = await uploadFile(agent, adminPage.text, {
    pathId: 'nested-tool',
    filename: 'nested.zip',
    contentType: 'application/zip',
    content: zip,
  }).expect(400);
  assert.match(response.text, /根目录下必须存在 index\.html/);

  const uploadEntries = await configPathEntries(config.uploadDir);
  const stagingEntries = await configPathEntries(config.stagingDir);
  assert.deepEqual(uploadEntries, []);
  assert.deepEqual(stagingEntries, []);
});

test('enforces ZIP file count and extracted-size limits', async (t) => {
  const config = await createTestConfig({
    MAX_ZIP_FILES: '1',
    MAX_EXTRACTED_MB: '0.00002',
  });
  t.after(() => removeTestData(config));
  const app = await createApp({ config });
  const agent = request.agent(app);
  let adminPage = await login(agent);
  const tooManyFiles = await createZip([
    { name: 'index.html', content: '<h1>Index</h1>' },
    { name: 'style.css', content: 'body{}' },
  ]);

  await uploadFile(agent, adminPage.text, {
    pathId: 'too-many',
    filename: 'many.zip',
    contentType: 'application/zip',
    content: tooManyFiles,
  }).expect(400);

  adminPage = await agent.get('/_pagedock/').expect(200);
  const tooLarge = await createZip([
    { name: 'index.html', content: 'x'.repeat(100) },
  ]);
  const response = await uploadFile(agent, adminPage.text, {
    pathId: 'too-large',
    filename: 'large.zip',
    contentType: 'application/zip',
    content: tooLarge,
  }).expect(400);
  assert.match(response.text, /总大小超过限制/);
});

test('rejects symbolic links stored in ZIP archives', async (t) => {
  const config = await createTestConfig();
  t.after(() => removeTestData(config));
  const app = await createApp({ config });
  const agent = request.agent(app);
  const adminPage = await login(agent);
  const zip = await createZip([
    { name: 'index.html', content: '<h1>Index</h1>' },
    {
      name: 'linked-file',
      content: 'outside-target',
      options: { mode: 0o120777 },
    },
  ]);

  const response = await uploadFile(agent, adminPage.text, {
    pathId: 'symlink-tool',
    filename: 'symlink.zip',
    contentType: 'application/zip',
    content: zip,
  }).expect(400);
  assert.match(response.text, /不允许符号链接/);
});

async function configPathEntries(directory) {
  const { readdir } = await import('node:fs/promises');
  return readdir(directory);
}
