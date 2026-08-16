# 本地开发与动态工具扩展 / Local Development & Dynamic Tool Extensions

[← 返回 README](../README.md) · [← Back to README](../README.md)

## 本地开发 / Development

前端（目录首页和后台管理页面）是 `frontend/` 目录下的 Vue 3 + Vite +
Vue Router + Pinia 单页应用，作为 npm workspace 和 `src/` 下的 Express
后端一起管理。需要 Node.js 24 及以上版本。

The frontend (the catalog homepage and admin page) is a Vue 3 + Vite +
Vue Router + Pinia single-page app under `frontend/`, run as an npm
workspace alongside the Express backend under `src/`. Requires Node.js
24+.

```bash
npm install
npm run dev
```

`npm run dev` 会同时启动 Express API 和 Vite 开发服务器（后者会把 API
请求代理到前者），打开 Vite 打印出的地址即可，通常是
`http://localhost:5173`。同样需要在环境变量中设置好 `ADMIN_USER`、
`ADMIN_PASSWORD`、`SESSION_SECRET`（见 [README](../README.md) 的"配置
项"一节）。

`npm run dev` starts the Express API and the Vite dev server together
(the latter proxies API calls to the former) — open the URL Vite prints,
typically `http://localhost:5173`. You'll still need `ADMIN_USER`,
`ADMIN_PASSWORD`, and `SESSION_SECRET` set in the environment (see the
"Configuration" section in the [README](../README.md)).

本地构建并运行生产版本：

To build and run the production bundle locally instead:

```bash
npm run build
npm start
```

`npm test` 运行后端测试套件（`node --test`），并会自动先构建一次前端——
因为有几个测试用例会检查构建出的 SPA 壳体页面。

`npm test` runs the backend test suite (`node --test`) and builds the
frontend first automatically, since a few tests exercise the built SPA
shell.

## 动态工具扩展 / Dynamic Tool Extensions

动态逻辑必须是源代码的一部分，不能通过管理后台上传。扩展入口位于
`src/routes/tools/`。

Dynamic logic must be part of the source code — it cannot be uploaded
through the admin backend. The extension point lives in
`src/routes/tools/`.

一个动态工具导出以下描述符：

A dynamic tool exports a descriptor like this:

```js
import { Router } from 'express';

export const signingTool = {
  id: 'signing-tool',
  createRouter({ toolDataDir, pathId }) {
    const router = Router();

    router.post('/submit', async (req, res) => {
      // Private files should be written under `${toolDataDir}/${pathId}`.
      // Validate the form, generate the PDF, and return the result here.
      res.status(501).json({ error: 'Not implemented' });
    });

    return router;
  },
};
```

在 `src/routes/tools/index.js` 中显式导入并加入 `dynamicTools`：

Import it explicitly and add it to `dynamicTools` in
`src/routes/tools/index.js`:

```js
import { signingTool } from './signing-tool.js';

export const dynamicTools = [signingTool];
```

此时：

Once registered:

```text
POST /signing-tool/api/submit
```

会进入动态路由，而 `/signing-tool/` 及其普通资源仍由静态托管处理。动态
路由在静态分发前注册，因此不需要修改上传或静态服务核心逻辑。

is handled by the dynamic route, while `/signing-tool/` and its regular
assets are still served statically. Dynamic routes are registered before
the static dispatcher, so adding one never requires touching the core
upload or static-serving logic.

动态 API 默认是公开端点；需要鉴权、请求限流或 CSRF 防护时，应在对应工具
的 Router 内按该工具的调用方式添加中间件。

Dynamic API endpoints are public by default — if you need auth, rate
limiting, or CSRF protection, add the appropriate middleware inside that
tool's own router.
