import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { apiGet } from '$lib/server/api';
import type { EventPublic } from '$lib/types/evento';

export const load: PageServerLoad = async ({ params }) => {
  const res = await apiGet<EventPublic>(`/api/public/events/${params.slug}`);
  if (!res.ok) throw error(404, 'Evento no encontrado');

  const e = res.data;
  const event = {
    ...e,
    id: e.id,
    nombre: e.title,
    slug: e.slug,
    tipo: e.type === "Día_De_Demostración"? 'Día de Demostración': e.type,
    descripcion_corta: e.short_description,
    descripcion_larga: e.full_description,
    audiencia_objetivo: e.target_audience || undefined,
    fecha_inicio: e.event_date || '',
    fecha_fin: e.event_end_date || '',
    fecha_cierre_registro: e.registration_deadline || '',
    lugar: e.location || undefined,
    cuota_maxima: e.capacity || undefined,
    link_externo: e.registration_url || undefined,
    banner_image_url: e.banner_image_url || undefined,
    poster_image_url: e.poster_image_url || undefined,
    video_url: e.video_url || undefined,
  };

  return { event };
};
