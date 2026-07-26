import { createApp } from './app.js';
import { loadConfig } from './config.js';

try {
  const config = loadConfig();
  const app = await createApp({ config });
  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`PageDock is listening on port ${config.port}`);
  });

  function shutdown(signal) {
    console.log(`${signal} received, shutting down`);
    server.close((error) => {
      if (error) {
        console.error(error);
        process.exitCode = 1;
      }
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
} catch (error) {
  console.error(`PageDock failed to start: ${error.message}`);
  process.exitCode = 1;
}
