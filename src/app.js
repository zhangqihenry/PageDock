import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import createMemoryStore from 'memorystore';
import { loadConfig } from './config.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { exposeCsrfToken } from './middleware/csrf.js';
import { createSpaShellMiddleware } from './middleware/spa-shell.js';
import { createCatalogRouter } from './routes/api/catalog.js';
import { createAuthApiRouter } from './routes/api/auth.js';
import { createAdminSitesRouter } from './routes/api/admin-sites.js';
import { createAdminSettingsRouter } from './routes/api/admin-settings.js';
import { createSiteDispatcher } from './routes/site-dispatcher.js';
import {
  dynamicTools as defaultDynamicTools,
  registerDynamicTools,
} from './routes/tools/index.js';
import { createSiteService } from './services/site-service.js';
import { createSettingsService } from './services/settings-service.js';
import { createExportService } from './services/export-service.js';
import { createUploadService } from './services/upload-service.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const { version: packageVersion } = JSON.parse(
  readFileSync(path.join(currentDirectory, '..', 'package.json'), 'utf8'),
);
const frontendDistDir = path.join(currentDirectory, '..', 'frontend', 'dist');

// Applied only to PageDock's own surface — the public catalog data, the
// /_pagedock/api JSON endpoints, and the SPA shell fallback — never to
// uploaded site content or dynamic tool routes, which may rely on looser
// headers than helmet's secure defaults allow (inline scripts, cross-origin
// resources, etc.).
function managementSecurityOptions(config) {
  return {
    contentSecurityPolicy: {
      directives: {
        'upgrade-insecure-requests': config.cookieSecure ? [] : null,
      },
    },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    strictTransportSecurity: config.cookieSecure
      ? {
          maxAge: 31_536_000,
          includeSubDomains: false,
          preload: false,
        }
      : false,
  };
}

export async function createApp(options = {}) {
  const config = options.config || loadConfig();
  const app = express();
  const MemoryStore = createMemoryStore(session);
  const siteService = createSiteService(config);
  await siteService.initialize();
  const settingsService = createSettingsService(config);
  const { uploadSite, createLinkSite } = createUploadService(config, siteService);
  const { prepareExport } = createExportService(siteService);

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.locals.assetVersion = packageVersion;

  // Built frontend static assets (hashed JS/CSS/images under /assets/*,
  // plus the favicon/logo). Stateless and public, so it's served ahead of
  // session() with no exposure beyond the one header set manually here.
  app.use(
    express.static(frontendDistDir, {
      index: false,
      dotfiles: 'ignore',
      maxAge: config.isProduction ? '1y' : 0,
      setHeaders(res) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
      },
    }),
  );

  // Public, unauthenticated catalog data — mirrors today's unguarded `/`.
  app.use(
    '/_pagedock/api/catalog',
    helmet(managementSecurityOptions(config)),
    createCatalogRouter(
      { siteService, settingsService },
      { version: packageVersion },
    ),
  );

  app.get('/_pagedock/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(
    session({
      name: 'pagedock.sid',
      secret: config.sessionSecret,
      store: new MemoryStore({
        checkPeriod: Math.min(config.sessionTtlMs, 60 * 60 * 1000),
      }),
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        path: '/_pagedock',
        httpOnly: true,
        sameSite: 'lax',
        secure: config.cookieSecure,
        maxAge: config.sessionTtlMs,
      },
    }),
  );

  app.use('/_pagedock/api', helmet(managementSecurityOptions(config)));
  app.use('/_pagedock/api', express.json({ limit: '32kb' }));
  app.use('/_pagedock/api', exposeCsrfToken);
  app.use('/_pagedock/api/auth', createAuthApiRouter(config));
  app.use(
    '/_pagedock/api/admin/sites',
    createAdminSitesRouter(config, {
      siteService,
      uploadSite,
      createLinkSite,
      prepareExport,
    }),
  );
  app.use(
    '/_pagedock/api/admin/settings',
    createAdminSettingsRouter({ settingsService }),
  );
  // Anything else under /_pagedock/api is an unknown JSON endpoint.
  app.use('/_pagedock/api', notFoundHandler);

  registerDynamicTools(
    app,
    options.dynamicTools || defaultDynamicTools,
    {
      config,
      dataDir: config.dataDir,
      sitesDir: config.sitesDir,
      toolDataDir: config.toolDataDir,
    },
  );

  app.use(createSiteDispatcher(siteService));

  // Anything that reaches this point is neither a static asset, a JSON API
  // route, a dynamic tool route, nor a published site — serve the SPA shell
  // and let Vue Router decide client-side whether it's Home, Admin, or a
  // "not found" view.
  app.use(helmet(managementSecurityOptions(config)));
  app.use(createSpaShellMiddleware(frontendDistDir));

  app.use(errorHandler);

  app.locals.config = config;
  app.locals.services = {
    siteService,
    settingsService,
    uploadSite,
    createLinkSite,
    prepareExport,
  };
  return app;
}
