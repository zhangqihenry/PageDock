import path from 'node:path';

const DEFAULTS = Object.freeze({
  port: 3000,
  maxUploadMb: 50,
  maxExtractedMb: 200,
  maxZipFiles: 2000,
  sessionTtlHours: 12,
});

function parsePositiveNumber(value, fallback, name) {
  if (value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return parsed;
}

function parsePositiveInteger(value, fallback, name) {
  const parsed = parsePositiveNumber(value, fallback, name);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === '') {
    return fallback;
  }

  if (['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase())) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(String(value).toLowerCase())) {
    return false;
  }
  throw new Error(`Invalid boolean value: ${value}`);
}

function parseTrustProxy(value) {
  if (value === undefined || value === '') {
    return 1;
  }
  if (/^\d+$/.test(value)) {
    return Number(value);
  }
  return parseBoolean(value, true);
}

export function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  const dataDir = path.resolve(env.DATA_DIR || '/data');
  const adminUser = env.ADMIN_USER || '';
  const adminPassword = env.ADMIN_PASSWORD || '';
  const sessionSecret = env.SESSION_SECRET || '';

  if (!adminUser) {
    throw new Error('ADMIN_USER is required');
  }
  if (!adminPassword || adminPassword === 'CHANGE_ME') {
    throw new Error('ADMIN_PASSWORD must be replaced with a real password');
  }
  if (
    sessionSecret === 'CHANGE_ME' ||
    Buffer.byteLength(sessionSecret, 'utf8') < 32
  ) {
    throw new Error('SESSION_SECRET must contain at least 32 bytes');
  }

  const maxUploadMb = parsePositiveNumber(
    env.MAX_UPLOAD_MB,
    DEFAULTS.maxUploadMb,
    'MAX_UPLOAD_MB',
  );
  const maxExtractedMb = parsePositiveNumber(
    env.MAX_EXTRACTED_MB,
    DEFAULTS.maxExtractedMb,
    'MAX_EXTRACTED_MB',
  );

  return Object.freeze({
    nodeEnv,
    isProduction: nodeEnv === 'production',
    port: parsePositiveInteger(env.PORT, DEFAULTS.port, 'PORT'),
    dataDir,
    sitesDir: path.join(dataDir, 'sites'),
    toolDataDir: path.join(dataDir, 'tool-data'),
    workDir: path.join(dataDir, 'work'),
    uploadDir: path.join(dataDir, 'work', 'uploads'),
    stagingDir: path.join(dataDir, 'work', 'staging'),
    adminUser,
    adminPassword,
    sessionSecret,
    sessionTtlMs:
      parsePositiveNumber(
        env.SESSION_TTL_HOURS,
        DEFAULTS.sessionTtlHours,
        'SESSION_TTL_HOURS',
      ) *
      60 *
      60 *
      1000,
    maxUploadBytes: maxUploadMb * 1024 * 1024,
    maxExtractedBytes: maxExtractedMb * 1024 * 1024,
    maxZipFiles: parsePositiveInteger(
      env.MAX_ZIP_FILES,
      DEFAULTS.maxZipFiles,
      'MAX_ZIP_FILES',
    ),
    cookieSecure: parseBoolean(
      env.COOKIE_SECURE,
      nodeEnv === 'production',
    ),
    trustProxy: parseTrustProxy(env.TRUST_PROXY),
  });
}

export { DEFAULTS };
