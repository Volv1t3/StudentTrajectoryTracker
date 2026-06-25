import type { PageServerLoad } from './$types';
import { apiGet } from '$lib/server/api';
import { getAdminAccessToken } from '$lib/server/auth';

export const load: PageServerLoad = async ({ cookies, url }) => {
  const token = getAdminAccessToken(cookies)!;
  const params = new URLSearchParams();
  const search = url.searchParams.get('search');
  const page = url.searchParams.get('page') || '1';
  if (search) params.set('search', search);
  params.set('page', page);

  const res = await apiGet<any>(`/api/admin/administrators?${params}`, token);
  return {
    administradores: res.ok ? res.data.data : [],
    meta: res.ok ? res.data.meta : { page: 1, limit: 20, total: 0 },
  };
};
