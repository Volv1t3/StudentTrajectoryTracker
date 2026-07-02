import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { apiPost } from '$lib/server/api';
import { getAdminAccessToken } from '$lib/server/auth';
import { validatePasswordPolicy } from '$lib/utils/password';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const token = getAdminAccessToken(cookies)!;
    const form = await request.formData();
    const password = form.get('password') as string;
    const confirmPassword = form.get('confirmPassword') as string;

    const passwordError = validatePasswordPolicy(password);
    if (passwordError) {
      return fail(400, {
        error: passwordError,
        apiError: { code: 'ERR_VALIDATION', message: passwordError, fields: { password: passwordError } },
      });
    }
    if (password !== confirmPassword) {
      const msg = 'Las contraseñas no coinciden';
      return fail(400, {
        error: msg,
        apiError: { code: 'ERR_VALIDATION', message: msg, fields: { confirmPassword: msg } },
      });
    }

    const body = {
      firstName: form.get('firstName') as string,
      middleName: (form.get('middleName') as string) || null,
      lastName: form.get('lastName') as string,
      secondLastName: (form.get('secondLastName') as string) || null,
      personalEmail: form.get('personalEmail') as string,
      usfqEmail: form.get('usfqEmail') as string,
      phoneNumber: (form.get('phoneNumber') as string) || null,
      dateOfBirth: (form.get('dateOfBirth') as string) || null,
      password,
    };

    const res = await apiPost('/api/admin/administrators', body, token);
    if (!res.ok) {
      const apiError = (res.data as any)?.error ?? null;
      const msg = apiError?.message || 'Error al crear administrador';
      return fail(res.status, { error: msg, apiError });
    }
    throw redirect(303, '/admin/administradores');
  },
};
