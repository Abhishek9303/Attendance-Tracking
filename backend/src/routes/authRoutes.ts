import { Router } from 'express';
import { register, login, refreshToken, getMe } from '../controllers/authController';
import { authenticateJWT } from '../middlewares/auth';
import { apiLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.post('/register', apiLimiter, register);
router.post('/login', apiLimiter, login);
router.post('/refresh-token', refreshToken);
router.get('/me', authenticateJWT, getMe);

export default router;
