import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import {
  createTestConfig,
  login,
  removeTestData,
  uploadFile,
} from '../test-support/helpers.js';

test('uploaded webpages and descriptions survive app recreation and remain replaceable', async (t) => {
  const config = await createTestConfig();
  t.after(() => removeTestData(config));

  const firstApp = await createApp({ config });
  const firstAgent = request.agent(firstApp);
  const firstAdminPage = await login(firstAgent);

  await uploadFile(firstAgent, firstAdminPage.text, {
    pathId: 'persistent-tool',
    description: '重启后仍应保留的说明',
    filename: 'tool.html',
    contentType: 'text/html',
    content: Buffer.from('<h1>Before restart</h1>'),
  }).expect(303);

  // Recreating the app mirrors a container restart: work data is cleaned, but
  // published site data must remain available and manageable.
  const restartedApp = await createApp({ config });
  const persisted = await request(restartedApp)
    .get('/persistent-tool/')
    .expect(200);
  assert.match(persisted.text, /Before restart/);
  const persistedCatalog = await request(restartedApp).get('/').expect(200);
  assert.match(persistedCatalog.text, /重启后仍应保留的说明/);

  const restartedAgent = request.agent(restartedApp);
  const restartedAdminPage = await login(restartedAgent);
  await uploadFile(restartedAgent, restartedAdminPage.text, {
    pathId: 'persistent-tool',
    description: '替换后的说明',
    overwrite: true,
    filename: 'tool.html',
    contentType: 'text/html',
    content: Buffer.from('<h1>After restart</h1>'),
  }).expect(303);

  const replaced = await request(restartedApp)
    .get('/persistent-tool/')
    .expect(200);
  assert.match(replaced.text, /After restart/);
  const replacedCatalog = await request(restartedApp).get('/').expect(200);
  assert.match(replacedCatalog.text, /替换后的说明/);
});

test('webpages uploaded before descriptions were added remain visible', async (t) => {
  const config = await createTestConfig();
  t.after(() => removeTestData(config));

  const legacyRoot = path.join(config.sitesDir, 'legacy-page');
  await fs.mkdir(legacyRoot, { recursive: true });
  await fs.writeFile(
    path.join(legacyRoot, 'index.html'),
    '<h1>Legacy page</h1>',
  );
  await fs.writeFile(
    path.join(legacyRoot, '.pagedock.json'),
    JSON.stringify({
      schemaVersion: 1,
      pathId: 'legacy-page',
      uploadedAt: '2025-01-01T00:00:00.000Z',
      sizeBytes: 20,
    }),
  );

  const app = await createApp({ config });
  const catalog = await request(app).get('/').expect(200);
  assert.match(catalog.text, /legacy-page/);
  assert.match(catalog.text, /暂无说明/);
  await request(app).get('/legacy-page/').expect(200);
});
