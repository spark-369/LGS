import { Router } from 'express';
import { circuitQuerySchema } from '../middleware/validation.js';

const router = Router();

// Process uptime in seconds, formatted for humans.
const uptime = () => {
  const seconds = Math.floor(process.uptime());
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
};

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Exposes the API contract the client can rely on. Also acts as a smoke test
// that the validation layer loaded correctly.
router.get('/meta', (req, res) => {
  res.json({
    name: 'logic-gate-simulator-api',
    version: '1.0.0',
    endpoints: {
      auth: ['POST /api/auth/register', 'POST /api/auth/login', 'GET /api/auth/me', 'POST /api/auth/refresh'],
      circuits: [
        'GET /api/circuits',
        'POST /api/circuits',
        'GET /api/circuits/public',
        'GET /api/circuits/:id',
        'PUT /api/circuits/:id',
        'PATCH /api/circuits/:id/public',
        'POST /api/circuits/:id/duplicate',
        'POST /api/circuits/:id/simulate',
        'DELETE /api/circuits/:id',
      ],
    },
    circuitQuery: Object.keys(circuitQuerySchema.shape),
  });
});

export default router;
