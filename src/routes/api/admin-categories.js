import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import { verifyCsrfToken } from '../../middleware/csrf.js';

export function createAdminCategoriesRouter({ categoryService, siteService }) {
  const router = Router();

  router.use(requireAuth);

  router.get('/', async (_req, res) => {
    res.json({ categories: await categoryService.list() });
  });

  router.post('/', verifyCsrfToken, async (req, res) => {
    const category = await categoryService.create(req.body?.name);
    res.status(201).json(category);
  });

  // Mirrors the admin list's up/down buttons, which post the full new
  // order of category ids in one request.
  router.put('/order', verifyCsrfToken, async (req, res) => {
    const categories = await categoryService.reorder(req.body?.ids);
    res.json({ categories });
  });

  router.patch('/:id', verifyCsrfToken, async (req, res) => {
    const category = await categoryService.rename(req.params.id, req.body?.name);
    res.json(category);
  });

  // Pages in a deleted category move to the first remaining one rather
  // than disappearing from the homepage.
  router.delete('/:id', verifyCsrfToken, async (req, res) => {
    const successor = await categoryService.remove(req.params.id);
    await siteService.reassignCategory(req.params.id, successor.id);
    res.status(204).end();
  });

  return router;
}
