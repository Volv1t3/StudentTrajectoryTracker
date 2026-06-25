import { Router } from 'express';
import { verifyAdminToken } from '../middleware/auth.js';
import { validate } from '../validators/validate.js';
import { loginSchema } from '../validators/auth.validator.js';
import * as adminAuth from '../controllers/admin.auth.controller.js';

const router = Router();

router.post('/login', validate(loginSchema), adminAuth.login);
router.post('/logout', verifyAdminToken, adminAuth.logout);
router.post('/refresh', adminAuth.refresh);

export default router;
