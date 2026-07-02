import multer from 'multer';
import AppError from '../utils/AppError.js';
import { env } from '../config/env.js';

export default function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    const body = { code: err.code, message: err.message };
    // Only ERR_VALIDATION extends the contract with `fields` + `issues`.
    // Non-validation AppErrors keep the historical { code, message } shape.
    if (err.code === 'ERR_VALIDATION') {
      const fields = (err.metadata && err.metadata.fields) || err.fields;
      const issues = (err.metadata && err.metadata.issues) || err.issues;
      if (fields && typeof fields === 'object') body.fields = fields;
      if (Array.isArray(issues)) body.issues = issues;
    }
    return res.status(err.httpStatus).json({ success: false, error: body });
  }
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, error: { code: 'ERR_FILE_TOO_LARGE', message: 'El archivo excede el tamaño máximo permitido' } });
  }
  const message = env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message;
  res.status(500).json({ success: false, error: { code: 'ERR_INTERNAL', message } });
}
