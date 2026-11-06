import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from './errorHandler.js';

/** Extract a bearer token from the Authorization header. */
const readBearerToken = (req) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
};

/**
 * Require a valid JWT. On success `req.user` is a hydrated Mongoose document
 * (password excluded by the schema's `select: false`).
 */
export const authenticate = async (req, res, next) => {
  try {
    const token = readBearerToken(req);
    if (!token) throw new ApiError(401, 'Authentication required');

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      throw new ApiError(401, 'Invalid or expired token');
    }

    const user = await User.findById(decoded.id);
    if (!user) throw new ApiError(401, 'User no longer exists');

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Attach `req.user` when a valid token is present, but never reject.
 * Used by routes that behave differently for signed-in users (e.g. the public
 * gallery exposing an `isOwner` flag).
 */
export const optionalAuth = async (req, _res, next) => {
  const token = readBearerToken(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user) req.user = user;
  } catch {
    /* ignore — treat as anonymous */
  }
  return next();
};

export {
  validateRegister,
  validateLogin,
  validateCircuit,
  validateObjectId,
  validateCircuitQuery,
  handleValidationErrors,
} from './validation.js';
