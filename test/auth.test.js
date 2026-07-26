import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import {
  createTestConfig,
  csrfToken,
  login,
  removeTestData,
} from '../test-support/helpers.js';

test('management routes require login and logout destroys the session', async (t) => {
  const config = await createTestConfig();
  t.after(() => removeTestData(config));
  const app = await createApp({ config });
  const agent = request.agent(app);

  const catalog = await agent.get('/').expect(200);
  assert.match(catalog.text, /网页目录/);
  assert.match(catalog.text, /上传网页/);

  await agent
    .get('/_pagedock/')
    .expect(303)
    .expect('location', '/_pagedock/login');

  const loginPage = await agent.get('/_pagedock/login').expect(200);
  assert.equal(loginPage.headers['strict-transport-security'], undefined);
  assert.doesNotMatch(
    loginPage.headers['content-security-policy'],
    /upgrade-insecure-requests/,
  );
  assert.doesNotMatch(loginPage.headers['set-cookie'][0], /;\s*Secure/i);

  await agent
    .post('/_pagedock/login')
    .type('form')
    .send({
      _csrf: csrfToken(loginPage.text),
      username: 'admin',
      password: 'wrong password',
    })
    .expect(401);

  const adminPage = await login(agent);
  assert.match(adminPage.text, /上传网页/);

  await agent
    .post('/_pagedock/logout')
    .type('form')
    .send({ _csrf: csrfToken(adminPage.text) })
    .expect(303)
    .expect('location', '/');

  await agent.get('/_pagedock/').expect(303);
  await agent.get('/').expect(200);
});

test('HTTPS proxy mode sends Secure cookies and HTTPS-only headers', async (t) => {
  const config = await createTestConfig({
    COOKIE_SECURE: 'true',
    TRUST_PROXY: '1',
  });
  t.after(() => removeTestData(config));
  const app = await createApp({ config });

  const response = await request(app)
    .get('/_pagedock/login')
    .set('x-forwarded-proto', 'https')
    .expect(200);

  assert.match(response.headers['strict-transport-security'], /max-age=/);
  assert.match(
    response.headers['content-security-policy'],
    /upgrade-insecure-requests/,
  );
  assert.match(response.headers['set-cookie'][0], /;\s*Secure/i);
});

test('state-changing management routes reject missing CSRF tokens', async (t) => {
  const config = await createTestConfig();
  t.after(() => removeTestData(config));
  const app = await createApp({ config });
  const agent = request.agent(app);

  await login(agent);
  const response = await agent
    .post('/_pagedock/sites/not-there/delete')
    .type('form')
    .send({})
    .expect(403);

  assert.match(response.text, /请求校验失败/);
});

test('ADMIN_HOST hides management routes on other hosts', async (t) => {
  const config = await createTestConfig({
    ADMIN_HOST: 'admin.example.test',
    COOKIE_SECURE: 'true',
    TRUST_PROXY: '1',
  });
  t.after(() => removeTestData(config));
  const app = await createApp({ config });

  const catalog = await request(app)
    .get('/')
    .set('host', 'tools.example.test')
    .set('x-forwarded-proto', 'https')
    .expect(200);
  assert.match(
    catalog.text,
    /https:\/\/admin\.example\.test\/_pagedock\//,
  );

  await request(app)
    .get('/_pagedock/login')
    .set('host', 'tools.example.test')
    .set('x-forwarded-host', 'admin.example.test')
    .expect(404);
  await request(app)
    .get('/_pagedock/login')
    .set('host', 'admin.example.test')
    .set('x-forwarded-proto', 'https')
    .expect(200);
});
