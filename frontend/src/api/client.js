const BASE = '/_pagedock/api';

// Mirrors the backend's uniform error shape ({ error, code, params }) so
// callers can branch on `code` and let the i18n dictionary render the
// localized message, falling back to the raw `message` for unknown codes.
export class ApiError extends Error {
  constructor(status, code, params, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.params = params || {};
  }
}

async function request(path, { method = 'GET', body, csrfToken, headers } = {}) {
  const finalHeaders = { ...headers };
  if (csrfToken) {
    finalHeaders['x-csrf-token'] = csrfToken;
  }

  let requestBody = body;
  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders['content-type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: requestBody,
    credentials: 'same-origin',
  });

  if (response.status === 204) {
    return null;
  }

  const isJson = (response.headers.get('content-type') || '').includes(
    'application/json',
  );
  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.code || 'UNKNOWN_ERROR',
      data?.params,
      data?.error || response.statusText,
    );
  }

  return data;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) =>
    request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};
