import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { AppError } from '../errors.js';
import { normalizeCategoryName } from '../utils/category-fields.js';

const CATEGORIES_FILE = 'categories.json';

// Every installation starts with this single category. While it's the only
// one, the homepage shows no category names at all, so upgrading from an
// older version looks exactly like before until the admin adds a second.
export const DEFAULT_CATEGORIES = Object.freeze([
  Object.freeze({ id: 'default', name: '默认' }),
]);

function isValidCategory(entry) {
  return (
    typeof entry?.id === 'string' &&
    /^[a-z0-9]{1,32}$/.test(entry.id) &&
    typeof entry.name === 'string' &&
    entry.name.trim() !== ''
  );
}

async function readStoredCategories(categoriesPath) {
  try {
    const raw = await fs.readFile(categoriesPath, 'utf8');
    const stored = JSON.parse(raw);
    const categories = Array.isArray(stored?.categories)
      ? stored.categories.filter(isValidCategory)
      : [];
    return categories.length > 0 ? categories : null;
  } catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }
}

function notFound() {
  return new AppError('分类不存在或已被删除。', 404, 'CATEGORY_NOT_FOUND');
}

export function createCategoryService(config) {
  const categoriesPath = path.join(config.dataDir, CATEGORIES_FILE);
  // Every change is read-modify-write of one file; run them one at a time
  // so two quick edits from the admin UI can't drop each other.
  let queue = Promise.resolve();

  function serialize(task) {
    const run = queue.then(task, task);
    queue = run.catch(() => {});
    return run;
  }

  async function list() {
    const stored = await readStoredCategories(categoriesPath);
    return (stored || DEFAULT_CATEGORIES).map(({ id, name }) => ({ id, name }));
  }

  async function save(categories) {
    const temporary = `${categoriesPath}.${crypto.randomUUID()}.tmp`;
    try {
      await fs.writeFile(
        temporary,
        `${JSON.stringify({ schemaVersion: 1, categories }, null, 2)}\n`,
        { encoding: 'utf8', flag: 'wx' },
      );
      await fs.rename(temporary, categoriesPath);
    } finally {
      await fs.rm(temporary, { force: true });
    }
    return categories;
  }

  function assertUniqueName(categories, name, exceptId) {
    const taken = categories.some(
      (category) =>
        category.id !== exceptId &&
        category.name.toLowerCase() === name.toLowerCase(),
    );
    if (taken) {
      throw new AppError('已存在同名分类。', 409, 'CATEGORY_NAME_TAKEN');
    }
  }

  async function exists(id) {
    return (await list()).some((category) => category.id === id);
  }

  // Checks a category id sent with an upload or edit. Blank means the
  // admin didn't pick one, which callers treat as "keep what it had".
  async function validate(value) {
    const id = String(value ?? '').trim();
    if (!id) return undefined;
    if (!(await exists(id))) throw notFound();
    return id;
  }

  function create(name) {
    return serialize(async () => {
      const normalizedName = normalizeCategoryName(name);
      const categories = await list();
      assertUniqueName(categories, normalizedName);
      const category = {
        id: crypto.randomBytes(6).toString('hex'),
        name: normalizedName,
      };
      await save([...categories, category]);
      return category;
    });
  }

  function rename(id, name) {
    return serialize(async () => {
      const normalizedName = normalizeCategoryName(name);
      const categories = await list();
      const category = categories.find((entry) => entry.id === id);
      if (!category) throw notFound();
      assertUniqueName(categories, normalizedName, id);
      category.name = normalizedName;
      await save(categories);
      return category;
    });
  }

  // Returns the category that inherits the removed one's pages — always
  // the first remaining category, the same place resolveCategoryId() sends
  // any page whose category can't be found.
  function remove(id) {
    return serialize(async () => {
      const categories = await list();
      if (!categories.some((entry) => entry.id === id)) throw notFound();
      if (categories.length === 1) {
        throw new AppError('至少需要保留一个分类。', 400, 'LAST_CATEGORY');
      }
      const remaining = categories.filter((entry) => entry.id !== id);
      await save(remaining);
      return remaining[0];
    });
  }

  // `ids` must name every existing category exactly once — a reorder from
  // a stale admin page (one that missed an add or delete) is rejected
  // rather than silently dropping or resurrecting categories.
  function reorder(ids) {
    return serialize(async () => {
      const categories = await list();
      const byId = new Map(categories.map((entry) => [entry.id, entry]));
      const requested = Array.isArray(ids) ? ids.map(String) : [];
      if (
        requested.length !== categories.length ||
        new Set(requested).size !== requested.length ||
        !requested.every((id) => byId.has(id))
      ) {
        throw new AppError('分类顺序无效，请刷新后重试。', 400, 'INVALID_CATEGORY_ORDER');
      }
      return save(requested.map((id) => byId.get(id)));
    });
  }

  return { list, exists, validate, create, rename, remove, reorder };
}
