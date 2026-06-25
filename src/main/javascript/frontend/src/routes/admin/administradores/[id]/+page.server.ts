import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { apiGet, api } from '$lib/server/api';
import { getAdminAccessToken } from '$lib/server/auth';

export const load: PageServerLoad = async ({ params, cookies }) => {
  const token = getAdminAccessToken(cookies)!;
  const res = await apiGet<any>(`/api/admin/administrators/${params.id}`, token);
  if (!res.ok) throw error(404, 'Administrador no encontrado');
  return { admin: res.data };
};

export const actions: Actions = {
  update: async ({ request, params, cookies }) => {
    const token = getAdminAccessToken(cookies)!;
    const form = await request.formData();
    const body = {
      firstName: form.get('firstName') as string,
      middleName: (form.get('middleName') as string) || null,
      lastName: form.get('lastName') as string,
      secondLastName: (form.get('secondLastName') as string) || null,
      personalEmail: form.get('personalEmail') as string,
      usfqEmail: form.get('usfqEmail') as string,
      phoneNumber: (form.get('phoneNumber') as string) || null,
      dateOfBirth: (form.get('dateOfBirth') as string) || null,
      isActive: form.get('isActive') === 'on',
    };
    const res = await api(`/api/admin/administrators/${params.id}`, { method: 'PUT', body, accessToken: token });
    if (!res.ok) return fail(res.status, { error: (res.data as any)?.error?.message || 'Error al actualizar' });
    throw redirect(303, '/admin/administradores');
  },
  delete: async ({ params, cookies }) => {
    const token = getAdminAccessToken(cookies)!;
    const res = await api(`/api/admin/administrators/${params.id}`, { method: 'DELETE', accessToken: token });
    if (!res.ok) return fail(res.status, { error: (res.data as any)?.error?.message || 'Error al eliminar' });
    throw redirect(303, '/admin/administradores');
  },
};
