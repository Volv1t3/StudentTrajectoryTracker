import type { PageServerLoad } from './$types';
import { apiGet } from '$lib/server/api';
import type { EventPublic, PaginatedResponse } from '$lib/types';

export const load: PageServerLoad = async ({ url }) => {
  const type = url.searchParams.get('type') || '';
  const upcoming = url.searchParams.get('upcoming') || '';
  const page = url.searchParams.get('page') || '1';

  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (upcoming) params.set('upcoming', upcoming);
  params.set('page', page);

  const res = await apiGet<PaginatedResponse<EventPublic>>(`/api/public/events?${params}`);

  const rawEvents = res.ok ? res.data.data : [];
  const normalized = rawEvents.map((e) => ({
    id: e.id,
    nombre: e.title,
    slug: e.slug,
    tipo: e.type === "Día_De_Demostración"? 'Día de Demostración': e.type,
    descripcion_corta: e.short_description,
    fecha_inicio: e.event_date || '',
    modalidad: e.location || 'por_definir',
    cuota_maxima: e.capacity || undefined,
  }));

  const now = Date.now();
  const upcomingEvents = normalized.filter((e) => e.fecha_inicio && new Date(e.fecha_inicio).getTime() >= now);
  const pastEvents = normalized.filter((e) => e.fecha_inicio && new Date(e.fecha_inicio).getTime() < now);

  return {
    upcomingEvents,
    pastEvents,
    meta: res.ok ? res.data.meta : { page: 1, limit: 20, total: 0 },
  };
};
