import type { Cookies, Handle, HandleServerError } from '@sveltejs/kit';
import {
  getUserAccessToken,
  getAdminAccessToken,
  decodeAccessToken,
  clearUserSession,
  clearAdminSession,
  clearAdminAccessSession,
  setUserSession,
  setAdminSession
} from '$lib/server/auth';
import { env } from '$lib/server/env';

const API_BASE = () => env('API_BASE_URL') || 'http://localhost:34761';
const POSTHOG_HOST = () => env('PUBLIC_POSTHOG_HOST') || 'https://us.i.posthog.com';

function derivePostHogProxyHosts(configuredHost: string) {
  try {
    const url = new URL(configuredHost);
    const hostname = url.hostname;

    if (hostname === 'us.posthog.com') {
      return { ingestHost: 'us.i.posthog.com', assetHost: 'us-assets.i.posthog.com' };
    }
    if (hostname === 'eu.posthog.com') {
      return { ingestHost: 'eu.i.posthog.com', assetHost: 'eu-assets.i.posthog.com' };
    }
    if (hostname === 'us.i.posthog.com') {
      return { ingestHost: 'us.i.posthog.com', assetHost: 'us-assets.i.posthog.com' };
    }
    if (hostname === 'eu.i.posthog.com') {
      return { ingestHost: 'eu.i.posthog.com', assetHost: 'eu-assets.i.posthog.com' };
    }

    if (hostname.endsWith('.i.posthog.com')) {
      return {
        ingestHost: hostname,
        assetHost: hostname.replace('.i.posthog.com', '-assets.i.posthog.com'),
      };
    }

    return { ingestHost: hostname, assetHost: hostname };
  } catch {
    return { ingestHost: 'us.i.posthog.com', assetHost: 'us-assets.i.posthog.com' };
  }
}

function mirrorRefreshCookie(cookies: Cookies, response: Response, name: string, maxAge: number): void {
  for (const sc of response.headers.getSetCookie?.() ?? []) {
    const raw = sc.split(';')[0];
    const [cookieName, ...rest] = raw.split('=');
    if (cookieName.trim() === name) {
      cookies.set(name, rest.join('='), {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge,
      });
    }
  }
}

async function attemptCollaboratorRefreshInHook(cookies: Cookies): Promise<string | null> {
  const refreshToken = cookies.get('dlab_refresh');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE()}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `dlab_refresh=${refreshToken}`,
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    setUserSession(cookies, data.access_token);
    mirrorRefreshCookie(cookies, res, 'dlab_refresh', 7 * 24 * 60 * 60);

    return data.access_token;
  } catch {
    return null;
  }
}

async function attemptAdminRefreshInHook(cookies: Cookies): Promise<string | null> {
  const refreshToken = cookies.get('dlab_admin_refresh');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE()}/api/admin/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `dlab_admin_refresh=${refreshToken}`,
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    setAdminSession(cookies, data.access_token);
    mirrorRefreshCookie(cookies, res, 'dlab_admin_refresh', 24 * 60 * 60);

    return data.access_token;
  } catch {
    return null;
  }
}

export const handle: Handle = async ({ event, resolve }) => {
  const userToken = getUserAccessToken(event.cookies);
  const adminToken = getAdminAccessToken(event.cookies);
  const isAdminRoute = event.url.pathname.startsWith('/admin');

  event.locals.user = null;
  event.locals.accessToken = null;

  if (isAdminRoute) {
    const payload = adminToken ? decodeAccessToken(adminToken) : null;
    if (payload) {
      event.locals.user = { id: payload.sub, role: payload.role };
      event.locals.accessToken = adminToken;
    } else {
      if (adminToken) clearAdminAccessSession(event.cookies);
      const newToken = await attemptAdminRefreshInHook(event.cookies);
      if (newToken) {
        const newPayload = decodeAccessToken(newToken);
        if (newPayload) {
          event.locals.user = { id: newPayload.sub, role: newPayload.role };
          event.locals.accessToken = newToken;
        }
      } else if (adminToken || event.cookies.get('dlab_admin_refresh')) {
        clearAdminSession(event.cookies);
      }
    }
  } else if (userToken || event.cookies.get('dlab_refresh')) {
    const payload = userToken ? decodeAccessToken(userToken) : null;
    if (payload) {
      event.locals.user = { id: payload.sub, role: payload.role };
      event.locals.accessToken = userToken;
    } else {
      if (userToken) clearUserSession(event.cookies);
      const newToken = await attemptCollaboratorRefreshInHook(event.cookies);
      if (newToken) {
        const newPayload = decodeAccessToken(newToken);
        if (newPayload) {
          event.locals.user = { id: newPayload.sub, role: newPayload.role };
          event.locals.accessToken = newToken;
        }
      } else {
        clearUserSession(event.cookies);
        event.cookies.delete('dlab_refresh', { path: '/' });
      }
    }
  }

  // PostHog proxy
  const { pathname } = event.url;
  if (pathname.startsWith('/dlab-analytics')) {
    const useAssetHost =
      pathname.startsWith('/dlab-analytics/static/') ||
      pathname.startsWith('/dlab-analytics/array/');
    const { ingestHost, assetHost } = derivePostHogProxyHosts(POSTHOG_HOST());
    const hostname = useAssetHost ? assetHost : ingestHost;
    const url = new URL(event.request.url);
    url.protocol = 'https:';
    url.hostname = hostname;
    url.port = '443';
    url.pathname = pathname.replace(/^\/dlab-analytics/, '');
    const headers = new Headers(event.request.headers);
    headers.delete('host');
    headers.delete('connection');
    headers.delete('content-length');
    headers.delete('accept-encoding');
    const clientIp = event.request.headers.get('x-forwarded-for') || event.getClientAddress();
    if (clientIp) headers.set('x-forwarded-for', clientIp);

    const method = event.request.method.toUpperCase();
    const hasBody = method !== 'GET' && method !== 'HEAD';
    const body = hasBody ? Buffer.from(await event.request.arrayBuffer()) : undefined;
    const proxied = await fetch(url.toString(), {
      method,
      headers,
      body,
      redirect: 'manual',
    });

    const responseHeaders = new Headers(proxied.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');
    responseHeaders.delete('transfer-encoding');

    return new Response(proxied.body, {
      status: proxied.status,
      statusText: proxied.statusText,
      headers: responseHeaders
    });
  }

  return resolve(event);
};

export const handleError: HandleServerError = async ({ error, status, message }) => {
  console.error('[Server Error]', error);
  return { message, status };
};
