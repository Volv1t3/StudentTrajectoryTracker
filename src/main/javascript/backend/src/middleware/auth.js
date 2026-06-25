import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import AppError from '../utils/AppError.js';

function extractToken(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new AppError('ERR_TOKEN_MISSING', 'Token missing', 401);
  return header.slice(7);
}

function decode(token) {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (e) {
    if (e.name === 'TokenExpiredError') throw new AppError('ERR_TOKEN_EXPIRED', 'Token expired', 401);
    throw new AppError('ERR_TOKEN_INVALID', 'Invalid token', 401);
  }
}

export function verifyAccessToken(req, _res, next) {
  const payload = decode(extractToken(req));
  if (payload.role !== 'collaborator') throw new AppError('ERR_FORBIDDEN', 'Forbidden', 403);
  req.user = { sub: payload.sub, id: payload.sub, role: 'collaborator' };
  next();
}

export function verifyAdminToken(req, _res, next) {
  const payload = decode(extractToken(req));
  if (payload.role !== 'admin') throw new AppError('ERR_FORBIDDEN', 'Forbidden', 403);
  req.admin = { sub: payload.sub, id: payload.sub, role: 'admin' };
  req.user = { sub: payload.sub, id: payload.sub, role: 'admin' };
  next();
}
