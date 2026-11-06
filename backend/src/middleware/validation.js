import { body, param, query, validationResult } from 'express-validator';
import { z } from 'zod';
import { GATE_TYPES } from '../constants/gates.js';

/** Shape a validation failure into a stable API payload. */
export const handleValidationErrors = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  return res.status(400).json({
    message: 'Validation failed',
    errors: result.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    })),
  });
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const validateRegister = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('A valid email is required')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be between 2 and 60 characters'),
  handleValidationErrors,
];

export const validateLogin = [
  body('email').trim().isEmail().withMessage('A valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

// ---------------------------------------------------------------------------
// Circuits
// ---------------------------------------------------------------------------
const nodeValidator = (value) => {
  if (!Array.isArray(value)) throw new Error('nodes must be an array');
  for (const node of value) {
    if (!node || typeof node !== 'object') throw new Error('Each node must be an object');
    if (!node.id) throw new Error('Every node needs an id');
    if (!GATE_TYPES.includes(node.type)) throw new Error(`Unsupported gate type "${node.type}"`);
    if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
      throw new Error(`Node "${node.id}" needs numeric position.x and position.y`);
    }
  }
  return true;
};

const edgeValidator = (value) => {
  if (!Array.isArray(value)) throw new Error('edges must be an array');
  for (const edge of value) {
    if (!edge || typeof edge !== 'object') throw new Error('Each edge must be an object');
    if (!edge.id || !edge.source || !edge.target) {
      throw new Error('Every edge needs id, source and target');
    }
  }
  return true;
};

export const validateCircuit = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Circuit name must be 1-100 characters'),
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
  body('nodes').optional().custom(nodeValidator),
  body('edges').optional().custom(edgeValidator),
  handleValidationErrors,
];

export const validateObjectId = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  handleValidationErrors,
];

/** Zod schema — used for programmatic/query coercion + documented contract. */
export const circuitQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
  search: z.string().trim().max(120).optional(),
  isPublic: z.enum(['true', 'false']).optional(),
  sort: z.enum(['recent', 'name', 'gates']).default('recent'),
});

export const validateCircuitQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('search').optional().isLength({ max: 120 }).withMessage('Search term is too long'),
  query('isPublic').optional().isBoolean().withMessage('isPublic must be true or false'),
  query('sort').optional().isIn(['recent', 'name', 'gates']).withMessage('Unsupported sort option'),
  handleValidationErrors,
];
