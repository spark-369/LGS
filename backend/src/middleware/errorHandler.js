// ---------------------------------------------------------------------------
// Centralised error handling.
//
// Controllers either `next(error)` or throw; every error lands here so the
// response shape stays identical for the whole API:
//   { message: string, errors?: [{ field, message }] }
// ---------------------------------------------------------------------------

/**
 * Error carrying an explicit HTTP status. Throw from anywhere:
 *   throw new ApiError(403, 'You do not own this circuit');
 */
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

// eslint-disable-next-line no-unused-vars -- Express requires the 4-arg signature
export const errorHandler = (err, req, res, next) => {
  let status = Number(err.status || err.statusCode) || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  if (err.name === 'ValidationError' && err.errors) {
    // Mongoose schema validation
    status = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for "${err.path}"`;
  } else if (err.code === 11000) {
    // Mongo duplicate key
    status = 409;
    const fields = Object.keys(err.keyValue || {});
    message = fields.length
      ? `${fields.join(', ')} already exists`
      : 'Duplicate value';
    details = fields.map((field) => ({
      field,
      message: `${field} already exists`,
    }));
  }

  if (status >= 500) {
    console.error('[api:error]', err);
    if (process.env.NODE_ENV !== 'development') {
      // Never leak internals to clients in production.
      message = 'Internal server error';
      details = undefined;
    }
  }

  res.status(status).json({
    message,
    ...(details ? { errors: details } : {}),
    ...(process.env.NODE_ENV === 'development' && status >= 500
      ? { stack: err.stack }
      : {}),
  });
};
