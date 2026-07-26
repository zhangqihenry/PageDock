import { Router } from 'express';

/**
 * Example descriptor for a future trusted dynamic tool.
 *
 * Import it from ./index.js and add it to `dynamicTools` when you intentionally
 * want to enable it. This example is not registered by default.
 */
export const exampleDynamicTool = {
  id: 'example-tool',
  createRouter({ toolDataDir, pathId }) {
    const router = Router();

    router.post('/submit', (_req, res) => {
      res.status(501).json({
        message: 'Implement this tool-specific handler in source code.',
        privateDataDirectory: `${toolDataDir}/${pathId}`,
      });
    });

    return router;
  },
};
