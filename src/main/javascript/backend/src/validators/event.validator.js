import { z } from 'zod';

// DB limit references (db_init_ordered.sql, events table):
//   title             VARCHAR(255)
//   slug              VARCHAR(255)
//   short_description VARCHAR(500)
//   target_audience   VARCHAR(300)
//   location          VARCHAR(300)
//   registration_url  VARCHAR(1000)
//   capacity          SMALLINT UNSIGNED (max 65535)

const eventTypeSchema = z.enum(
  ['Taller', 'Charla', 'Convocatoria', 'Hackatón', 'Día_De_Demostración', 'Visita', 'Otro'],
  { errorMap: () => ({ message: 'Tipo de evento inválido. Opciones permitidas: Taller, Charla, Convocatoria, Hackatón, Día_De_Demostración, Visita, Otro' }) },
);

const eventStatusSchema = z.enum(
  ['Próximo', 'Abierto', 'En_Curso', 'Finalizado', 'Cancelado'],
  { errorMap: () => ({ message: 'Estado de evento inválido. Opciones permitidas: Próximo, Abierto, En_Curso, Finalizado, Cancelado' }) },
);

const managerSchema = z.object({
  administratorId: z.number({ required_error: 'El administrador es obligatorio', invalid_type_error: 'El administrador es obligatorio' })
    .int('El administrador debe ser un número entero')
    .positive('El administrador debe ser un número positivo'),
  role: z.string().min(1, 'El rol no puede estar vacío').optional(),
  isPrimary: z.boolean({ invalid_type_error: 'El indicador principal debe ser verdadero o falso' }).optional(),
});

export const createEventSchema = z.object({
  title: z.string({ required_error: 'El título es obligatorio', invalid_type_error: 'El título es obligatorio' })
    .min(1, 'El título es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  slug: z.string()
    .min(1, 'El slug no puede estar vacío')
    .max(255, 'Máximo 255 caracteres')
    .optional(),
  type: eventTypeSchema,
  short_description: z.string()
    .min(1, 'La descripción corta no puede estar vacía')
    .max(500, 'Máximo 500 caracteres')
    .optional(),
  full_description: z.string()
    .min(1, 'La descripción completa no puede estar vacía')
    .optional(),
  target_audience: z.string().max(300, 'Máximo 300 caracteres').optional(),
  location: z.string().max(300, 'Máximo 300 caracteres').optional(),
  event_date: z.string({ required_error: 'La fecha del evento es obligatoria', invalid_type_error: 'La fecha del evento es obligatoria' })
    .min(1, 'La fecha del evento es obligatoria'),
  event_end_date: z.string().optional(),
  registration_deadline: z.string().optional(),
  capacity: z.number({ invalid_type_error: 'El cupo debe ser un número' })
    .int('El cupo debe ser un número entero')
    .positive('El cupo debe ser un número positivo')
    .nullable()
    .optional(),
  banner_media_asset_id: z.number({ invalid_type_error: 'Recurso de banner inválido' })
    .int('Recurso de banner inválido')
    .positive('Recurso de banner inválido')
    .nullable()
    .optional(),
  video_media_asset_id: z.number({ invalid_type_error: 'Recurso de video inválido' })
    .int('Recurso de video inválido')
    .positive('Recurso de video inválido')
    .nullable()
    .optional(),
  poster_media_asset_id: z.number({ invalid_type_error: 'Recurso de afiche inválido' })
    .int('Recurso de afiche inválido')
    .positive('Recurso de afiche inválido')
    .nullable()
    .optional(),
  banner_image_url: z.string().url('URL del banner inválida').nullable().optional(),
  poster_image_url: z.string().url('URL del afiche inválida').nullable().optional(),
  video_url: z.string().url('URL del video inválida').nullable().optional(),
  registration_url: z.string()
    .url('URL de registro inválida')
    .max(1000, 'Máximo 1000 caracteres')
    .nullable()
    .optional(),
  status: eventStatusSchema.optional(),
  is_highlighted: z.boolean({ invalid_type_error: 'El indicador de destacado debe ser verdadero o falso' }).optional(),
  is_visible: z.boolean({ invalid_type_error: 'La visibilidad debe ser verdadero o falso' }).optional(),
  tags: z.array(
    z.number({ invalid_type_error: 'Etiqueta inválida' })
      .int('Etiqueta inválida')
      .positive('Etiqueta inválida'),
  ).optional(),
  managers: z.array(managerSchema).optional(),
});

export const updateEventSchema = createEventSchema.partial();

export const updateEventVisibilitySchema = z.object({
  is_visible: z.boolean({ required_error: 'La visibilidad es obligatoria', invalid_type_error: 'La visibilidad debe ser verdadero o falso' }),
});
