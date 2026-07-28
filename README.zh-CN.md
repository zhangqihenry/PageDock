**[English](README.md) | [简体中文](README.zh-CN.md)**

# PageDock

> 把 AI 生成的 HTML 页面变成可以直接分享的网页链接。

PageDock 是一个面向个人 NAS 和家庭服务器的轻量网页托管服务。它在单个
Node.js 容器中提供网页目录、登录管理、HTML/ZIP 上传、静态文件分发和网页
删除功能。

## 为什么开发 PageDock

现在越来越多人使用 AI 快速制作计算器、查询工具、可视化报告、互动页面和其他
小工具。AI 经常直接交付一个 HTML 文件，或者一个包含 HTML、CSS、JavaScript
和图片的压缩包。

这些成果在本地打开很方便，但不像 Word 或 PDF 那样容易传播：直接发送 HTML
文件不够直观，多文件网页必须保持完整目录结构，想让其他人直接使用通常还需要
自己搭一个 Web 服务器，每个小工具都单独部署又太重。

PageDock 解决的是这最后一步：

1. 让 AI 输出单个 HTML 文件，或者以 `index.html` 为入口的 ZIP。
2. 登录 PageDock，上传文件并填写一个访问路径，例如 `sample`。
3. 获得一个可以直接分享的网页地址：

```text
https://your-domain.example.com/sample/
```

同一个 PageDock 容器可以持续托管多个彼此独立的网页，上传内容存放在持久化
数据目录中，更新镜像或重建容器不会丢失。

PageDock 不运行上传内容中的服务器端代码，也不是通用应用沙箱。需要少量后端
逻辑的工具，可以通过随镜像一起构建的、受信任的 Express 路由进行扩展。

## 功能

- 单管理员账号登录，无需注册或多用户体系
- 上传单个 `.html` 文件，或根目录包含 `index.html` 的 `.zip` 压缩包
- 每个网页拥有独立的访问路径，可直接分享，如 `/sample/`
- 未登录也可浏览已发布的网页目录
- 管理页面可查看上传时间、占用空间，支持替换或删除已上传的网页
- 严格校验上传内容，防止路径穿越、恶意压缩包等安全问题
- 所有数据集中存放在 `/data`，更新镜像或重建容器不丢数据
- 预留动态工具扩展位，可按需为某个网页路径添加专属后端逻辑

## 访问路径

| 路径 | 用途 |
| --- | --- |
| `/` | 公开网页目录 |
| `/_pagedock/login` | 管理员登录 |
| `/_pagedock/` | 上传管理页面（未登录时转到登录页） |
| `/_pagedock/health` | 容器健康检查 |
| `/<网页路径>/` | 网页首页 |
| `/<网页路径>/<资源>` | 网页静态资源 |
| `/<网页路径>/api/*` | 可选的专属动态路由 |

访问不带结尾斜杠的网页路径时，PageDock 会重定向到带斜杠的形式，保证
`./style.css` 等相对引用解析到正确的网页目录。

## 数据目录

容器内只需持久化挂载 `/data`：

```text
/data/
├── sites/
│   └── sample/
│       ├── index.html
│       ├── assets/
│       └── .pagedock.json
├── tool-data/
│   └── <动态工具私有数据>
└── work/
    ├── uploads/
    └── staging/
```

- `sites`：已发布的静态网页及其说明等元数据。
- `tool-data`：动态工具生成的私有文件（如生成的 PDF、提交记录），不会被静态暴露。
- `work`：上传和替换时使用的临时空间，服务启动时会清理其中的旧内容。
- `.pagedock.json`：PageDock 内部元数据，不会通过静态路由访问。

备份时只需要备份整个 `/data` 目录。

## 配置项

以下配置全部直接位于 `docker-compose.yml` 的 `environment` 部分。

