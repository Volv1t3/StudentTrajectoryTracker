import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$lib/server/env';
import { setUserSession, clearCollaboratorSession } from '$lib/server/auth';

const API_BASE = () => env('API_BASE_URL') || 'http://localhost:34761';
const REFRESH_COOKIE = 'dlab_refresh';
const REFRESH_PATH = '/';

export const POST: RequestHandler = async ({ cookies }) => {
  const refreshToken = cookies.get(REFRESH_COOKIE);
  if (!refreshToken) {
    clearCollaboratorSession(cookies);
    return new Response(JSON.stringify({ error: 'No refresh token' }), { status: 401 });
  }

  const res = await fetch(`${API_BASE()}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `${REFRESH_COOKIE}=${refreshToken}`,
    },
  });

  if (!res.ok) {
    clearCollaboratorSession(cookies);
    return new Response(JSON.stringify({ error: 'Refresh failed' }), { status: 401 });
  }

  const data = await res.json();
  setUserSession(cookies, data.access_token);

  // Mirror the rotated refresh cookie from backend
  for (const sc of res.headers.getSetCookie?.() ?? []) {
    const raw = sc.split(';')[0];
    const [name, ...rest] = raw.split('=');
    if (name.trim() === REFRESH_COOKIE) {
      cookies.set(REFRESH_COOKIE, rest.join('='), {
        path: REFRESH_PATH,
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60,
      });
    }
  }

  return new Response(JSON.stringify({ access_token: data.access_token }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
