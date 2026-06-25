import { z } from 'zod';

const eventTypeSchema = z.enum(['Taller', 'Charla', 'Convocatoria', 'Hackatón', 'Día_De_Demostración', 'Visita', 'Otro']);
const eventStatusSchema = z.enum(['Próximo', 'Abierto', 'En_Curso', 'Finalizado', 'Cancelado']);

const managerSchema = z.object({
  administratorId: z.number().int().positive(),
  role: z.string().min(1).optional(),
  isPrimary: z.boolean().optional(),
});

export const createEventSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  type: eventTypeSchema,
  short_description: z.string().min(1).max(500).optional(),
  full_description: z.string().min(1).optional(),
  target_audience: z.string().optional(),
  location: z.string().optional(),
  event_date: z.string().min(1),
  event_end_date: z.string().optional(),
  registration_deadline: z.string().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  banner_media_asset_id: z.number().int().positive().nullable().optional(),
  video_media_asset_id: z.number().int().positive().nullable().optional(),
  poster_media_asset_id: z.number().int().positive().nullable().optional(),
  banner_image_url: z.string().url().nullable().optional(),
  poster_image_url: z.string().url().nullable().optional(),
  video_url: z.string().url().nullable().optional(),
  registration_url: z.string().url().nullable().optional(),
  status: eventStatusSchema.optional(),
  is_highlighted: z.boolean().optional(),
  is_visible: z.boolean().optional(),
  tags: z.array(z.number().int().positive()).optional(),
  managers: z.array(managerSchema).optional(),
});

export const updateEventSchema = createEventSchema.partial();

export const updateEventVisibilitySchema = z.object({
  is_visible: z.boolean(),
});