| 配置 | 必需 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `ADMIN_USER` | 是 | 无 | 管理员账号 |
| `ADMIN_PASSWORD` | 是 | 无 | 管理员密码 |
| `SESSION_SECRET` | 是 | 无 | Cookie 签名密钥，至少 32 字节随机内容 |
| `PORT` | 否 | `3000` | 容器监听端口 |
| `DATA_DIR` | 否 | `/data` | 持久数据根目录 |
| `SESSION_TTL_HOURS` | 否 | `12` | 登录状态有效时间（小时） |
| `COOKIE_SECURE` | 否 | `false` | 通过 HTTPS 访问时应设为 `true` |
| `TRUST_PROXY` | 否 | `1` | 反向代理层级，通常保持默认即可 |
| `ADMIN_HOST` | 否 | 空 | 可选，非空时后台只响应该主机名 |
| `MAX_UPLOAD_MB` | 否 | `50` | 单次上传文件大小上限（MB） |
| `MAX_EXTRACTED_MB` | 否 | `200` | ZIP 实际解压总大小上限（MB） |
| `MAX_ZIP_FILES` | 否 | `2000` | ZIP 最大条目数量 |

`SESSION_SECRET` 可以用以下命令生成，也可以用任意方式生成一段随机字符串：

```bash
openssl rand -base64 48
```

## 部署（Synology Container Manager）

PageDock 每次发布都会构建好一份多架构镜像并推送到 GitHub Container
Registry（`ghcr.io/zhangqihenry/pagedock`），所以不用把源码搬到 NAS 上、
也不用在 NAS 上构建，只需要按下面的模板自己创建一个 `docker-compose.yml`。

1. 用 File Station 新建一个用于存放 PageDock 的文件夹，例如 `docker/pagedock`
   （具体建在哪个共享卷由你自己决定，File Station 里不会显示 volume1、
   volume4 这类卷标）。
2. 在该文件夹下新建一个文本文件，命名为 `docker-compose.yml`，粘贴以下内容：

   ```yaml
   services:
     pagedock:
       container_name: pagedock
       image: ghcr.io/zhangqihenry/pagedock:latest
       restart: unless-stopped
       ports:
         # 左侧为 NAS 端口；如 3000 已被占用，可改为 "13000:3000"。
         - "3000:3000"
       environment:
         NODE_ENV: "production"
         PORT: "3000"
         DATA_DIR: "/data"
         TZ: "Asia/Shanghai"

         # 必须手动更改：管理员登录账号和密码。
         ADMIN_USER: "admin"
         ADMIN_PASSWORD: "改成你自己的密码"

         # 必须手动更改：至少 32 字节的随机字符串。
         # 可用 `openssl rand -base64 48` 生成。
         SESSION_SECRET: "改成一段至少32字节的随机字符串"

         SESSION_TTL_HOURS: "12"

         # 直接通过 http://NAS-IP:3000 测试时保持 false；
         # 接入 HTTPS 反向代理后改为 true，并重新创建容器。
         COOKIE_SECURE: "false"
         TRUST_PROXY: "1"

         # 可选：填写独立的后台域名，例如 admin.example.com；局域网测试时留空。
         ADMIN_HOST: ""

         MAX_UPLOAD_MB: "50"
         MAX_EXTRACTED_MB: "200"
         MAX_ZIP_FILES: "2000"
       volumes:
         - ./data:/data:rw
   ```

3. 在该文件夹下新建一个空的 `data` 子文件夹，用于存放持久化数据；打开它的
   "属性 → 权限"，给"所有人"授予读写权限，并应用到该文件夹、子文件夹和文件，
   避免容器写入数据时出现权限错误。
4. 启动容器前，确认已经把上面模板里的 `ADMIN_USER`、`ADMIN_PASSWORD`、
   `SESSION_SECRET` 改成了自己的值——不要用模板里的占位内容直接上线。
5. 如果通过反向代理提供 HTTPS 访问（推荐），再把 `COOKIE_SECURE` 改成
   `"true"`。

   反向代理本身如何配置由你自行决定，PageDock 只需要监听容器内的 HTTP 端口
   （默认 `3000`）。如果该端口在 NAS 上已被占用，可以修改
   `ports: - "3000:3000"` 左侧的宿主机端口。

6. 打开 Container Manager → 项目 → 新增，项目名称填 `pagedock`，项目路径选择
   第 1 步创建的文件夹，Compose 来源选择该文件夹下的 `docker-compose.yml`，
   确认后拉取镜像并启动。
