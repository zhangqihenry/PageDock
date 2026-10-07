import { Router } from 'express';
import { resolveCategoryId } from '../../utils/category-fields.js';

// Public, unauthenticated read of everything the homepage needs in one
// round trip: the enabled site list and the categories it's filed under,
// the admin-customizable title/subtitle,
// the page-view counters shown in the footer, and a bit of app metadata.
// Mirrors today's unguarded `GET /` — no session or login is required to
// reach this.
export function createCatalogRouter(
  { siteService, settingsService, statsService, categoryService },
  { version },
) {
  const router = Router();

  router.get('/', async (_req, res) => {
    const [sites, settings, categories] = await Promise.all([
      siteService.list(),
      settingsService.get(),
      categoryService.list(),
    ]);

    res.json({
      meta: { version },
      settings,
      categories,
      sites: sites.map((site) => ({
        ...site,
        linkUrl: site.passwordProtected ? '' : site.linkUrl,
        categoryId: resolveCategoryId(site.categoryId, categories),
      })),
      stats: statsService.summary(),
    });
  });

  return router;
}
