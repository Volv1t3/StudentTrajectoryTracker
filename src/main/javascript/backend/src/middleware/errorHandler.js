import multer from 'multer';
import AppError from '../utils/AppError.js';
import { env } from '../config/env.js';

export default function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.httpStatus).json({ success: false, error: { code: err.code, message: err.message } });
  }
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, error: { code: 'ERR_FILE_TOO_LARGE', message: 'File too large' } });
  }
  const message = env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  res.status(500).json({ success: false, error: { code: 'ERR_INTERNAL', message } });
}
