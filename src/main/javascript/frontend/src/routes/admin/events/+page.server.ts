import type { PageServerLoad } from './$types';
import { apiGet } from '$lib/server/api';
import { getAdminAccessToken } from '$lib/server/auth';
import type { Event, PaginatedResponse } from '$lib/types';

export const load: PageServerLoad = async ({ cookies, url }) => {
  const token = getAdminAccessToken(cookies)!;
  const page = url.searchParams.get('page') || '1';
  const res = await apiGet<PaginatedResponse<Event>>(`/api/admin/events?page=${page}`, token);
  const events = (res.ok ? res.data.data : []).map((e) => ({
    ...e,
    nombre: e.title,
    slug: e.slug,
    tipo: e.type,
    estado: e.status,
    fecha_inicio: e.event_date,
    visible: e.is_visible,
  }));
  return {
    events,
    meta: res.ok ? res.data.meta : { page: 1, limit: 20, total: 0 },
  };
};
