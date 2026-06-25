import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { apiPost, apiGet } from '$lib/server/api';
import { setAdminSession, getAdminAccessToken, decodeAccessToken, clearCollaboratorSession, clearAdminSession } from '$lib/server/auth';
import { isUsfqEmail, normalizeEmail } from '$lib/utils';

export const load: PageServerLoad = async ({ cookies }) => {
  const token = getAdminAccessToken(cookies);
  if (token && decodeAccessToken(token)?.role === 'admin') throw redirect(302, '/admin/colaboradores');
  const res = await apiGet<any[]>('/api/public/media?entity_type=navigation_logo');
  const logos = res.ok ? res.data : [];
  return { logo: logos[0]?.public_url ?? null };
};

export const actions: Actions = {
  adminLogin: async ({ request, cookies }) => {
    const form = await request.formData();
    const email = normalizeEmail(form.get('email') as string);
    const password = form.get('password') as string;
    if (!email || !password) return fail(400, { error: 'Credenciales requeridas' });
    if (!isUsfqEmail(email)) return fail(400, { error: 'El correo debe terminar en .usfq.edu.ec' });

    const res = await apiPost<{ access_token: string }>('/api/admin/auth/login', { email, password });
    if (!res.ok) {
      const msg = (res.data as any)?.error?.message || 'Credenciales inválidas';
      return fail(res.status, { error: msg });
    }

    clearCollaboratorSession(cookies);
    clearAdminSession(cookies);
    setAdminSession(cookies, res.data.access_token);

    for (const sc of res.setCookie ?? []) {
      const raw = sc.split(';')[0];
      const [name, ...rest] = raw.split('=');
      if (name.trim() === 'dlab_admin_refresh') {
        cookies.set(name.trim(), rest.join('='), {
          path: '/',
          httpOnly: true,
          sameSite: 'strict',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 24 * 60 * 60
        });
      }
    }

    throw redirect(302, '/admin/colaboradores');
  }
};
