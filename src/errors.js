export class AppError extends Error {
  constructor(message, status = 500, code = 'APP_ERROR') {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

export class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'SITE_CONFLICT');
    this.name = 'ConflictError';
  }
}
