import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import createMemoryStore from 'memorystore';
import { loadConfig } from './config.js';
import {
  errorHandler,
  notFoundHandler,
} from './middleware/error-handler.js';
import { createAdminHostMiddleware } from './middleware/admin-host.js';
import { exposeCsrfToken } from './middleware/csrf.js';
import { createAdminRouter } from './routes/admin.js';
import { createAuthRouter } from './routes/auth.js';
import { createSiteDispatcher } from './routes/site-dispatcher.js';
import {
  dynamicTools as defaultDynamicTools,
  registerDynamicTools,
} from './routes/tools/index.js';
import { createSiteService } from './services/site-service.js';
import { createUploadService } from './services/upload-service.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

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
  const uploadSite = createUploadService(config, siteService);

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.set('view engine', 'ejs');
  app.set('views', path.join(currentDirectory, 'views'));

  app.use(
    '/_pagedock/assets',
    express.static(path.join(currentDirectory, 'public'), {
      dotfiles: 'ignore',
      fallthrough: false,
      maxAge: config.isProduction ? '1h' : 0,
      setHeaders(res) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
      },
    }),
  );

  app.get(
    '/',
    helmet(managementSecurityOptions(config)),
    async (req, res) => {
      const sites = await siteService.list();
      const adminUrl = config.adminHost
        ? `${config.cookieSecure ? 'https' : req.protocol}://${config.adminHost}/_pagedock/`
        : '/_pagedock/';

      res.render('catalog', {
        title: '网页目录',
        sites,
        adminUrl,
      });
    },
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

  const adminHost = createAdminHostMiddleware(config.adminHost);
  app.use('/_pagedock', adminHost);
  app.use(
    '/_pagedock',
    helmet(managementSecurityOptions(config)),
  );
  app.use(
    '/_pagedock',
    express.urlencoded({ extended: false, limit: '32kb' }),
  );
  app.use('/_pagedock', exposeCsrfToken);
  app.use('/_pagedock', createAuthRouter(config));
  app.use(
    '/_pagedock',
    createAdminRouter(config, { siteService, uploadSite }),
  );

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
  app.use(notFoundHandler);
  app.use(errorHandler);

  app.locals.config = config;
  app.locals.services = { siteService, uploadSite };
  return app;
}
