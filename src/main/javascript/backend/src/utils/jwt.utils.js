import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signAccessToken = (payload, expiresIn = env.JWT_ACCESS_EXPIRES_IN) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn });

export const signRefreshToken = (payload, expiresIn = env.JWT_REFRESH_EXPIRES_IN) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn });

export const verifyToken = (token, secret) => jwt.verify(token, secret);
