import type { Cookies } from '@sveltejs/kit';
import { env } from './env';
import { getUserAccessToken, setUserSession, clearCollaboratorSession } from './auth';

const API_BASE = () => env('API_BASE_URL') || 'http://localhost:34761';

interface ApiOptions {
  method?: string;
  body?: unknown;
  accessToken?: string;
  cookies?: string;
}

interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
  setCookie?: string[];
}

function isFormDataBody(body: unknown): body is FormData {
  if (typeof FormData === 'undefined' || !body || typeof body !== 'object') return false;
  if (body instanceof FormData) return true;
  return Object.prototype.toString.call(body) === '[object FormData]'
    || typeof (body as FormData).append === 'function' && typeof (body as FormData).get === 'function' && typeof (body as FormData).entries === 'function';
}

/**
 * Server-side API client for calling the Express backend.
 * Used exclusively in +page.server.ts and +layout.server.ts files.
 */
export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<ApiResponse<T>> {
  const { method = 'GET', body, accessToken, cookies } = opts;

  const isFormData = isFormDataBody(body);
  const headers: Record<string, string> = isFormData ? {} : { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  if (cookies) headers['Cookie'] = cookies;

  const res = await fetch(`${API_BASE()}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const setCookie = res.headers.getSetCookie?.() ?? [];
  const data = res.headers.get('content-type')?.includes('application/json')
    ? await res.json()
    : null;

  return { ok: res.ok, status: res.status, data: data as T, setCookie };
}

/** Convenience GET */
export const apiGet = <T = unknown>(path: string, accessToken?: string) =>
  api<T>(path, { accessToken });

/** Convenience POST */
export const apiPost = <T = unknown>(path: string, body: unknown, accessToken?: string) =>
  api<T>(path, { method: 'POST', body, accessToken });

/** Convenience PUT */
export const apiPut = <T = unknown>(path: string, body: unknown, accessToken?: string) =>
  api<T>(path, { method: 'PUT', body, accessToken });

/** Convenience PATCH */
export const apiPatch = <T = unknown>(path: string, body: unknown, accessToken?: string) =>
  api<T>(path, { method: 'PATCH', body, accessToken });

/** Convenience DELETE */
export const apiDelete = <T = unknown>(path: string, accessToken?: string) =>
  api<T>(path, { method: 'DELETE', accessToken });

/**
 * Attempt to refresh the collaborator session via the frontend proxy.
 * Returns the new access token on success, or null on failure.
 */
async function attemptRefresh(skCookies: Cookies): Promise<string | null> {
  const refreshCookie = skCookies.get('dlab_refresh');
  if (!refreshCookie) return null;

  const res = await fetch(`${API_BASE()}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `dlab_refresh=${refreshCookie}`,
    },
  });

  if (!res.ok) return null;

  const data = await res.json();
  setUserSession(skCookies, data.access_token);

  // Mirror rotated refresh cookie
  for (const sc of res.headers.getSetCookie?.() ?? []) {
    const raw = sc.split(';')[0];
    const [name, ...rest] = raw.split('=');
    if (name.trim() === 'dlab_refresh') {
      skCookies.set('dlab_refresh', rest.join('='), {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60,
      });
    }
  }

  return data.access_token;
}

/**
 * Authenticated API call with auto-refresh on 401.
 * Attempts the request, and if it returns 401, tries to refresh the token once and retry.
 * Clears the collaborator session on terminal failure.
 */
export async function apiAuthenticated<T = unknown>(
  path: string,
  skCookies: Cookies,
  opts: Omit<ApiOptions, 'accessToken'> = {},
): Promise<ApiResponse<T>> {
  const token = getUserAccessToken(skCookies);
  const result = await api<T>(path, { ...opts, accessToken: token ?? undefined });

  if (result.status !== 401) return result;

  // Attempt refresh once
  const newToken = await attemptRefresh(skCookies);
  if (!newToken) {
    clearCollaboratorSession(skCookies);
    return result;
  }

  // Retry with new token
  const retry = await api<T>(path, { ...opts, accessToken: newToken });
  if (retry.status === 401) {
    clearCollaboratorSession(skCookies);
  }
  return retry;
}
