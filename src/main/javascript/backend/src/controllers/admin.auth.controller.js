import { env } from '../config/env.js';
import * as authQ from '../queries/auth.queries.js';
import * as authService from '../services/auth.service.js';
import { signAccessToken, signRefreshToken } from '../utils/jwt.utils.js';
import { createHmac } from 'crypto';

const errorResponse = (res, code, message, status) =>
  res.status(status).json({ success: false, error: { code, message } });

const COOKIE = 'dlab_admin_refresh';
const cookieOpts = { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 24 * 60 * 60 * 1000 };
const hashToken = (t) => createHmac('sha256', env.JWT_REFRESH_SECRET).update(t).digest('hex');

export async function login(req, res, next) {
  try {
    const { email, password } = req.validated;
    const admin = await authQ.findAdminByEmail(email);
    if (!admin || !admin.password_hash) return errorResponse(res, 'AUTH_FAILED', 'Credenciales inválidas', 401);
    if (!await authService.comparePassword(password, admin.password_hash)) return errorResponse(res, 'AUTH_FAILED', 'Credenciales inválidas', 401);
    const payload = { sub: admin.id, role: 'admin' };
    const accessToken = signAccessToken(payload, env.JWT_ADMIN_ACCESS_EXPIRES_IN);
    const refreshToken = signRefreshToken(payload, env.JWT_ADMIN_REFRESH_EXPIRES_IN);
    await authQ.storeRefreshToken({ userType: 'Administrador', userId: admin.id, tokenHash: hashToken(refreshToken), expiresAt: new Date(Date.now() + 86400000), userAgent: req.headers['user-agent'], ipAddress: req.ip });
    res.cookie(COOKIE, refreshToken, cookieOpts);
    res.json({ access_token: accessToken, user: { id: admin.id, name: admin.name, email: admin.email, role: 'admin' } });
  } catch (e) { next(e); }
}

export async function logout(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE];
    if (token) { await authQ.revokeToken(hashToken(token)); res.clearCookie(COOKIE, cookieOpts); }
    res.status(204).end();
  } catch (e) { next(e); }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE];
    if (!token) return errorResponse(res, 'NO_TOKEN', 'No refresh token', 401);
    const tokenHash = hashToken(token);
    const stored = await authQ.findRefreshToken(tokenHash);
    if (!stored || stored.user_type !== 'Administrador') return errorResponse(res, 'INVALID_TOKEN', 'Token inválido', 401);
    await authQ.revokeToken(tokenHash);
    const payload = { sub: stored.user_id, role: 'admin' };
    const newRefresh = signRefreshToken(payload, env.JWT_ADMIN_REFRESH_EXPIRES_IN);
    await authQ.storeRefreshToken({ userType: 'Administrador', userId: stored.user_id, tokenHash: hashToken(newRefresh), expiresAt: new Date(Date.now() + 86400000), userAgent: req.headers['user-agent'], ipAddress: req.ip });
    res.cookie(COOKIE, newRefresh, cookieOpts);
    res.json({ access_token: signAccessToken(payload, env.JWT_ADMIN_ACCESS_EXPIRES_IN) });
  } catch (e) { next(e); }
}
