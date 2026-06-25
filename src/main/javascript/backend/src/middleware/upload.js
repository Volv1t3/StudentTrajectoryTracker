import multer from 'multer';
import { env } from '../config/env.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.UPLOAD_MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = env.UPLOAD_ALLOWED_TYPES.split(',');
    cb(null, allowed.includes(file.mimetype));
  },
});

export default upload.single('image');
