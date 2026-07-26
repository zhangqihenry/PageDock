import { isValidPathId } from '../../utils/path-id.js';

// Add trusted, source-controlled dynamic tool descriptors to this array.
// Uploaded files are never loaded as server-side modules.
export const dynamicTools = [];

export function registerDynamicTools(app, tools, context) {
  const registered = new Set();

  for (const tool of tools) {
    if (
      !tool ||
      !isValidPathId(tool.id) ||
      typeof tool.createRouter !== 'function'
    ) {
      throw new Error('Invalid dynamic tool descriptor');
    }
    if (registered.has(tool.id)) {
      throw new Error(`Duplicate dynamic tool id: ${tool.id}`);
    }

    const router = tool.createRouter({
      ...context,
      pathId: tool.id,
    });
    app.use(`/${tool.id}/api`, router);
    registered.add(tool.id);
  }

  return registered;
}
