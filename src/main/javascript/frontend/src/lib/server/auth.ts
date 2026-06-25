import type { Cookies } from '@sveltejs/kit';

const ACCESS_COOKIE = 'dlab_access';
const REFRESH_COOKIE = 'dlab_refresh';
const ADMIN_ACCESS_COOKIE = 'dlab_admin_access';
const ADMIN_REFRESH_COOKIE = 'dlab_admin_refresh';
const ACCESS_TTL = 14 * 60; // 14 min (slightly less than 15m expiry)
const ADMIN_TTL = 8 * 60 * 60;
const REFRESH_PATH = '/';
const ADMIN_REFRESH_PATH = '/';

const cookieOpts = (maxAge: number) => ({
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge,
});

/** Store user access token from backend login response */
export function setUserSession(cookies: Cookies, accessToken: string): void {
  cookies.set(ACCESS_COOKIE, accessToken, cookieOpts(ACCESS_TTL));
}

/** Store admin access token */
export function setAdminSession(cookies: Cookies, accessToken: string): void {
  cookies.set(ADMIN_ACCESS_COOKIE, accessToken, cookieOpts(ADMIN_TTL));
}

/** Get user access token */
export function getUserAccessToken(cookies: Cookies): string | null {
  return cookies.get(ACCESS_COOKIE) ?? null;
}

/** Get admin access token */
export function getAdminAccessToken(cookies: Cookies): string | null {
  return cookies.get(ADMIN_ACCESS_COOKIE) ?? null;
}

/** Clear user access cookie only */
export function clearUserSession(cookies: Cookies): void {
  cookies.delete(ACCESS_COOKIE, { path: '/' });
}

/** Clear admin session */
export function clearAdminSession(cookies: Cookies): void {
  cookies.delete(ADMIN_ACCESS_COOKIE, { path: '/' });
  cookies.delete(ADMIN_REFRESH_COOKIE, { path: ADMIN_REFRESH_PATH });
}

/** Clear the full collaborator session: access + refresh */
export function clearCollaboratorSession(cookies: Cookies): void {
  cookies.delete(ACCESS_COOKIE, { path: '/' });
  cookies.delete(REFRESH_COOKIE, { path: REFRESH_PATH });
}

/** Decode JWT payload without verification (backend already verified) */
export function decodeAccessToken(token: string): { sub: number; role: string } | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
