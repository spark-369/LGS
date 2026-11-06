import { Router } from 'express';
import { register, login, getMe, refreshToken } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRegister, validateLogin } from '../middleware/validation.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();

// Brute-force protection: 10 credential attempts per IP per 15 minutes.
const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 10,
  message: 'Too many authentication attempts. Please try again later.',
});

router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.get('/me', authenticate, getMe);
router.post('/refresh', authenticate, refreshToken);

export default router;
