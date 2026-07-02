import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { apiPost } from '$lib/server/api';
import { validatePasswordPolicy } from '$lib/utils/password';

export const load: PageServerLoad = async ({ url }) => {
  const token = url.searchParams.get('token') || '';
  return { token, valid: token.length > 0 };
};

export const actions: Actions = {
  activate: async ({ request }) => {
    const form = await request.formData();
    const token = form.get('token') as string;
    const password = form.get('password') as string;

    if (!token || !password) {
      const msg = 'Token y contraseña requeridos';
      return fail(400, {
        error: msg,
        apiError: { code: 'ERR_VALIDATION', message: msg, fields: { token: !token ? 'Token requerido' : '', password: !password ? 'Contraseña requerida' : '' } },
      });
    }
    const passwordError = validatePasswordPolicy(password);
    if (passwordError) {
      return fail(400, {
        error: passwordError,
        apiError: { code: 'ERR_VALIDATION', message: passwordError, fields: { password: passwordError } },
      });
    }

    const res = await apiPost('/api/auth/activate', { token, password });

    if (!res.ok) {
      const apiError = (res.data as any)?.error ?? null;
      const msg = apiError?.message || 'Token inválido o expirado';
      return fail(res.status, { error: msg, apiError });
    }

    throw redirect(303, '/login?message=activated');
  }
};
