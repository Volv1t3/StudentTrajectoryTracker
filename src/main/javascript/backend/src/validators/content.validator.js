import { z } from 'zod';

// DB limit references (db_init_ordered.sql):
//   home_hero.headline                 VARCHAR(255)
//   home_hero.subheadline              VARCHAR(500)
//   home_hero.primary_cta_label        VARCHAR(100)
//   home_hero.secondary_cta_label      VARCHAR(100)
//   dlab_identity.title                VARCHAR(255)
//   dlab_identity.mission_title        VARCHAR(255)
//   dlab_identity.vision_title         VARCHAR(255)
//   value_propositions.title           VARCHAR(200)
//   value_propositions.target_audience VARCHAR(200)
//   participation_steps.title          VARCHAR(200)
//   social_links.platform              VARCHAR(100)
//   social_links.url                   VARCHAR(1000)
//   contact_info.first_name            VARCHAR(100)
//   contact_info.middle_name           VARCHAR(100)
//   contact_info.last_name             VARCHAR(100)
//   contact_info.title_description     VARCHAR(255)
//   contact_info.contact_email         VARCHAR(255)
//   contact_info.contact_phone         VARCHAR(30)
//   contact_info.physical_location     VARCHAR(300)
//   contact_info.cta_headline          VARCHAR(255)

// Helpers — accept "" alongside null/undefined for optional textual fields.
const optionalString = z.string().optional().nullable().transform((v) => (v == null || v === '' ? null : v));

// =============================================================================
// SINGLETON SECTIONS
// =============================================================================

