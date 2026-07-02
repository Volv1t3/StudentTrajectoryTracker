import { z } from 'zod';

// DB limit references (db_init_ordered.sql):
//   projects.title             VARCHAR(255)
//   projects.slug              VARCHAR(255)
//   projects.short_description VARCHAR(500)
//   projects.target_audience   VARCHAR(300)
//   projects.max_collaborators SMALLINT UNSIGNED (max 65535)
//   project_meeting_days.notes VARCHAR(300)
//   tags.name                  VARCHAR(100)
//   tags.slug                  VARCHAR(100)
//   project_required_skills.name VARCHAR(100)
//   project_required_skills.slug VARCHAR(100)

const meetingDaySchema = z.object({
  dayOfWeek: z.enum(
    ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    { errorMap: () => ({ message: 'Día de la semana inválido' }) },
  ),
  startTime: z.string({ required_error: 'La hora de inicio es obligatoria', invalid_type_error: 'La hora de inicio es obligatoria' })
    .min(1, 'La hora de inicio es obligatoria'),
  endTime: z.string({ required_error: 'La hora de fin es obligatoria', invalid_type_error: 'La hora de fin es obligatoria' })
    .min(1, 'La hora de fin es obligatoria'),
  notes: z.string().max(300, 'Máximo 300 caracteres').optional().nullable(),
});

const managerSchema = z.object({
  administratorId: z.number({ required_error: 'El administrador es obligatorio', invalid_type_error: 'El administrador es obligatorio' })
    .int('El administrador debe ser un número entero')
    .positive('El administrador debe ser un número positivo'),
  role: z.string().min(1, 'El rol no puede estar vacío').optional(),
  isPrimary: z.boolean({ invalid_type_error: 'El indicador principal debe ser verdadero o falso' }).optional(),
});

const newTagSchema = z.object({
  name: z.string({ required_error: 'El nombre de la etiqueta es obligatorio', invalid_type_error: 'El nombre de la etiqueta es obligatorio' })
    .min(1, 'El nombre de la etiqueta es obligatorio')
    .max(100, 'Máximo 100 caracteres'),
  slug: z.string().max(100, 'Máximo 100 caracteres').optional(),
  category: z.string().min(1, 'La categoría no puede estar vacía').optional(),
});

const requiredSkillItemSchema = z.object({
  name: z.string({ required_error: 'El nombre de la habilidad es obligatorio', invalid_type_error: 'El nombre de la habilidad es obligatorio' })
    .min(1, 'El nombre de la habilidad es obligatorio')
    .max(100, 'Máximo 100 caracteres'),
  slug: z.string().max(100, 'Máximo 100 caracteres').optional(),
});

export const createProjectSchema = z.object({
  title: z.string({ required_error: 'El título es obligatorio', invalid_type_error: 'El título es obligatorio' })
    .min(1, 'El título es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  slug: z.string().max(255, 'Máximo 255 caracteres').optional(),
  short_description: z.string({ required_error: 'La descripción corta es obligatoria', invalid_type_error: 'La descripción corta es obligatoria' })
    .min(1, 'La descripción corta es obligatoria')
    .max(500, 'Máximo 500 caracteres'),
  full_description: z.string({ required_error: 'La descripción completa es obligatoria', invalid_type_error: 'La descripción completa es obligatoria' })
    .min(1, 'La descripción completa es obligatoria'),
  target_audience: z.string().max(300, 'Máximo 300 caracteres').nullable().optional(),
  required_skills: z.string().nullable().optional(),
  participation_mode: z.enum(
    ['Presencial', 'Remoto', 'Híbrido'],
    { errorMap: () => ({ message: 'Modalidad inválida. Opciones permitidas: Presencial, Remoto, Híbrido' }) },
  ).optional().nullable(),
  header_image_media_asset_id: z.number({ invalid_type_error: 'Imagen de cabecera inválida' })
    .int('Imagen de cabecera inválida')
    .positive('Imagen de cabecera inválida')
    .optional()
    .nullable(),
  video_media_asset_id: z.number({ invalid_type_error: 'Video inválido' })
    .int('Video inválido')
    .positive('Video inválido')
    .optional()
    .nullable(),
  header_image_url: z.string().url('La URL de la imagen de cabecera es inválida').optional().nullable(),
  video_url: z.string().url('La URL del video es inválida').optional().nullable(),
  status: z.enum(
    ['Activo', 'En_Pausa', 'Completado', 'Archivado', 'Próximo'],
    { errorMap: () => ({ message: 'Estado inválido. Opciones permitidas: Activo, En_Pausa, Completado, Archivado, Próximo' }) },
  ).optional(),
  is_highlighted: z.boolean({ invalid_type_error: 'El indicador de destacado debe ser verdadero o falso' }).optional(),
  is_visible: z.boolean({ required_error: 'La visibilidad es obligatoria', invalid_type_error: 'La visibilidad debe ser verdadero o falso' }),
  max_collaborators: z.number({ invalid_type_error: 'El número máximo de colaboradores debe ser un número' })
    .int('El número máximo de colaboradores debe ser un número entero')
    .positive('El número máximo de colaboradores debe ser positivo')
    .nullable()
    .optional(),
  tags: z.array(
    z.number({ invalid_type_error: 'Etiqueta inválida' })
      .int('Etiqueta inválida')
      .positive('Etiqueta inválida'),
  ).optional(),
  new_tags: z.array(newTagSchema).optional(),
  required_skill_items: z.array(requiredSkillItemSchema).optional(),
  meetingDays: z.array(meetingDaySchema).optional(),
  managers: z.array(managerSchema).optional(),
});

export const updateProjectSchema = createProjectSchema;

export const updateProjectVisibilitySchema = z.object({
  is_visible: z.boolean({ required_error: 'La visibilidad es obligatoria', invalid_type_error: 'La visibilidad debe ser verdadero o falso' }),
});
