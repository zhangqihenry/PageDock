import assert from 'node:assert/strict';
import test from 'node:test';
import express, { Router } from 'express';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createTestConfig, removeTestData } from '../test-support/helpers.js';

test('a source-controlled dynamic tool mounts before static dispatch', async (t) => {
  const config = await createTestConfig();
  t.after(() => removeTestData(config));

  const tool = {
    id: 'signing-tool',
    createRouter(context) {
      const router = Router();
      router.use(express.json());
      router.post('/submit', (req, res) => {
        res.json({
          received: req.body.name,
          dataRoot: context.toolDataDir,
        });
      });
      return router;
    },
  };
  const app = await createApp({ config, dynamicTools: [tool] });

  const response = await request(app)
    .post('/signing-tool/api/submit')
    .send({ name: 'Alice' })
    .expect(200);
  assert.equal(response.body.received, 'Alice');
  assert.equal(response.body.dataRoot, config.toolDataDir);
});

test('unmatched paths use the unified 404 page', async (t) => {
  const config = await createTestConfig();
  t.after(() => removeTestData(config));
  const app = await createApp({ config });

  const response = await request(app).get('/does-not-exist/').expect(404);
  assert.match(response.text, /网页不存在/);
});