// home_hero — Admin CMS only edits the textual fields; URLs/background are
// preserved server-side from the currently active row.
export const homeHeroSchema = z.object({
  headline: z.string({ required_error: 'El titular es obligatorio', invalid_type_error: 'El titular es obligatorio' })
    .min(1, 'El titular es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  subheadline: z.string().max(500, 'Máximo 500 caracteres').optional().nullable().transform((v) => (v == null || v === '' ? null : v)),
  primary_cta_label: z.string({ required_error: 'La etiqueta del botón principal es obligatoria', invalid_type_error: 'La etiqueta del botón principal es obligatoria' })
    .min(1, 'La etiqueta del botón principal es obligatoria')
    .max(100, 'Máximo 100 caracteres'),
  secondary_cta_label: z.string().max(100, 'Máximo 100 caracteres').optional().nullable().transform((v) => (v == null || v === '' ? null : v)),
});

// dlab_identity — admin CMS edits only the textual identity/mission/vision fields.
export const dlabIdentitySchema = z.object({
  title: z.string({ required_error: 'El título es obligatorio', invalid_type_error: 'El título es obligatorio' })
    .min(1, 'El título es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  body: z.string({ required_error: 'El contenido es obligatorio', invalid_type_error: 'El contenido es obligatorio' })
    .min(1, 'El contenido es obligatorio'),
  mission_title: z.string().max(255, 'Máximo 255 caracteres').optional().nullable().transform((v) => (v == null || v === '' ? null : v)),
  mission_body: optionalString,
  vision_title: z.string().max(255, 'Máximo 255 caracteres').optional().nullable().transform((v) => (v == null || v === '' ? null : v)),
  vision_body: optionalString,
});

// =============================================================================
// REPEATABLE SECTIONS
// =============================================================================

// value_propositions — admin CMS edits only textual + ordering/visibility fields.
export const valuePropositionSchema = z.object({
  title: z.string({ required_error: 'El título es obligatorio', invalid_type_error: 'El título es obligatorio' })
    .min(1, 'El título es obligatorio')
    .max(200, 'Máximo 200 caracteres'),
  description: z.string({ required_error: 'La descripción es obligatoria', invalid_type_error: 'La descripción es obligatoria' })
    .min(1, 'La descripción es obligatoria'),
  icon_identifier: z.string().max(100, 'Máximo 100 caracteres').optional().nullable().transform((v) => (v == null || v === '' ? null : v)),
  target_audience: z.string().max(200, 'Máximo 200 caracteres').optional().nullable().transform((v) => (v == null || v === '' ? null : v)),
  sort_order: z.number({ invalid_type_error: 'El orden debe ser un número' })
    .int('El orden debe ser un número entero')
    .min(0, 'El orden debe ser mayor o igual a 0')
    .max(255, 'El orden debe ser menor o igual a 255')
    .optional(),
  is_visible: z.boolean({ invalid_type_error: 'La visibilidad debe ser verdadero o falso' }).optional(),
});

// participation_steps — DB columns:
//   step_number, title, description, icon_identifier, is_visible
export const participationStepSchema = z.object({
  step_number: z.number({ invalid_type_error: 'El número de paso debe ser un número' })
    .int('El número de paso debe ser un número entero')
    .min(0, 'El número de paso debe ser mayor o igual a 0')
    .max(255, 'El número de paso debe ser menor o igual a 255')
    .optional(),
  title: z.string({ required_error: 'El título es obligatorio', invalid_type_error: 'El título es obligatorio' })
    .min(1, 'El título es obligatorio')
    .max(200, 'Máximo 200 caracteres'),
  description: z.string({ required_error: 'La descripción es obligatoria', invalid_type_error: 'La descripción es obligatoria' })
    .min(1, 'La descripción es obligatoria'),
  icon_identifier: z.string().max(100, 'Máximo 100 caracteres').optional().nullable().transform((v) => (v == null || v === '' ? null : v)),
  is_visible: z.boolean({ invalid_type_error: 'La visibilidad debe ser verdadero o falso' }).optional(),
});

// social_links — DB columns:
//   platform, url, icon_identifier, sort_order, is_visible
export const socialLinkSchema = z.object({
  platform: z.string({ required_error: 'La plataforma es obligatoria', invalid_type_error: 'La plataforma es obligatoria' })
    .min(1, 'La plataforma es obligatoria')
    .max(100, 'Máximo 100 caracteres'),
  url: z.string({ required_error: 'La URL es obligatoria', invalid_type_error: 'La URL es obligatoria' })
    .url('URL inválida')
    .max(1000, 'Máximo 1000 caracteres'),
  icon_identifier: z.string().max(100, 'Máximo 100 caracteres').optional().nullable().transform((v) => (v == null || v === '' ? null : v)),
  sort_order: z.number({ invalid_type_error: 'El orden debe ser un número' })
    .int('El orden debe ser un número entero')
    .min(0, 'El orden debe ser mayor o igual a 0')
    .max(255, 'El orden debe ser menor o igual a 255')
    .optional(),
  is_visible: z.boolean({ invalid_type_error: 'La visibilidad debe ser verdadero o falso' }).optional(),
});

// contact_info — admin CMS edits textual/contact fields only; maps_url remains
// non-editable in this UI.
export const contactInfoSchema = z.object({
  first_name: z.string({ required_error: 'El nombre es obligatorio', invalid_type_error: 'El nombre es obligatorio' })
    .min(1, 'El nombre es obligatorio')
    .max(100, 'Máximo 100 caracteres'),
  middle_name: z.string().max(100, 'Máximo 100 caracteres').optional().nullable(),
  last_name: z.string({ required_error: 'El apellido es obligatorio', invalid_type_error: 'El apellido es obligatorio' })
    .min(1, 'El apellido es obligatorio')
    .max(100, 'Máximo 100 caracteres'),
  title_description: z.string().max(255, 'Máximo 255 caracteres').optional().nullable(),
  contact_email: z.string()
    .max(255, 'Máximo 255 caracteres')
    .email('Correo electrónico inválido')
    .optional()
    .nullable()
    .or(z.literal('')),
  contact_phone: z.string().max(30, 'Máximo 30 caracteres').optional().nullable(),
  physical_location: z.string().max(300, 'Máximo 300 caracteres').optional().nullable(),
  cta_headline: z.string().max(255, 'Máximo 255 caracteres').optional().nullable(),
  cta_description: z.string().optional().nullable(),
  is_active: z.boolean({ invalid_type_error: 'El estado activo debe ser verdadero o falso' }).optional(),
});

// =============================================================================
// REORDER / TOGGLE SCHEMAS
// =============================================================================

// Reorder payload: { ordered_ids: [int, int, int, ...] }
// The position of each id in the array is its new sort/step ordinal.
export const reorderSchema = z.object({
  ordered_ids: z.array(
    z.number({ invalid_type_error: 'El identificador debe ser un número' })
      .int('El identificador debe ser un número entero')
      .positive('El identificador debe ser un número positivo'),
  ).min(1, 'Debes proporcionar al menos un identificador'),
});

// Visibility toggle payload: { is_visible: boolean }
export const visibilityToggleSchema = z.object({
  is_visible: z.boolean({ required_error: 'La visibilidad es obligatoria', invalid_type_error: 'La visibilidad debe ser verdadero o falso' }),
});

// Active toggle payload: { is_active: boolean }
export const activeToggleSchema = z.object({
  is_active: z.boolean({ required_error: 'El estado activo es obligatorio', invalid_type_error: 'El estado activo debe ser verdadero o falso' }),
});
