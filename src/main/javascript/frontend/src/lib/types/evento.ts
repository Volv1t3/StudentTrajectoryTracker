export type EventStatus = 'Próximo' | 'Abierto' | 'En_Curso' | 'Finalizado' | 'Cancelado';
export type EventType = 'Taller' | 'Charla' | 'Convocatoria' | 'Hackatón' | 'Día_De_Demostración' | 'Visita' | 'Otro';

export interface Event {
  id: number;
  title: string;
  slug: string;
  type: EventType;
  short_description: string;
  full_description: string;
  target_audience: string | null;
  location: string | null;
  event_date: string | null;
  event_end_date: string | null;
  registration_deadline: string | null;
  capacity: number | null;
  banner_media_asset_id: number | null;
  video_media_asset_id: number | null;
  poster_media_asset_id: number | null;
  banner_image_url: string | null;
  video_url: string | null;
  poster_image_url: string | null;
  registration_url: string | null;
  status: EventStatus;
  is_highlighted: boolean;
  is_visible: boolean;
  created_by_admin_id: number;
  created_at: string;
  updated_at: string;
}

/** Public view from vw_public_events */
export interface EventPublic extends Event {
  tags: { id: number; name: string; slug: string }[] | null;
}
