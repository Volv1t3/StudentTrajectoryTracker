import { type RequestHandler } from '@sveltejs/kit';
import { clearAdminSession, getAdminAccessToken } from '$lib/server/auth';
import { api } from '$lib/server/api';

export const POST: RequestHandler = async ({ cookies }) => {
  const token = getAdminAccessToken(cookies);
  const refreshToken = cookies.get('dlab_admin_refresh');

  if (token) {
    await api('/api/admin/auth/logout', {
      method: 'POST',
      accessToken: token,
      cookies: refreshToken ? `dlab_admin_refresh=${refreshToken}` : undefined,
    }).catch(() => {});
  }
  clearAdminSession(cookies);
  return new Response(null, {
    status: 303,
    headers: { Location: '/admin/login' }
  });
};
