export const SUPPORTED_LOCALES = ['zh', 'en'];
export const DEFAULT_LOCALE = 'zh';
export const LOCALE_COOKIE = 'pagedock-lang';

const dictionaries = {
  zh: {
    'meta.description': 'PageDock 网页目录，集中浏览和打开已发布的网页。',

    'nav.upload': '上传网页',
    'nav.backToCatalog': '返回目录',
    'nav.logout': '退出管理',
    'nav.toggleTheme': '切换浅色 / 深色主题',
    'nav.githubProfile': '作者Github主页',
    'nav.versionLabel': ({ version }) => `PageDock v${version}，点击查看更新日志`,

    'common.description': '网页说明',
    'common.noDescription': '暂无说明',
    'common.version': '版本号',
    'common.noVersion': '无版本号',
    'common.versionTag': ({ version }) => `v${version}`,
    'common.uploadedAt': '上传时间',

    'catalog.title': '网页目录',
    'catalog.lede': '浏览已发布的网页，点击条目将在新窗口中打开。',
    'catalog.tally': ({ count }) => `共 ${count} 个网页`,
    'catalog.empty': '目录暂时为空，点击右上角「上传网页」发布第一个网页。',
    'catalog.listLabel': '已发布网页',
    'catalog.open': '打开 →',

    'admin.title': '管理后台',
    'admin.uploadHeading': '上传网页',
    'admin.limits': ({ upload, extracted, files }) =>
      `上传上限 ${upload}；解压上限 ${extracted}；最多 ${files} 个条目。`,
    'admin.sitesHeading': '已上传网页',
    'admin.emptyState': '还没有上传网页。',
    'admin.uploaded': '网页已成功上传。',
    'admin.deleted': '网页已删除。',
    'admin.updated': '网页信息已更新。',
    'admin.disabled': '网页已停用。',
    'admin.enabled': '网页已启用。',

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

    'table.title': '网页标题',
    'table.path': '访问路径',
    'table.version': '版本号',
    'table.uploadedAt': '上传时间',
    'table.size': '占用空间',
    'table.details': '版本 / 上传时间',
    'table.actions': '操作',
    'table.sortOrder': '排序',
    'table.noSortOrder': '留空按时间排序',
    'table.save': '保存',
    'table.open': '打开',
    'table.edit': '编辑',
    'table.delete': '删除',
    'table.disable': '停用',
    'table.enable': '启用',
    'table.enabledStatus': '已启用',
    'table.disabledStatus': '已停用',

    'edit.title': '编辑网页信息',
    'edit.heading': '编辑网页信息',
    'edit.save': '保存修改',
    'edit.replaceFileLabel': '替换网页文件（可选）',
    'edit.replaceFileHint':
      '上传新的 HTML 或 ZIP 文件将完全替换当前网页的全部内容（原有文件会被清空），并将上传时间更新为本次替换时间；留空则仅保存标题、版本号和说明。',

    'login.title': '登录',
    'login.subtitle': '登录后上传和管理网页。',
    'login.usernameLabel': '管理员账号',
    'login.passwordLabel': '管理员密码',
    'login.submit': '登录',
    'login.backLink': '返回网页目录',

    'error.conflictTitle': '路径冲突',
    'error.failureTitle': '操作失败',
    'error.backButton': '返回管理后台',

    'notFound.title': '页面不存在',
    'notFound.message': '请求的页面或网页不存在。',

    'errorCode.INVALID_CSRF': '请求校验失败，请刷新页面后重试。',
    'errorCode.NO_FILE': '请选择要上传的 HTML 或 ZIP 文件。',
    'errorCode.INVALID_FILE_TYPE': '只接受 .html 文件或 .zip 压缩包。',
    'errorCode.INVALID_HTML': 'HTML 文件包含无效的二进制内容。',
    'errorCode.DESCRIPTION_TOO_LONG': ({ n }) => `网页说明不能超过 ${n} 个字符。`,
    'errorCode.TITLE_REQUIRED': '请填写网页标题。',
    'errorCode.TITLE_TOO_LONG': ({ n }) => `网页标题不能超过 ${n} 个字符。`,
    'errorCode.VERSION_TOO_LONG': ({ n }) => `版本号不能超过 ${n} 个字符。`,
    'errorCode.SORT_ORDER_INVALID': '排序数字无效，请填写整数或留空。',
    'errorCode.MISSING_INDEX': 'ZIP 根目录下必须存在 index.html。',
    'errorCode.INVALID_INDEX': 'ZIP 根目录下的 index.html 必须是普通文件。',
    'errorCode.SITE_CONFLICT':
      '该网页名称或访问路径已经存在。请选择“覆盖替换”后重新上传，或取消本次操作。',
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
    'errorCode.APP_ERROR': '发生未知错误。',

    'error.multerFileSize': '上传文件超过允许的大小限制。',
    'error.multerGeneric': ({ detail }) => `上传失败：${detail}`,
    'error.generic500': '服务器发生错误，请稍后重试。',

    'auth.rateLimited': '登录尝试次数过多，请稍后再试。',
    'auth.invalidCredentials': '账号或密码错误。',
  },
  en: {
    'meta.description': 'PageDock catalog — browse and open published web pages.',

    'nav.upload': 'Upload page',
    'nav.backToCatalog': 'Back to catalog',
    'nav.logout': 'Log out',
    'nav.toggleTheme': 'Toggle light / dark theme',
    'nav.githubProfile': "Author's GitHub profile",
    'nav.versionLabel': ({ version }) => `PageDock v${version} — view changelog`,

    'common.description': 'Description',
    'common.noDescription': 'No description',
    'common.version': 'Version',
    'common.noVersion': 'No version',
    'common.versionTag': ({ version }) => `v${version}`,
    'common.uploadedAt': 'Uploaded',

    'catalog.title': 'Web Page Catalog',
    'catalog.lede': 'Browse published web pages. Opening one launches it in a new window.',
    'catalog.tally': ({ count }) => `${count} page${count === 1 ? '' : 's'} total`,
    'catalog.empty': 'The catalog is empty. Click "Upload page" in the top right to publish the first one.',
    'catalog.listLabel': 'Published web pages',
    'catalog.open': 'Open →',

    'admin.title': 'Admin Dashboard',
    'admin.uploadHeading': 'Upload page',
    'admin.limits': ({ upload, extracted, files }) =>
      `Upload limit ${upload}; extracted limit ${extracted}; up to ${files} entries.`,
    'admin.sitesHeading': 'Uploaded pages',
    'admin.emptyState': 'No pages uploaded yet.',
    'admin.uploaded': 'The page was uploaded successfully.',
    'admin.deleted': 'The page was deleted.',
    'admin.updated': 'The page information was updated.',
    'admin.disabled': 'The page was disabled.',
    'admin.enabled': 'The page was enabled.',

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

    'table.title': 'Title',
    'table.path': 'Path',
    'table.version': 'Version',
    'table.uploadedAt': 'Uploaded',
    'table.size': 'Size',
    'table.details': 'Version / Uploaded',
    'table.actions': 'Actions',
    'table.sortOrder': 'Order',
    'table.noSortOrder': 'Sorted by time',
    'table.save': 'Save',
    'table.open': 'Open',
    'table.edit': 'Edit',
    'table.delete': 'Delete',
    'table.disable': 'Disable',
    'table.enable': 'Enable',
    'table.enabledStatus': 'Enabled',
    'table.disabledStatus': 'Disabled',

    'edit.title': 'Edit Page Information',
    'edit.heading': 'Edit page information',
    'edit.save': 'Save changes',
    'edit.replaceFileLabel': 'Replace page file (optional)',
    'edit.replaceFileHint':
      'Uploading a new HTML or ZIP file completely replaces all current page content (existing files are cleared) and updates the upload time to now. Leave empty to only save the title, version, and description.',

    'login.title': 'Log In',
    'login.subtitle': 'Log in to upload and manage pages.',
    'login.usernameLabel': 'Admin username',
    'login.passwordLabel': 'Admin password',
    'login.submit': 'Log in',
    'login.backLink': 'Back to catalog',

    'error.conflictTitle': 'Path Conflict',
    'error.failureTitle': 'Operation Failed',
    'error.backButton': 'Back to admin dashboard',

    'notFound.title': 'Page Not Found',
    'notFound.message': 'The requested page or web page does not exist.',

    'errorCode.INVALID_CSRF': 'Request validation failed. Please refresh the page and try again.',
    'errorCode.NO_FILE': 'Please choose an HTML file or a ZIP archive to upload.',
    'errorCode.INVALID_FILE_TYPE': 'Only .html files or .zip archives are accepted.',
    'errorCode.INVALID_HTML': 'The HTML file contains invalid binary content.',
    'errorCode.DESCRIPTION_TOO_LONG': ({ n }) => `Description cannot exceed ${n} characters.`,
    'errorCode.TITLE_REQUIRED': 'Please enter a page title.',
    'errorCode.TITLE_TOO_LONG': ({ n }) => `Title cannot exceed ${n} characters.`,
    'errorCode.VERSION_TOO_LONG': ({ n }) => `Version cannot exceed ${n} characters.`,
    'errorCode.SORT_ORDER_INVALID': 'Invalid sort number. Enter a whole number or leave it empty.',
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
    'errorCode.APP_ERROR': 'An unknown error occurred.',

    'error.multerFileSize': 'The uploaded file exceeds the allowed size limit.',
    'error.multerGeneric': ({ detail }) => `Upload failed: ${detail}`,
    'error.generic500': 'A server error occurred. Please try again later.',

    'auth.rateLimited': 'Too many login attempts. Please try again later.',
    'auth.invalidCredentials': 'Incorrect username or password.',
  },
};

function lookup(locale, key) {
  const dict = dictionaries[locale] || dictionaries[DEFAULT_LOCALE];
  const fallbackDict = dictionaries[DEFAULT_LOCALE];
  const entry = dict[key] ?? fallbackDict[key];
  return entry;
}

export function resolveLocale(value) {
  return SUPPORTED_LOCALES.includes(value) ? value : DEFAULT_LOCALE;
}

export function createTranslator(locale) {
  const activeLocale = resolveLocale(locale);
  return function t(key, params) {
    const entry = lookup(activeLocale, key);
    if (entry === undefined) {
      return key;
    }
    return typeof entry === 'function' ? entry(params || {}) : entry;
  };
}
