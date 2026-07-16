import { Router } from 'express';
import { register, login, getMe, refreshToken } from '../controllers/authController.js';
import {
  validateRegister,
  validateLogin,
  authenticate,
  handleValidationErrors,
} from '../middleware/auth.js';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', authenticate, getMe);
router.post('/refresh', authenticate, refreshToken);

export default router;