7. 启动后可以在 Container Manager 的"项目"或"容器"页面查看运行状态和日志。

更新 PageDock 时，在 Container Manager 里停止项目后选择"更新"（或重新创建
项目）重新拉取最新镜像即可，`data` 目录和 `docker-compose.yml` 中的配置都
会保留。如果你固定了某个版本号 tag，记得先在 `docker-compose.yml` 里改成
新版本号。

### 本地构建镜像（开发者自用）

镜像平时是从 GHCR 拉取的；只有当你改了源码、想自己构建调试镜像时才需要
以下命令：

```bash
docker build -t pagedock:local .
docker run -d --name pagedock -p 3000:3000 \
  -v /path/to/data:/data \
  -e ADMIN_USER=admin \
  -e ADMIN_PASSWORD=change-me \
  -e SESSION_SECRET="$(openssl rand -base64 48)" \
  pagedock:local
```

## 网页上传规则

路径标识必须匹配：

```text
^[A-Za-z0-9_-]{1,64}$
```

`_pagedock` 是保留名称，不能作为网页路径使用。

上传单个 `.html` 文件会直接作为该网页的 `index.html`；上传 `.zip` 时还需要
满足：

- 根目录精确存在普通文件 `index.html`
- 不包含绝对路径、`..`、反斜杠路径、盘符或空字节
- 不包含重复路径、符号链接或 `.pagedock.json`
- 条目数和声明的解压大小不超过配置值，实际写入的总大小也不超过配置值
- 使用普通单卷 ZIP 和 Store/Deflate 压缩方式；在当前大小限制下不接受 ZIP64

ZIP 内可以包含 JavaScript、CSS、图片、字体等静态资源，它们只会作为文件发送
给浏览器，不会在服务器进程中执行。

网页说明可留空，最多 300 个字符；网页名称、说明、上传时间等信息保存在各
网页目录内的 `.pagedock.json` 中。

同名路径重复上传时，需要在上传表单中显式选择"覆盖替换"才会替换原有网页，
否则会被拒绝，不会静默覆盖。

## 动态工具扩展

动态逻辑必须是源代码的一部分，不能通过管理后台上传。扩展入口位于
`src/routes/tools/`。

一个动态工具导出以下描述符：

```js
import { Router } from 'express';

export const signingTool = {
  id: 'signing-tool',
  createRouter({ toolDataDir, pathId }) {
    const router = Router();

    router.post('/submit', async (req, res) => {
      // 私有文件应写入 `${toolDataDir}/${pathId}`。
      // 在这里校验表单、生成 PDF 并返回结果。
      res.status(501).json({ error: 'Not implemented' });
    });

    return router;
  },
};
```

在 `src/routes/tools/index.js` 中显式导入并加入 `dynamicTools`：

```js
import { signingTool } from './signing-tool.js';

export const dynamicTools = [signingTool];
```

此时：

```text
POST /signing-tool/api/submit
```

会进入动态路由，而 `/signing-tool/` 及其普通资源仍由静态托管处理。动态路由
在静态分发前注册，因此不需要修改上传或静态服务核心逻辑。

动态 API 默认是公开端点；需要鉴权、请求限流或 CSRF 防护时，应在对应工具的
Router 内按该工具的调用方式添加中间件。

## 本地开发

Node.js 24 或更高版本：

```bash
npm install
```

设置必要环境变量并启动：

```bash
export ADMIN_USER=admin
export ADMIN_PASSWORD='development-password'
export SESSION_SECRET='development-secret-with-at-least-32-bytes'
export COOKIE_SECURE=false
export DATA_DIR=./data
npm run dev
```

Windows PowerShell：

```powershell
$env:ADMIN_USER = "admin"
$env:ADMIN_PASSWORD = "development-password"
$env:SESSION_SECRET = "development-secret-with-at-least-32-bytes"
$env:COOKIE_SECURE = "false"
$env:DATA_DIR = "./data"
npm run dev
```

运行测试：

```bash
npm test
```

## 许可证

[MIT](LICENSE)
