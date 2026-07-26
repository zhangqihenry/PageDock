import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import {
  createTestConfig,
  createZip,
  csrfToken,
  login,
  removeTestData,
  uploadFile,
} from '../test-support/helpers.js';

test('uploads one HTML file, serves it, replaces it explicitly, and deletes it', async (t) => {
  const config = await createTestConfig();
  t.after(() => removeTestData(config));
  const app = await createApp({ config });
  const agent = request.agent(app);
  let adminPage = await login(agent);

  await uploadFile(agent, adminPage.text, {
    pathId: 'sample',
    description: '人力资源示例页面',
    filename: 'tool.html',
    contentType: 'text/html',
    content: Buffer.from('<!doctype html><h1>Version one</h1>'),
  })
    .expect(303)
    .expect('location', '/_pagedock/?status=uploaded');

  await request(app)
    .get('/sample')
    .expect(308)
    .expect('location', '/sample/');
  const firstVersion = await request(app).get('/sample/').expect(200);
  assert.match(firstVersion.text, /Version one/);

  const catalog = await request(app).get('/').expect(200);
  assert.match(catalog.text, /sample/);
  assert.match(catalog.text, /人力资源示例页面/);
  assert.match(catalog.text, /target="_blank"/);

  adminPage = await agent.get('/_pagedock/').expect(200);
  assert.match(adminPage.text, /sample/);
  assert.match(adminPage.text, /人力资源示例页面/);

  const conflict = await uploadFile(agent, adminPage.text, {
    pathId: 'sample',
    filename: 'tool.html',
    contentType: 'text/html',
    content: Buffer.from('<!doctype html><h1>Version two</h1>'),
  }).expect(409);
  assert.match(conflict.text, /覆盖替换/);
  const unchanged = await request(app).get('/sample/').expect(200);
  assert.match(unchanged.text, /Version one/);

  adminPage = await agent.get('/_pagedock/').expect(200);
  await uploadFile(agent, adminPage.text, {
    pathId: 'sample',
    description: '更新后的网页说明',
    overwrite: true,
    filename: 'tool.html',
    contentType: 'text/html',
    content: Buffer.from('<!doctype html><h1>Version two</h1>'),
  }).expect(303);
  const replaced = await request(app).get('/sample/').expect(200);
  assert.match(replaced.text, /Version two/);
  const updatedCatalog = await request(app).get('/').expect(200);
  assert.match(updatedCatalog.text, /更新后的网页说明/);
  assert.doesNotMatch(updatedCatalog.text, /人力资源示例页面/);

  adminPage = await agent.get('/_pagedock/').expect(200);
  await agent
    .post('/_pagedock/sites/sample/delete')
    .type('form')
    .send({ _csrf: csrfToken(adminPage.text) })
    .expect(303);
  await request(app).get('/sample/').expect(404);
});

test('uploads a ZIP and serves relative assets from the site directory', async (t) => {
  const config = await createTestConfig();
  t.after(() => removeTestData(config));
  const app = await createApp({ config });
  const agent = request.agent(app);
  const adminPage = await login(agent);
  const zip = await createZip([
    {
      name: 'index.html',
      content:
        '<!doctype html><link rel="stylesheet" href="./assets/style.css"><h1>ZIP site</h1>',
    },
    { name: 'assets/', directory: true },
    { name: 'assets/style.css', content: 'body { color: teal; }' },
  ]);

  await uploadFile(agent, adminPage.text, {
    pathId: 'zip-tool',
    filename: 'site.zip',
    contentType: 'application/zip',
    content: zip,
  }).expect(303);

  await request(app).get('/zip-tool/').expect(200);
  const css = await request(app)
    .get('/zip-tool/assets/style.css')
    .expect(200)
    .expect('x-content-type-options', 'nosniff');
  assert.equal(css.text, 'body { color: teal; }');
  await request(app).get('/zip-tool/.pagedock.json').expect(404);
});

test('rejects invalid path identifiers and unsupported outer file types', async (t) => {
  const config = await createTestConfig();
  t.after(() => removeTestData(config));
  const app = await createApp({ config });
  const agent = request.agent(app);
  let adminPage = await login(agent);

  await uploadFile(agent, adminPage.text, {
    pathId: '../escape',
    filename: 'tool.html',
    contentType: 'text/html',
    content: Buffer.from('<h1>Unsafe path</h1>'),
  }).expect(400);

  adminPage = await agent.get('/_pagedock/').expect(200);
  await uploadFile(agent, adminPage.text, {
    pathId: 'bad-file',
    filename: 'tool.exe',
    contentType: 'application/octet-stream',
    content: Buffer.from('MZ'),
  }).expect(400);

  adminPage = await agent.get('/_pagedock/').expect(200);
  const longDescription = '页'.repeat(301);
  const response = await uploadFile(agent, adminPage.text, {
    pathId: 'description-too-long',
    description: longDescription,
    filename: 'tool.html',
    contentType: 'text/html',
    content: Buffer.from('<h1>Too much description</h1>'),
  }).expect(400);
  assert.match(response.text, /网页说明不能超过 300 个字符/);
  await request(app).get('/description-too-long/').expect(404);
});
