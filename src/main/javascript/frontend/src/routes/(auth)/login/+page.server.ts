import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { apiPost } from '$lib/server/api';
import { clearAdminSession, setUserSession } from '$lib/server/auth';
import type { LoginResponse } from '$lib/types/auth';
import { isUsfqEmail, normalizeEmail } from '$lib/utils';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();
  if (user && user.role === 'collaborator') throw redirect(302, '/profile');
  return {};
};

const loginAction: Actions['default'] = async ({ request, cookies }) => {
  const form = await request.formData();
  const email = normalizeEmail(form.get('email') as string);
  const password = form.get('password') as string;

  if (!email || !password) {
    const msg = 'Correo y contraseña requeridos';
    return fail(400, { error: msg, apiError: { code: 'ERR_VALIDATION', message: msg, fields: { email: !email ? msg : '', password: !password ? msg : '' } } });
  }
  if (!isUsfqEmail(email)) {
    const msg = 'El correo debe terminar en .usfq.edu.ec';
    return fail(400, { error: msg, apiError: { code: 'ERR_VALIDATION', message: msg, fields: { email: msg } } });
  }

  const res = await apiPost<LoginResponse>('/api/auth/login', { email, password });

  if (!res.ok) {
    const apiError = (res.data as any)?.error ?? null;
    const msg = apiError?.message || 'Credenciales inválidas';
    return fail(res.status, { error: msg, apiError });
  }

  clearAdminSession(cookies);
  setUserSession(cookies, res.data.access_token);

  for (const sc of res.setCookie ?? []) {
    const raw = sc.split(';')[0];
    const [name, ...rest] = raw.split('=');
    if (name.trim() === 'dlab_refresh') {
      cookies.set(name.trim(), rest.join('='), { path: '/', httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 });
    }
  }

  const returnUrl = new URL(request.url).searchParams.get('return') || '/profile';
  throw redirect(302, returnUrl);
};

export const actions: Actions = {
  login: loginAction
};
