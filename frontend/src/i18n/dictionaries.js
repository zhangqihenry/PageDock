// Ported from the old server-side src/i18n.js — same keys, same {n}/{...}
// interpolation shape, just evaluated in the browser now instead of on the
// server. `errorCode.*` keys are the client-side translation of the
// `code` field the backend's { error, code, params } responses carry, so
// adding a new AppError code on the backend means adding a matching
// `errorCode.<CODE>` entry here.
//
// This file grows incrementally as each view/component is built — it isn't
// meant to hold the full eventual vocabulary yet.

export const SUPPORTED_LOCALES = ['zh', 'en'];
export const DEFAULT_LOCALE = 'zh';

const dictionaries = {
  zh: {
    'nav.admin': '后台管理',
    'nav.backToCatalog': '返回目录',
    'nav.logout': '退出管理',
    'nav.toggleTheme': '切换浅色 / 深色主题',
    'nav.githubProfile': '作者Github主页',
    'nav.versionLabel': ({ version }) => `PageDock v${version}，点击查看更新日志`,

    'common.description': '网页说明',
    'common.noDescription': '暂无说明',
    'common.noVersion': '无版本号',
    'common.versionTag': ({ version }) => `v${version}`,
    'common.loading': '加载中…',
    'common.save': '保存',
    'common.cancel': '取消',

    'catalog.tally': ({ count }) => `共 ${count} 个网页`,
    'catalog.empty': '目录暂时为空，点击右上角「后台管理」发布第一个网页。',
    'catalog.listLabel': '已发布网页',
    'catalog.open': '打开 →',

    'notFound.title': '页面不存在',
    'notFound.message': '请求的页面或网页不存在。',
    'notFound.backLink': '返回网页目录',

    'error.generic': '发生未知错误，请稍后重试。',

    'login.title': '登录',
    'login.subtitle': '登录后上传和管理网页。',
    'login.usernameLabel': '管理员账号',
    'login.passwordLabel': '管理员密码',
    'login.submit': '登录',

    'admin.tabSites': '已上传网页',
    'admin.tabUpload': '上传网页',
    'admin.tabSettings': '网站设置',
    'admin.emptyState': '还没有上传网页。',
    'admin.limits': ({ upload, extracted, files }) =>
      `上传上限 ${upload}；解压上限 ${extracted}；最多 ${files} 个条目。`,
    'admin.uploaded': '网页已成功上传。',
    'admin.deleted': '网页已删除。',
    'admin.updated': '网页信息已更新。',
    'admin.disabled': '网页已停用。',
    'admin.enabled': '网页已启用。',
    'admin.sortOrderSaved': '排序已保存。',

    'common.uploadedAt': '上传时间',
    'common.size': '占用空间',

    'form.titleLabel': '网页标题',
    'form.titlePlaceholder': '例如 人力资源计算器',
    'form.pathLabel': '自定义访问路径',
    'form.pathPlaceholder': '例如 sample',
    'form.fileLabel': 'HTML 或 ZIP 文件',
    'form.descriptionPlaceholder': '简单介绍这个网页的用途（最多 300 个字符）',
    'form.versionLabel': '版本号（可选，仅供显示）',
    'form.versionPlaceholder': '例如 1.0',
    'form.overwriteLegend': '网页名称重名时',
    'form.overwriteCancel': '取消并提示',
    'form.overwriteReplace': '覆盖替换现有网页',
    'form.submitUpload': '上传网页',

    'table.sortOrder': '排序',
    'table.saveOrder': '保存排序',
    'table.open': '打开',
    'table.edit': '编辑',
    'table.delete': '删除',
    'table.disable': '停用',
    'table.enable': '启用',
    'table.enabledStatus': '已启用',
    'table.disabledStatus': '已停用',

    'edit.heading': '编辑网页信息',
    'edit.save': '保存修改',
    'edit.replaceFileLabel': '替换网页文件（可选）',
    'edit.replaceFileHint':
      '上传新的 HTML 或 ZIP 文件将完全替换当前网页的全部内容（原有文件会被清空），并将上传时间更新为本次替换时间；留空则仅保存标题、版本号和说明。',

    'settings.titleLabel': '大标题',
    'settings.titlePlaceholder': '例如 网页目录',
    'settings.subtitleLabel': '小标题',
    'settings.subtitlePlaceholder': '简单介绍一下这个目录',
    'settings.saved': '设置已保存。',

    'errorCode.INVALID_CSRF': '请求校验失败，请刷新页面后重试。',
    'errorCode.NO_FILE': '请选择要上传的 HTML 或 ZIP 文件。',
    'errorCode.INVALID_FILE_TYPE': '只接受 .html 文件或 .zip 压缩包。',
    'errorCode.INVALID_HTML': 'HTML 文件包含无效的二进制内容。',
    'errorCode.DESCRIPTION_TOO_LONG': ({ n }) => `网页说明不能超过 ${n} 个字符。`,
    'errorCode.TITLE_REQUIRED': '请填写网页标题。',
    'errorCode.TITLE_TOO_LONG': ({ n }) => `网页标题不能超过 ${n} 个字符。`,
    'errorCode.VERSION_TOO_LONG': ({ n }) => `版本号不能超过 ${n} 个字符。`,
    'errorCode.MISSING_INDEX': 'ZIP 根目录下必须存在 index.html。',
    'errorCode.INVALID_INDEX': 'ZIP 根目录下的 index.html 必须是普通文件。',
    'errorCode.SITE_CONFLICT':
      '该网页名称或访问路径已经存在。请选择"覆盖替换"后重新上传，或取消本次操作。',
    'errorCode.SITE_NOT_FOUND': '网页不存在或已被删除。',
    'errorCode.INVALID_PATH_ID':
      '路径标识只能包含字母、数字、连字符和下划线，长度为 1–64 个字符，且不能使用保留名称。',
    'errorCode.INVALID_SITE_STATUS': '网页状态无效。',
    'errorCode.RESERVED_ZIP_FILE': 'ZIP 不能包含 PageDock 的内部元数据文件。',
    'errorCode.INVALID_ZIP_SIZE': 'ZIP 中存在无效的条目大小。',
    'errorCode.INVALID_ZIP_SIGNATURE': '上传文件不是有效的 ZIP 压缩包。',
    'errorCode.INVALID_ZIP': 'ZIP 压缩包结构无效。',
    'errorCode.MULTI_DISK_ZIP': '不支持分卷 ZIP 压缩包。',
    'errorCode.ZIP64_NOT_ALLOWED': '当前上传限制不需要 ZIP64，已拒绝该压缩包。',
    'errorCode.ZIP_FILE_COUNT_LIMIT': ({ n }) => `ZIP 文件条目超过 ${n} 个的限制。`,
    'errorCode.EXTRACTED_SIZE_LIMIT': 'ZIP 解压后的实际总大小超过限制。',
    'errorCode.UNSAFE_ZIP_PATH': 'ZIP 中包含不安全的路径。',
    'errorCode.DUPLICATE_ZIP_PATH': 'ZIP 中包含重复的路径。',
    'errorCode.UNSUPPORTED_ZIP_ENTRY': 'ZIP 中包含不支持或已加密的条目。',
    'errorCode.ZIP_SYMLINK': 'ZIP 中不允许符号链接。',
    'errorCode.ZIP_PATH_CONFLICT': 'ZIP 中存在文件与目录路径冲突。',
    'errorCode.UNSUPPORTED_ZIP_COMPRESSION': 'ZIP 条目使用了不支持的压缩方式。',
    'errorCode.CATALOG_TITLE_REQUIRED': '请填写目录标题。',
    'errorCode.CATALOG_TITLE_TOO_LONG': ({ n }) => `目录标题不能超过 ${n} 个字符。`,
    'errorCode.CATALOG_SUBTITLE_TOO_LONG': ({ n }) => `目录副标题不能超过 ${n} 个字符。`,
    'errorCode.AUTH_REQUIRED': '请先登录管理员账号。',
    'errorCode.INVALID_CREDENTIALS': '账号或密码错误。',
    'errorCode.RATE_LIMITED': '登录尝试次数过多，请稍后再试。',
    'errorCode.UPLOAD_TOO_LARGE': '上传文件超过允许的大小限制。',
    'errorCode.UPLOAD_ERROR': ({ detail }) => `上传失败：${detail}`,
    'errorCode.NOT_FOUND': '请求的内容不存在。',
    'errorCode.APP_ERROR': '发生未知错误。',
    'errorCode.UNKNOWN_ERROR': '网络异常，请稍后重试。',
  },
  en: {
    'nav.admin': 'Admin',
    'nav.backToCatalog': 'Back to catalog',
    'nav.logout': 'Log out',
    'nav.toggleTheme': 'Toggle light / dark theme',
    'nav.githubProfile': "Author's GitHub profile",
    'nav.versionLabel': ({ version }) => `PageDock v${version} — view changelog`,

    'common.description': 'Description',
    'common.noDescription': 'No description',
    'common.noVersion': 'No version',
    'common.versionTag': ({ version }) => `v${version}`,
    'common.loading': 'Loading…',
    'common.save': 'Save',
    'common.cancel': 'Cancel',

    'catalog.tally': ({ count }) => `${count} page${count === 1 ? '' : 's'} total`,
    'catalog.empty': 'The catalog is empty. Click "Admin" in the top right to publish the first one.',
    'catalog.listLabel': 'Published web pages',
    'catalog.open': 'Open →',

    'notFound.title': 'Page Not Found',
    'notFound.message': 'The requested page or web page does not exist.',
    'notFound.backLink': 'Back to catalog',

    'error.generic': 'Something went wrong. Please try again later.',

    'login.title': 'Log In',
    'login.subtitle': 'Log in to upload and manage pages.',
    'login.usernameLabel': 'Admin username',
    'login.passwordLabel': 'Admin password',
    'login.submit': 'Log in',

    'admin.tabSites': 'Uploaded pages',
    'admin.tabUpload': 'Upload page',
    'admin.tabSettings': 'Site settings',
    'admin.emptyState': 'No pages uploaded yet.',
    'admin.limits': ({ upload, extracted, files }) =>
      `Upload limit ${upload}; extracted limit ${extracted}; up to ${files} entries.`,
    'admin.uploaded': 'The page was uploaded successfully.',
    'admin.deleted': 'The page was deleted.',
    'admin.updated': 'The page information was updated.',
    'admin.disabled': 'The page was disabled.',
    'admin.enabled': 'The page was enabled.',
    'admin.sortOrderSaved': 'Sort order saved.',

    'common.uploadedAt': 'Uploaded',
    'common.size': 'Size',

    'form.titleLabel': 'Page title',
    'form.titlePlaceholder': 'e.g. HR Calculator',
    'form.pathLabel': 'Custom path',
    'form.pathPlaceholder': 'e.g. sample',
    'form.fileLabel': 'HTML or ZIP file',
    'form.descriptionPlaceholder': 'Briefly describe what this page is for (up to 300 characters)',
    'form.versionLabel': 'Version (optional, display only)',
    'form.versionPlaceholder': 'e.g. 1.0',
    'form.overwriteLegend': 'If the name already exists',
    'form.overwriteCancel': 'Cancel and warn',
    'form.overwriteReplace': 'Overwrite the existing page',
    'form.submitUpload': 'Upload page',

    'table.sortOrder': 'Order',
    'table.saveOrder': 'Save order',
    'table.open': 'Open',
    'table.edit': 'Edit',
    'table.delete': 'Delete',
    'table.disable': 'Disable',
    'table.enable': 'Enable',
    'table.enabledStatus': 'Enabled',
    'table.disabledStatus': 'Disabled',

    'edit.heading': 'Edit page information',
    'edit.save': 'Save changes',
    'edit.replaceFileLabel': 'Replace page file (optional)',
    'edit.replaceFileHint':
      'Uploading a new HTML or ZIP file completely replaces all current page content (existing files are cleared) and updates the upload time to now. Leave empty to only save the title, version, and description.',

    'settings.titleLabel': 'Big title',
    'settings.titlePlaceholder': 'e.g. Web Page Catalog',
    'settings.subtitleLabel': 'Subtitle',
    'settings.subtitlePlaceholder': 'A short description of this catalog',
    'settings.saved': 'Settings saved.',

    'errorCode.INVALID_CSRF': 'Request validation failed. Please refresh the page and try again.',
    'errorCode.NO_FILE': 'Please choose an HTML file or a ZIP archive to upload.',
    'errorCode.INVALID_FILE_TYPE': 'Only .html files or .zip archives are accepted.',
    'errorCode.INVALID_HTML': 'The HTML file contains invalid binary content.',
    'errorCode.DESCRIPTION_TOO_LONG': ({ n }) => `Description cannot exceed ${n} characters.`,
    'errorCode.TITLE_REQUIRED': 'Please enter a page title.',
    'errorCode.TITLE_TOO_LONG': ({ n }) => `Title cannot exceed ${n} characters.`,
    'errorCode.VERSION_TOO_LONG': ({ n }) => `Version cannot exceed ${n} characters.`,
    'errorCode.MISSING_INDEX': 'The ZIP archive must contain an index.html at its root.',
    'errorCode.INVALID_INDEX': 'The root index.html in the ZIP archive must be a regular file.',
    'errorCode.SITE_CONFLICT':
      'That page name or path already exists. Choose "Overwrite" to replace it, or cancel this upload.',
    'errorCode.SITE_NOT_FOUND': 'The page does not exist or has been deleted.',
    'errorCode.INVALID_PATH_ID':
      'The path ID may only contain letters, numbers, hyphens, and underscores (1–64 characters), and must not be a reserved name.',
    'errorCode.INVALID_SITE_STATUS': 'The page status is invalid.',
    'errorCode.RESERVED_ZIP_FILE': "The ZIP archive cannot contain PageDock's internal metadata files.",
    'errorCode.INVALID_ZIP_SIZE': 'The ZIP archive contains an entry with an invalid size.',
    'errorCode.INVALID_ZIP_SIGNATURE': 'The uploaded file is not a valid ZIP archive.',
    'errorCode.INVALID_ZIP': 'The ZIP archive structure is invalid.',
    'errorCode.MULTI_DISK_ZIP': 'Multi-disk ZIP archives are not supported.',
    'errorCode.ZIP64_NOT_ALLOWED':
      'ZIP64 is not needed under the current upload limits, so this archive was rejected.',
    'errorCode.ZIP_FILE_COUNT_LIMIT': ({ n }) => `The ZIP archive exceeds the ${n}-entry limit.`,
    'errorCode.EXTRACTED_SIZE_LIMIT':
      'The extracted contents of the ZIP archive exceed the allowed size limit.',
    'errorCode.UNSAFE_ZIP_PATH': 'The ZIP archive contains an unsafe path.',
    'errorCode.DUPLICATE_ZIP_PATH': 'The ZIP archive contains duplicate paths.',
    'errorCode.UNSUPPORTED_ZIP_ENTRY': 'The ZIP archive contains an unsupported or encrypted entry.',
    'errorCode.ZIP_SYMLINK': 'Symbolic links are not allowed in the ZIP archive.',
    'errorCode.ZIP_PATH_CONFLICT': 'The ZIP archive has a file/directory path conflict.',
    'errorCode.UNSUPPORTED_ZIP_COMPRESSION': 'The ZIP archive uses an unsupported compression method.',
    'errorCode.CATALOG_TITLE_REQUIRED': 'Please enter a catalog title.',
    'errorCode.CATALOG_TITLE_TOO_LONG': ({ n }) => `Catalog title cannot exceed ${n} characters.`,
    'errorCode.CATALOG_SUBTITLE_TOO_LONG': ({ n }) => `Catalog subtitle cannot exceed ${n} characters.`,
    'errorCode.AUTH_REQUIRED': 'Please log in as the admin first.',
    'errorCode.INVALID_CREDENTIALS': 'Incorrect username or password.',
    'errorCode.RATE_LIMITED': 'Too many login attempts. Please try again later.',
    'errorCode.UPLOAD_TOO_LARGE': 'The uploaded file exceeds the allowed size limit.',
    'errorCode.UPLOAD_ERROR': ({ detail }) => `Upload failed: ${detail}`,
    'errorCode.NOT_FOUND': 'The requested content does not exist.',
    'errorCode.APP_ERROR': 'An unknown error occurred.',
    'errorCode.UNKNOWN_ERROR': 'A network error occurred. Please try again later.',
  },
};

function lookup(locale, key) {
  const dict = dictionaries[locale] || dictionaries[DEFAULT_LOCALE];
  const fallbackDict = dictionaries[DEFAULT_LOCALE];
  return dict[key] ?? fallbackDict[key];
}

export function resolveLocale(value) {
  return SUPPORTED_LOCALES.includes(value) ? value : DEFAULT_LOCALE;
}

export function translate(locale, key, params) {
  const entry = lookup(locale, key);
  if (entry === undefined) {
    return key;
  }
  return typeof entry === 'function' ? entry(params || {}) : entry;
}
