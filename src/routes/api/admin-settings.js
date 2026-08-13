import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import { verifyCsrfToken } from '../../middleware/csrf.js';

export function createAdminSettingsRouter({ settingsService }) {
  const router = Router();

  router.use(requireAuth);

  router.get('/', async (_req, res) => {
    res.json(await settingsService.get());
  });

  router.put('/', verifyCsrfToken, async (req, res) => {
    const settings = await settingsService.update({
      title: req.body?.title,
      subtitle: req.body?.subtitle,
    });
    res.json(settings);
  });

  return router;
}
