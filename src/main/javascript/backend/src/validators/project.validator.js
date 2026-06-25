import { z } from 'zod';

const meetingDaySchema = z.object({
  dayOfWeek: z.enum(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  notes: z.string().optional().nullable(),
});

const managerSchema = z.object({
  administratorId: z.number().int().positive(),
  role: z.string().min(1).optional(),
  isPrimary: z.boolean().optional(),
});

const newTagSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().optional(),
  category: z.string().min(1).optional(),
});

const requiredSkillItemSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().optional(),
});

export const createProjectSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().optional(),
  short_description: z.string().min(1).max(500),
  full_description: z.string().min(1),
  target_audience: z.string().nullable().optional(),
  required_skills: z.string().nullable().optional(),
  participation_mode: z.enum(['Presencial', 'Remoto', 'Híbrido']).optional().nullable(),
  header_image_media_asset_id: z.number().int().positive().optional().nullable(),
  video_media_asset_id: z.number().int().positive().optional().nullable(),
  header_image_url: z.string().url().optional().nullable(),
  video_url: z.string().url().optional().nullable(),
  status: z.enum(['Activo', 'En_Pausa', 'Completado', 'Archivado', 'Próximo']).optional(),
  is_highlighted: z.boolean().optional(),
  is_visible: z.boolean(),
  max_collaborators: z.number().int().positive().nullable().optional(),
  tags: z.array(z.number().int().positive()).optional(),
  new_tags: z.array(newTagSchema).optional(),
  required_skill_items: z.array(requiredSkillItemSchema).optional(),
  meetingDays: z.array(meetingDaySchema).optional(),
  managers: z.array(managerSchema).optional(),
});

export const updateProjectSchema = createProjectSchema;

export const updateProjectVisibilitySchema = z.object({
  is_visible: z.boolean(),
});
