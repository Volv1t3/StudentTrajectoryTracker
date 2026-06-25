import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import { generateHmacToken, verifyHmacToken } from '../utils/token.utils.js';

export const hashPassword = (password) => bcrypt.hash(password, env.BCRYPT_ROUNDS);
export const comparePassword = (password, hash) => bcrypt.compare(password, hash);

export const generateActivationToken = () => generateHmacToken(env.ACTIVATION_TOKEN_SECRET);
export const generateResetToken = () => generateHmacToken(env.RESET_TOKEN_SECRET);

export const verifyActivationToken = (rawToken, storedHash) =>
  verifyHmacToken(rawToken, env.ACTIVATION_TOKEN_SECRET, storedHash);

export const verifyResetToken = (rawToken, storedHash) =>
  verifyHmacToken(rawToken, env.RESET_TOKEN_SECRET, storedHash);
