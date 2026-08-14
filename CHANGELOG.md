# Changelog / 更新日志

## v0.9.0 — 2026-08-14

**EN:** Rebuilt the frontend as a Vue 3 + Vite + Vue Router + Pinia single-page app; the server is now a JSON API plus static hosting instead of server-rendered EJS pages. The catalog homepage is styled like a blog index, with an admin-editable big title and subtitle above the page list (previously fixed text). The top-right "Upload page" button is now "Admin", which opens a tabbed admin page (Uploaded pages / Upload page / Site settings) instead of one long scrolling page. Logging in is now a modal on the homepage instead of a separate page. Removed the `ADMIN_HOST` option entirely — the admin backend no longer supports being restricted to a separate hostname.

**中文：** 前端整体重写为 Vue 3 + Vite + Vue Router + Pinia 单页应用；服务端不再渲染 EJS 页面，改为纯 JSON API + 静态托管。首页目录改成了 Blog 风格，页面列表上方新增了可在后台自定义的大标题和小标题（原来是固定文案）。右上角「上传网页」按钮改名为「后台管理」，点击后打开的是选项卡式的后台页面（已上传网页 / 上传网页 / 网站设置），不再是一长条滚动页面。登录不再是独立页面，改成首页里的弹窗。彻底移除了 `ADMIN_HOST` 配置项，后台管理不再支持限定专属域名访问。

## v0.8.3 — 2026-08-11

**EN:** Fixed the admin table's row divider lines appearing broken/stepped around the actions column on rows shorter than their button grid. The 2x2 button layout now lives on an inner wrapper instead of the table cell itself, so every cell in a row shares the same border position again.

**中文：** 修复了管理后台表格中，行高小于按钮网格高度时，操作列附近的行分隔线会显示断开/错位的问题。四个按钮的 2×2 布局现在放在单元格内部的一层容器上，不再直接设在表格单元格本身，这样同一行的所有列边框会正常对齐。

## v0.8.2 — 2026-08-11

**EN:** Moved the "Save order" button out of the panel heading to its own row directly under the sort-order column, sized to match the number input, and switched it from the solid accent style to the same plain button style used elsewhere in the table.

**中文：** 「保存排序」按钮从表格标题栏移到了排序数字列下方单独一行，大小与排序输入框一致，并且从红色实心按钮改成了和表格里其他按钮一样的普通样式。

## v0.8.1 — 2026-08-11

**EN:** The sort-order column in the admin table now saves all rows at once with a single "Save order" button, instead of a save button per row. The number field no longer shows a hint text that could get cut off — a blank field simply defaults to 0, and a decimal, a negative number, or non-numeric text is silently treated as 0 as well.

**中文：** 已上传网页表格的排序数字列现在改为一次性保存所有行，用一个「保存排序」按钮代替原来每行一个的保存按钮。排序数字输入框不再显示可能被截断的提示文字——留空默认就是 0，输入小数、负数或非数字文本也会自动按 0 处理。

## v0.8.0 — 2026-08-11

**EN:** Reworked page sorting: the sort number is no longer set at upload time — the uploaded-pages table now has its own column with an inline field to set or clear a page's sort number directly, no need to open the edit page. Uploading or replacing a page's file always preserves its existing sort number. Also added a small version badge to the top right of the catalog page, linking to the matching GitHub release.

**中文：** 重新设计了网页排序功能：排序数字不再需要在上传时指定——已上传网页表格现在有独立的一列，可以直接在表格里输入或清空排序数字，无需进入编辑页面。上传或替换网页文件时会保留原有的排序数字。另外在目录页右上角新增了一个版本号标识，点击可跳转到对应的 GitHub Release。

## v0.7.0 — 2026-08-11

**EN:** Uploaded pages can now be given an optional sort number. Pages with a sort number are listed above pages without one, ordered from highest to lowest; pages without a sort number keep the previous behavior of sorting by most recently uploaded. The number can be set on upload or edited later.

**中文：** 已上传的网页现在可以设置一个可选的排序数字。设置了排序数字的网页会显示在未设置的网页之前，按数字从大到小排列；未设置排序数字的网页仍按上传时间从新到旧排列。排序数字可以在上传时填写，也可以之后编辑修改。

## v0.6.0 — 2026-08-04

**EN:** Added page enable/disable controls: disabled pages remain available for administration and editing but are hidden from the public catalog and unavailable through their public paths. Redesigned the uploaded-page table into a compact multi-line layout that keeps long descriptions and actions on one page without horizontal scrolling, made delete actions more prominent with a red treatment, and added a GitHub profile link to the catalog header.

**中文：** 新增网页启用/停用功能：停用后的网页仍可在后台管理和编辑，但不会显示在公开目录中，也无法通过公开路径访问。重新设计已上传网页表格，采用紧凑的多行布局，使较长说明和操作按钮无需横向滚动即可在一页内显示；同时将删除操作改为醒目的红色样式，并在目录页顶部新增 GitHub 主页入口。

## v0.5.0 — 2026-07-30

**EN:** Completed the page edit feature: editing an uploaded page can now also replace its file (a single HTML file or a full ZIP package), clearing the old content and updating the upload time to the replacement time; editing without a new file still keeps the original upload time.

**中文：** 完善了网页上传后的修改功能：编辑已上传的网页时现在也可以替换网页文件（单个 HTML 文件或整个 ZIP 压缩包），替换会清空原有内容并将上传时间更新为本次替换时间；不选择文件、仅修改信息时仍保留原上传时间。

## v0.4.1 — 2026-07-29

**EN:** Fixed catalog page descriptions collapsing multi-line input onto a single line; line breaks are now preserved.

**中文：** 修复首页目录中页面描述的换行会被折叠成一行的问题，现在多行描述可以正常换行显示。

## v0.4.0 — 2026-07-29

**EN:** Admins can now edit a page's title, description, and version after it has been uploaded.

**中文：** 管理员现在可以在上传后编辑页面的标题、描述和版本号。

## v0.3.0 — 2026-07-29

**EN:** Added a site logo, and uploads can now carry a title, version, and timestamp.

**中文：** 新增站点 Logo，上传时可以填写标题、版本号，并记录上传时间。

## v0.2.0 — 2026-07-28

**EN:** Redesigned the UI in a Swiss International style with light/dark theme and language (Chinese/English) toggles; merged the README into a single bilingual document.

**中文：** 以瑞士国际主义风格重新设计了界面，新增深色/浅色主题和中英文语言切换；将 README 合并为一份中英双语文档。

## v0.1.1 — 2026-07-28

**EN:** Initial release — a lightweight, self-hosted dock for sharing static web pages, with Docker images published to GHCR for simplified NAS deployment.

**中文：** 首个版本——一个轻量级的自托管静态网页分享工具，Docker 镜像发布到 GHCR，方便在 NAS 上部署。
