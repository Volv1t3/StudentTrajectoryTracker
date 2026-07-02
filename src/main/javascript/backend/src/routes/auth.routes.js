import { Router } from 'express';
import rateLimiter from '../middleware/rateLimiter.js';
import { sanitizeRichTextFields } from '../middleware/sanitizeRichTextFields.js';
import { validate } from '../validators/validate.js';
import { registerSchema, activateSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.validator.js';
import { verifyAccessToken } from '../middleware/auth.js';
import * as auth from '../controllers/auth.controller.js';

const router = Router();

router.post(
  '/register',
  rateLimiter,
  sanitizeRichTextFields(['motivation_description', 'experience_description']),
  validate(registerSchema),
  auth.register,
);
router.post('/activate', validate(activateSchema), auth.activate);
router.post('/login', rateLimiter, validate(loginSchema), auth.login);
router.post('/logout', verifyAccessToken, auth.logout);
router.post('/refresh', auth.refresh);
router.post('/forgot-password', rateLimiter, validate(forgotPasswordSchema), auth.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), auth.resetPassword);

export default router;
