/**
 * event.ts — validation for the admin event create/edit forms.
 *
 * Authority:
 *   - DB: `src/main/sql/db/db_init_ordered.sql` → events table
 *       title              VARCHAR(255)   NOT NULL
 *       slug               VARCHAR(255)   NOT NULL
 *       short_description  VARCHAR(500)   NOT NULL
 *       full_description   TEXT           NOT NULL
 *       target_audience    VARCHAR(300)   NULL
 *       location           VARCHAR(300)   NULL
 *       registration_url   VARCHAR(1000)  NULL
 *       capacity           SMALLINT UNSIGNED NULL
 *       type               ENUM('Taller','Charla','Convocatoria','Hackatón','Día_De_Demostración','Visita','Otro') NOT NULL
 *       status             ENUM('Próximo','Abierto','En_Curso','Finalizado','Cancelado') NOT NULL
 *
 *   - Backend Zod: `backend/src/validators/event.validator.js`
 */

import {
  composeValidators,
  enumOf,
  intRange,
  maxLength,
  optional,
  positiveInt,
  required,
  url,
  validateForm,
  type FormErrors,
  type FormSchema,
  type Validator,
} from './core.js';

export const EVENT_LIMITS = Object.freeze({
  title: { min: 1, max: 255 },
  slug: { min: 1, max: 255 },
  short_description: { min: 1, max: 500 },
  full_description: { min: 1 },
  target_audience: { max: 300 },
  location: { max: 300 },
  registration_url: { max: 1000 },
  capacity: { min: 1, max: 65535 },
});

export const EVENT_TYPES = [
  'Taller',
  'Charla',
  'Convocatoria',
  'Hackatón',
  'Día_De_Demostración',
  'Visita',
  'Otro',
] as const;

export const EVENT_STATUSES = [
  'Próximo',
  'Abierto',
  'En_Curso',
  'Finalizado',
  'Cancelado',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];
export type EventStatus = (typeof EVENT_STATUSES)[number];

// ---------------------------------------------------------------------------
// Field-level validators
// ---------------------------------------------------------------------------

export const validateEventTitle: Validator<unknown> = composeValidators(
  required('El título es obligatorio'),
  maxLength(EVENT_LIMITS.title.max)
);

export const validateEventSlug: Validator<unknown> = optional(maxLength(EVENT_LIMITS.slug.max));

export const validateEventShortDescription: Validator<unknown> = composeValidators(
  required('La descripción corta es obligatoria'),
  maxLength(EVENT_LIMITS.short_description.max)
);

export const validateEventFullDescription: Validator<unknown> = required(
  'La descripción completa es obligatoria'
);

export const validateEventTargetAudience: Validator<unknown> = optional(
  maxLength(EVENT_LIMITS.target_audience.max)
);

export const validateEventLocation: Validator<unknown> = composeValidators(
    required('El lugar del evento es obligatorio'),
    maxLength(EVENT_LIMITS.location.max)
);

export const validateEventType: Validator<unknown> = composeValidators(
  required('El tipo de evento es obligatorio'),
  enumOf(EVENT_TYPES)
);


export const validateEventStatus: Validator<unknown> = optional(enumOf(EVENT_STATUSES));

export const validateEventDate: Validator<unknown> = composeValidators(
    required('La fecha de inicio del evento es obligatoria')
);


export const validateEventEndDate: Validator<unknown> = composeValidators(
    required('La fecha de finalización del evento es obligatoria'),
);
export const validateRegistrationDeadline: Validator<unknown> = composeValidators(
    required('La fecha de cierre de registro es obligatoria'),
)

export const validateRegistrationUrl: Validator<unknown> = optional(
  composeValidators(url('URL de registro inválida'), maxLength(EVENT_LIMITS.registration_url.max))
);

export const validateBannerImageUrl: Validator<unknown> = optional(url('URL de imagen inválida'));
export const validatePosterImageUrl: Validator<unknown> = optional(url('URL de poster inválida'));
export const validateEventVideoUrl: Validator<unknown> = optional(url('URL de video inválida'));

export const validateEventCapacity: Validator<unknown> = optional(
  composeValidators(
    positiveInt('El cupo debe ser un número entero positivo'),
    intRange(EVENT_LIMITS.capacity.min, EVENT_LIMITS.capacity.max)
  )
);

// ---------------------------------------------------------------------------
// Form-level validator
// ---------------------------------------------------------------------------

export interface EventFormValues {
  title: string;
  slug?: string | null;
  type: EventType;
  short_description?: string | null;
  full_description?: string | null;
  target_audience?: string | null;
  location?: string | null;
  event_date: string;
  event_end_date?: string | null;
  registration_deadline?: string | null;
  capacity?: number | null;
  banner_image_url?: string | null;
  poster_image_url?: string | null;
  video_url?: string | null;
  registration_url?: string | null;
  status?: EventStatus | null;
}

export const eventSchema: FormSchema<EventFormValues> = {
  title: validateEventTitle,
  slug: validateEventSlug,
  type: validateEventType,
  short_description: validateEventShortDescription,
  full_description: validateEventFullDescription,
  target_audience: validateEventTargetAudience,
  location: validateEventLocation,
  event_date: validateEventDate,
  event_end_date: validateEventEndDate,
  registration_deadline: validateRegistrationDeadline,
  capacity: validateEventCapacity,
  banner_image_url: validateBannerImageUrl,
  poster_image_url: validatePosterImageUrl,
  video_url: validateEventVideoUrl,
  registration_url: validateRegistrationUrl,
  status: validateEventStatus,
};

function parseDateTimeValue(value: string | null | undefined): number | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function validateEventForm(values: EventFormValues): FormErrors<EventFormValues> {
  const errors = validateForm(values, eventSchema);

  const startAt = parseDateTimeValue(values.event_date);
  const endAt = parseDateTimeValue(values.event_end_date);
  const registrationAt = parseDateTimeValue(values.registration_deadline);

  const hasStart = startAt !== null;
  const hasEnd = endAt !== null;
  const hasRegistration = registrationAt !== null;

  if (hasStart && hasEnd && hasRegistration && startAt === endAt && endAt === registrationAt) {
    errors.event_date = 'Inicio, finalización y cierre de registro no pueden coincidir exactamente al mismo tiempo';
    errors.event_end_date = 'Inicio, finalización y cierre de registro no pueden coincidir exactamente al mismo tiempo';
    errors.registration_deadline = 'Inicio, finalización y cierre de registro no pueden coincidir exactamente al mismo tiempo';
    return errors;
  }

  if (hasStart && hasEnd && startAt === endAt) {
    errors.event_date = 'La fecha de inicio y la fecha de finalización no pueden ser exactamente iguales';
    errors.event_end_date = 'La fecha de inicio y la fecha de finalización no pueden ser exactamente iguales';
    return errors;
  }

  if (hasStart && hasEnd && startAt > endAt) {
    errors.event_date = 'La fecha de inicio debe ser anterior a la fecha de finalización';
    errors.event_end_date = 'La fecha de finalización debe ser posterior a la fecha de inicio';
  }

  if (hasRegistration && hasEnd && registrationAt > endAt) {
    if (!errors.event_end_date) {
      errors.event_end_date = 'La fecha de finalización debe ser igual o posterior al cierre de registro';
    }
    errors.registration_deadline = 'La fecha de cierre de registro no puede ser posterior a la finalización del evento';
  }

  return errors;
}
