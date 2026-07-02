/**
 * project.ts — validation for the admin project create/edit forms.
 *
 * Authority:
 *   - DB: `src/main/sql/db/db_init_ordered.sql` → projects table
 *       title              VARCHAR(255)  NOT NULL
 *       slug               VARCHAR(255)  NOT NULL
 *       short_description  VARCHAR(500)  NOT NULL
 *       full_description   TEXT          NOT NULL
 *       target_audience    VARCHAR(300)  NULL
 *       required_skills    TEXT          NULL
 *       participation_mode ENUM('Presencial','Remoto','Híbrido') NULL
 *       status             ENUM('Activo','En_Pausa','Completado','Archivado','Próximo') NOT NULL
 *       max_collaborators  SMALLINT UNSIGNED NULL  -- max 65535
 *     tags.name             VARCHAR(100) NOT NULL
 *     project_required_skills.name  VARCHAR(100) NOT NULL
 *     project_meeting_days.notes    VARCHAR(300) NULL
 *
 *   - Backend Zod: `backend/src/validators/project.validator.js`
 *       Mirrors the same limits and enums.
 */

import {
  arrayOfSchema,
  composeValidators,
  enumOf,
  intRange,
  maxLength,
  minLength,
  optional,
  positiveInt,
  required,
  timeHHMM,
  url,
  validateForm,
  type FormErrors,
  type FormSchema,
  type Validator,
} from './core.js';

// ---------------------------------------------------------------------------
// Constants (DB- and backend-authoritative)
// ---------------------------------------------------------------------------
export const PROJECT_LIMITS = Object.freeze({
  title: { max: 255, min: 1 },
  slug: { max: 255 },
  short_description: { max: 500, min: 1 },
  full_description: { min: 1 },
  target_audience: { max: 300 },
  required_skills: {},
  max_collaborators: { min: 1, max: 65535 },
  tag_name: { max: 100, min: 1 },
  required_skill_name: { max: 100, min: 1 },
  meeting_notes: { max: 300 },
});

export const PARTICIPATION_MODES = ['Presencial', 'Remoto', 'Híbrido'] as const;
export const PROJECT_STATUSES = [
  'Activo',
  'En_Pausa',
  'Completado',
  'Archivado',
  'Próximo',
] as const;
export const WEEKDAYS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
] as const;

export type ParticipationMode = (typeof PARTICIPATION_MODES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

// ---------------------------------------------------------------------------
// Field-level validators
// ---------------------------------------------------------------------------

export const validateTitle: Validator<unknown> = composeValidators(
  required('El título es obligatorio'),
  maxLength(PROJECT_LIMITS.title.max)
);

export const validateSlug: Validator<unknown> = optional(maxLength(PROJECT_LIMITS.slug.max));

export const validateShortDescription: Validator<unknown> = composeValidators(
  required('La descripción corta es obligatoria'),
  maxLength(PROJECT_LIMITS.short_description.max)
);

export const validateFullDescription: Validator<unknown> = required(
  'La descripción completa es obligatoria'
);

export const validateTargetAudience: Validator<unknown> = optional(
  maxLength(PROJECT_LIMITS.target_audience.max)
);

export const validateRequiredSkills: Validator<unknown> = optional();

export const validateParticipationMode: Validator<unknown> = optional(
  enumOf(PARTICIPATION_MODES)
);

export const validateProjectStatus: Validator<unknown> = optional(enumOf(PROJECT_STATUSES));

export const validateHeaderImageUrl: Validator<unknown> = optional(url('URL de imagen inválida'));
export const validateVideoUrl: Validator<unknown> = optional(url('URL de video inválida'));

export const validateMaxCollaborators: Validator<unknown> = optional(
  composeValidators(
    positiveInt('El cupo máximo debe ser un número entero positivo'),
    intRange(
      PROJECT_LIMITS.max_collaborators.min,
      PROJECT_LIMITS.max_collaborators.max,
      `El cupo máximo debe estar entre ${PROJECT_LIMITS.max_collaborators.min} y ${PROJECT_LIMITS.max_collaborators.max}`
    )
  )
);

// Nested schemas

const newTagSchema: FormSchema<{ name: string }> = {
  name: composeValidators(
    required('El nombre de la etiqueta es obligatorio'),
    minLength(PROJECT_LIMITS.tag_name.min),
    maxLength(PROJECT_LIMITS.tag_name.max)
  ),
};

const requiredSkillItemSchema: FormSchema<{ name: string }> = {
  name: composeValidators(
    required('El nombre de la habilidad es obligatorio'),
    minLength(PROJECT_LIMITS.required_skill_name.min),
    maxLength(PROJECT_LIMITS.required_skill_name.max)
  ),
};

const meetingDaySchema: FormSchema<{
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  notes?: string;
}> = {
  dayOfWeek: composeValidators(required('Día requerido'), enumOf(WEEKDAYS)),
  startTime: composeValidators(required('Hora de inicio requerida'), timeHHMM()),
  endTime: composeValidators(required('Hora de fin requerida'), timeHHMM()),
  notes: optional(maxLength(PROJECT_LIMITS.meeting_notes.max)),
};

const managerSchema: FormSchema<{ administratorId: number }> = {
  administratorId: composeValidators(
    required('Administrador requerido'),
    positiveInt('Administrador inválido')
  ),
};

export const validateNewTags: Validator<unknown> = optional(arrayOfSchema(newTagSchema));
export const validateRequiredSkillItems: Validator<unknown> = optional(
  arrayOfSchema(requiredSkillItemSchema)
);
export const validateMeetingDays: Validator<unknown> = optional(arrayOfSchema(meetingDaySchema));
export const validateManagers: Validator<unknown> = optional(arrayOfSchema(managerSchema));

// ---------------------------------------------------------------------------
// Form-level validator
// ---------------------------------------------------------------------------

export interface ProjectFormValues {
  title: string;
  slug?: string | null;
  short_description: string;
  full_description: string;
  target_audience?: string | null;
  required_skills?: string | null;
  participation_mode?: ParticipationMode | null;
  status?: ProjectStatus | null;
  header_image_url?: string | null;
  video_url?: string | null;
  max_collaborators?: number | null;
  new_tags?: Array<{ name: string }>;
  required_skill_items?: Array<{ name: string }>;
  meetingDays?: Array<{ dayOfWeek: string; startTime: string; endTime: string; notes?: string }>;
  managers?: Array<{ administratorId: number }>;
}

export const projectSchema: FormSchema<ProjectFormValues> = {
  title: validateTitle,
  slug: validateSlug,
  short_description: validateShortDescription,
  full_description: validateFullDescription,
  target_audience: validateTargetAudience,
  required_skills: validateRequiredSkills,
  participation_mode: validateParticipationMode,
  status: validateProjectStatus,
  header_image_url: validateHeaderImageUrl,
  video_url: validateVideoUrl,
  max_collaborators: validateMaxCollaborators,
  new_tags: validateNewTags,
  required_skill_items: validateRequiredSkillItems,
  meetingDays: validateMeetingDays,
  managers: validateManagers,
};

export function validateProjectForm(values: ProjectFormValues): FormErrors<ProjectFormValues> {
  return validateForm(values, projectSchema);
}
