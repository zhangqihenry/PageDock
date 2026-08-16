# 群晖 NAS 部署指南（Container Manager）/ Synology Deployment Guide (Container Manager)

[← 返回 README](../README.md) · [← Back to README](../README.md)

本指南是通过 Synology Container Manager 部署 PageDock 的详细步骤。通用的
Docker 部署方式见主 [README](../README.md) 的"部署"一节。

This guide covers the detailed steps for deploying PageDock via Synology
Container Manager. For the general Docker deployment method, see the
"Deployment" section in the main [README](../README.md).

1. 用 File Station 新建一个用于存放 PageDock 的文件夹，例如
   `docker/pagedock`。

   In File Station, create a folder to hold PageDock, e.g.
   `docker/pagedock`.

2. 在该文件夹下新建一个文本文件，命名为 `docker-compose.yml`，粘贴以下
   内容：

   In that folder, create a new text file named `docker-compose.yml` and
   paste in the following content:

   ```yaml
   services:
     pagedock:
       container_name: pagedock
       image: zhangqilq/pagedock:latest
       restart: unless-stopped
       ports:
         # 左侧为 NAS 端口；如 3000 已被占用，可改为 "13000:3000"
         # Host-side port; change to e.g. "13000:3000" if 3000 is taken
         - "3000:3000"
       environment:
         NODE_ENV: "production"
         PORT: "3000"
         DATA_DIR: "/data"
         TZ: "Asia/Shanghai"

         # 必须手动更改：管理员登录账号和密码
         # Required — change these before starting the container
         ADMIN_USER: "admin"
         ADMIN_PASSWORD: "admin1234"

         # 必须手动更改：至少 32 字节的随机字符串
         # 可用 `openssl rand -base64 48` 生成
         # 也可以从 `https://www.random.org/passwords/` 生成 32 位密码
         # Required — at least 32 random bytes. Generate with:
         # openssl rand -base64 48
         # or generate a 32-character password from
         # `https://www.random.org/passwords/`
         SESSION_SECRET: "ZUwhwnD3bSR2gNkGn2qNfKFEZHNHF6wq"

         SESSION_TTL_HOURS: "12"

         # 直接通过 http://NAS-IP:3000 测试时保持 false；
         # 接入 HTTPS 反向代理后改为 true，并重新创建容器
         # Keep false while testing over plain http://NAS-IP:3000;
         # set to true once you put PageDock behind an HTTPS reverse proxy
         COOKIE_SECURE: "false"
         TRUST_PROXY: "1"

         MAX_UPLOAD_MB: "50"
         MAX_EXTRACTED_MB: "200"
         MAX_ZIP_FILES: "2000"
       volumes:
         - ./data:/data:rw
   ```

3. 在该文件夹下新建一个空的 `data` 子文件夹，用于存放持久化数据；打开它的
   "属性 → 权限"，给"所有人"授予读写权限，并应用到该文件夹、子文件夹和
   文件，避免容器写入数据时出现权限错误。

   Create an empty `data` subfolder there for persistent storage. Open its
   "Properties → Permission", grant "Everyone" read/write access, and
   apply it to this folder, subfolders, and files — this avoids
   permission errors when the container writes data.

4. 启动容器前，确认已经把上面模板里的 `ADMIN_USER`、`ADMIN_PASSWORD`、
   `SESSION_SECRET` 改成了自己的值——不要用模板里的占位内容直接上线。

   Before starting the container, make sure you actually changed
   `ADMIN_USER`, `ADMIN_PASSWORD`, and `SESSION_SECRET` from the template
   values above — don't run PageDock with the placeholder credentials.

5. 如果通过反向代理提供 HTTPS 访问（推荐），再把 `COOKIE_SECURE` 改成
   `"true"`。

   If you're serving PageDock over HTTPS through a reverse proxy
   (recommended), also set `COOKIE_SECURE: "true"`.

6. 打开 Container Manager → 项目 → 新增，项目名称填 `pagedock`，项目路径
   选择第 1 步创建的文件夹，Compose 来源选择该文件夹下的
   `docker-compose.yml`，确认后拉取镜像并启动。

   Open Container Manager → Project → Create, set the project name to
   `pagedock`, point the project path at the folder from step 1, choose
   the `docker-compose.yml` in that folder as the compose source, then
   confirm to pull the image and start it.

7. 启动后可以在 Container Manager 的"项目"或"容器"页面查看运行状态和
   日志。

   Once it's running, check status and logs from the "Project" or
   "Container" pages in Container Manager.

更新 PageDock 时，在 Container Manager 里停止项目后选择"更新"（或重新
创建项目）重新拉取最新镜像即可，`data` 目录和 `docker-compose.yml` 中的
配置都会保留。

To update PageDock, just re-pull: in Container Manager, stop the project,
action → "Update" (or re-create it), which pulls the latest image while
keeping the `data` directory and your `docker-compose.yml` settings
intact.
