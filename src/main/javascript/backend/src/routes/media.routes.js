import { Router } from 'express';
import { verifyAdminToken } from '../middleware/auth.js';
import uploadMiddleware from '../middleware/upload.js';
import * as media from '../controllers/media.controller.js';

const router = Router();
router.use(verifyAdminToken);

router.post('/upload', uploadMiddleware, media.upload);
router.delete('/', media.deleteMedia);
router.get('/', media.list);

export default router;
