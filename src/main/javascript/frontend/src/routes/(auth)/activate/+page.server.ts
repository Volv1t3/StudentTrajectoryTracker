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

    if (!token || !password) return fail(400, { error: 'Token y contraseña requeridos' });
    const passwordError = validatePasswordPolicy(password);
    if (passwordError) return fail(400, { error: passwordError, errors: { password: passwordError } });

    const res = await apiPost('/api/auth/activate', { token, password });

    if (!res.ok) {
      const msg = (res.data as any)?.error?.message || 'Token inválido o expirado';
      return fail(res.status, { error: msg });
    }

    throw redirect(303, '/login?message=activated');
  }
};
