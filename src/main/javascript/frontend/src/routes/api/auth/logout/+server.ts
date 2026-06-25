import type { RequestHandler } from '@sveltejs/kit';
import { getUserAccessToken, clearCollaboratorSession } from '$lib/server/auth';
import { api } from '$lib/server/api';

export const POST: RequestHandler = async ({ cookies }) => {
  const token = getUserAccessToken(cookies);
  const refreshToken = cookies.get('dlab_refresh');

  if (token) {
    // Forward both access token (header) and refresh cookie to backend
    await api('/api/auth/logout', {
      method: 'POST',
      accessToken: token,
      cookies: refreshToken ? `dlab_refresh=${refreshToken}` : undefined,
    }).catch(() => {});
  }

  clearCollaboratorSession(cookies);

  return new Response(null, {
    status: 303,
    headers: { Location: '/' },
  });
};
