import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import yazl from 'yazl';
import { loadConfig } from '../src/config.js';

export async function createTestConfig(overrides = {}) {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pagedock-test-'));
  return loadConfig({
    NODE_ENV: 'test',
    DATA_DIR: dataDir,
    ADMIN_USER: 'admin',
    ADMIN_PASSWORD: 'correct horse battery staple',
    SESSION_SECRET: 'test-session-secret-with-at-least-32-bytes',
    COOKIE_SECURE: 'false',
    TRUST_PROXY: 'false',
    ...overrides,
  });
}

export async function removeTestData(config) {
  await fs.rm(config.dataDir, { recursive: true, force: true });
}

export function csrfToken(html) {
  const match = html.match(/name="_csrf" value="([^"]+)"/);
  if (!match) {
    throw new Error('CSRF token not found in response');
  }
  return match[1];
}

export async function login(agent) {
  const loginPage = await agent.get('/_pagedock/login').expect(200);
  await agent
    .post('/_pagedock/login')
    .type('form')
    .send({
      _csrf: csrfToken(loginPage.text),
      username: 'admin',
      password: 'correct horse battery staple',
    })
    .expect(303)
    .expect('location', '/_pagedock/');
  return agent.get('/_pagedock/').expect(200);
}

export function createZip(entries) {
  return new Promise((resolve, reject) => {
    const archive = new yazl.ZipFile();
    const chunks = [];

    for (const entry of entries) {
      if (entry.directory) {
        archive.addEmptyDirectory(entry.name);
      } else {
        archive.addBuffer(
          Buffer.isBuffer(entry.content)
            ? entry.content
            : Buffer.from(entry.content),
          entry.name,
          entry.options,
        );
      }
    }

    archive.outputStream.on('data', (chunk) => chunks.push(chunk));
    archive.outputStream.once('error', reject);
    archive.outputStream.once('end', () => resolve(Buffer.concat(chunks)));
    archive.end();
  });
}

export function uploadFile(agent, pageHtml, options) {
  return agent
    .post('/_pagedock/upload')
    .field('_csrf', csrfToken(pageHtml))
    .field('pathId', options.pathId)
    .field('description', options.description ?? '')
    .field('overwrite', String(options.overwrite ?? false))
    .attach('siteFile', options.content, {
      filename: options.filename,
      contentType: options.contentType,
    });
}
