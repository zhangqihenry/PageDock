import fs from 'node:fs/promises';
import path from 'node:path';
import {
  normalizeCatalogSubtitle,
  normalizeCatalogTitle,
} from '../utils/settings-fields.js';

const SETTINGS_FILE = 'settings.json';

// Defaults match the copy PageDock has always shipped with, so upgrading
// from an older version changes nothing on the catalog page until the
// admin actually edits these in the Settings tab.
export const DEFAULT_CATALOG_TITLE = '网页目录';
export const DEFAULT_CATALOG_SUBTITLE =
  '浏览已发布的网页，点击条目将在新窗口中打开。';

async function readStoredSettings(settingsPath) {
  try {
    const raw = await fs.readFile(settingsPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }
}

export function createSettingsService(config) {
  const settingsPath = path.join(config.dataDir, SETTINGS_FILE);

  async function get() {
    const stored = await readStoredSettings(settingsPath);
    return {
      title:
        typeof stored?.title === 'string' && stored.title
          ? stored.title
          : DEFAULT_CATALOG_TITLE,
      subtitle:
        typeof stored?.subtitle === 'string'
          ? stored.subtitle
          : DEFAULT_CATALOG_SUBTITLE,
    };
  }

  async function update({ title, subtitle }) {
    const settings = {
      schemaVersion: 1,
      title: normalizeCatalogTitle(title),
      subtitle: normalizeCatalogSubtitle(subtitle),
    };
    await fs.writeFile(
      settingsPath,
      `${JSON.stringify(settings, null, 2)}\n`,
      'utf8',
    );
    return { title: settings.title, subtitle: settings.subtitle };
  }

  return { get, update };
}
