import { Router } from 'express';

// Public, unauthenticated read of everything the homepage needs in one
// round trip: the enabled site list, the admin-customizable title/subtitle,
// the page-view counters shown in the footer, and a bit of app metadata.
// Mirrors today's unguarded `GET /` — no session or login is required to
// reach this.
export function createCatalogRouter(
  { siteService, settingsService, statsService },
  { version },
) {
  const router = Router();

  router.get('/', async (_req, res) => {
    const [sites, settings] = await Promise.all([
      siteService.list(),
      settingsService.get(),
    ]);

    res.json({
      meta: { version },
      settings,
      sites,
      stats: statsService.summary(),
    });
  });

  return router;
}
