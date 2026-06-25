import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { apiPost } from '$lib/server/api';
import { isUsfqEmail, normalizeEmail } from '$lib/utils';
import { validatePasswordPolicy } from '$lib/utils/password';

export const load: PageServerLoad = async ({ url }) => {
  return { token: url.searchParams.get('token') || '' };
};

export const actions: Actions = {
  forgotPassword: async ({ request }) => {
    const form = await request.formData();
    const email = normalizeEmail(form.get('email') as string);
    if (!email) return fail(400, { error: 'Correo requerido' });
    if (!isUsfqEmail(email)) return fail(400, { error: 'El correo debe terminar en .usfq.edu.ec' });

    await apiPost('/api/auth/forgot-password', { email });
    return { success: true, message: 'Si el correo existe, recibirás instrucciones' };
  },

  resetPassword: async ({ request }) => {
    const form = await request.formData();
    const token = form.get('token') as string;
    const password = form.get('password') as string;
    const confirm = (form.get('confirm') as string) || password;

    if (!token || !password) return fail(400, { error: 'Token y contraseña requeridos' });
    const passwordError = validatePasswordPolicy(password);
    if (passwordError) return fail(400, { error: passwordError });

    const res = await apiPost('/api/auth/reset-password', { token, new_password: password, confirm });

    if (!res.ok) {
      const msg = (res.data as any)?.error?.message || 'Token inválido o expirado';
      return fail(res.status, { error: msg });
    }

    return { success: true, message: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
  }
};
