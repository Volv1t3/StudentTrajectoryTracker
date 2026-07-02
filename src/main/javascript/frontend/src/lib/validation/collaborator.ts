/**
 * collaborator.ts — validation for profile updates, availability, admin
 * collaborator edit/note/reject/status flows.
 *
 * Authority:
 *   - DB: collaborators table
 *       first_name, last_name              VARCHAR(100) NOT NULL
 *       middle_name, second_last_name      VARCHAR(100) NULL
 *       personal_email, usfq_email         VARCHAR(255)
 *       phone_number                       VARCHAR(20)
 *       major                              VARCHAR(150)
 *     availability_slots.notes             VARCHAR(200)
 *   - Backend Zod: `backend/src/validators/collaborator.validator.js`
 *       collaboratorNoteSchema  note 1..2000
 *       rejectCollaboratorSchema reason ≤ 2000 nullable
 *       collaboratorStatusSchema enum
 *       updateAvailabilitySchema slots[].notes ≤ 200, time HH:MM
 */

import {
  arrayOfSchema,
  composeValidators,
  enumOf,
  intRange,
  maxLength,
  minLength,
  optional,
  phone,
  required,
  timeHHMM,
  usfqEmail as usfqEmailValidator,
  email as emailValidator,
  validateForm,
  type FormErrors,
  type FormSchema,
  type Validator,
} from './core.js';

export const COLLAB_LIMITS = Object.freeze({
  firstName: { min: 1, max: 100 },
  middleName: { max: 100 },
  lastName: { min: 1, max: 100 },
  secondLastName: { max: 100 },
  personalEmail: { max: 255 },
  usfqEmail: { max: 255 },
  phoneNumber: { min: 7, max: 20 },
  major: { min: 1, max: 150 },
  currentUniversityYear: { min: 1, max: 12 },
  experienceDescription: {},
  motivationDescription: { min: 50 },
  availabilityNotes: { max: 200 },
  adminNote: { min: 1, max: 2000 },
  rejectReason: { max: 2000 },
});

export const TRAJECTORY_STATUSES = [
  'Nuevo',
  'En_Revisión',
  'Contactado',
  'Vinculado',
  'Inactivo',
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

// ---------------------------------------------------------------------------
// Profile field validators (backend uses camelCase for profile updates)
// ---------------------------------------------------------------------------

export const validateProfileFirstName: Validator<unknown> = optional(
  composeValidators(minLength(1), maxLength(COLLAB_LIMITS.firstName.max))
);
export const validateProfileLastName: Validator<unknown> = optional(
  composeValidators(minLength(1), maxLength(COLLAB_LIMITS.lastName.max))
);
export const validateProfileMiddleName: Validator<unknown> = optional(
  maxLength(COLLAB_LIMITS.middleName.max)
);
export const validateProfileSecondLastName: Validator<unknown> = optional(
  maxLength(COLLAB_LIMITS.secondLastName.max)
);
export const validateProfilePersonalEmail: Validator<unknown> = optional(
  composeValidators(emailValidator(), maxLength(COLLAB_LIMITS.personalEmail.max))
);
export const validateProfileUsfqEmail: Validator<unknown> = optional(
  composeValidators(usfqEmailValidator(), maxLength(COLLAB_LIMITS.usfqEmail.max))
);
export const validateProfilePhone: Validator<unknown> = optional(phone());
export const validateProfileMajor: Validator<unknown> = optional(
  composeValidators(minLength(1), maxLength(COLLAB_LIMITS.major.max))
);
export const validateProfileUniversityYear: Validator<unknown> = optional(
  intRange(COLLAB_LIMITS.currentUniversityYear.min, COLLAB_LIMITS.currentUniversityYear.max)
);
export const validateProfileGraduationYear: Validator<unknown> = optional(
  intRange(2000, 2100, 'Año de graduación inválido')
);
export const validateProfileMotivation: Validator<unknown> = optional(
  minLength(
    COLLAB_LIMITS.motivationDescription.min,
    `Mínimo ${COLLAB_LIMITS.motivationDescription.min} caracteres`
  )
);
export const validateProfileExperience: Validator<unknown> = optional();

// ---------------------------------------------------------------------------
// Profile form
// ---------------------------------------------------------------------------

export interface ProfileFormValues {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  secondLastName?: string | null;
  personalEmail?: string | null;
  usfqEmail?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  major?: string | null;
  currentUniversityYear?: number | null;
  expectedGraduationYear?: number | null;
  experienceDescription?: string | null;
  motivationDescription?: string | null;
  interestInMachinery?: boolean | null;
  interestInDesign?: boolean | null;
  interestInMaterials?: boolean | null;
  tag_ids?: number[];
}

export const profileSchema: FormSchema<ProfileFormValues> = {
  firstName: validateProfileFirstName,
  middleName: validateProfileMiddleName,
  lastName: validateProfileLastName,
  secondLastName: validateProfileSecondLastName,
  personalEmail: validateProfilePersonalEmail,
  usfqEmail: validateProfileUsfqEmail,
  phoneNumber: validateProfilePhone,
  major: validateProfileMajor,
  currentUniversityYear: validateProfileUniversityYear,
  expectedGraduationYear: validateProfileGraduationYear,
  motivationDescription: validateProfileMotivation,
};

export function validateProfileForm(values: ProfileFormValues): FormErrors<ProfileFormValues> {
  return validateForm(values, profileSchema);
}

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

const availabilitySlotSchema: FormSchema<{
  day_of_week: string;
  time_from: string;
  time_to: string;
  notes?: string;
}> = {
  day_of_week: composeValidators(required('Día requerido'), enumOf(WEEKDAYS)),
  time_from: composeValidators(required('Hora de inicio requerida'), timeHHMM()),
  time_to: composeValidators(required('Hora de fin requerida'), timeHHMM()),
  notes: optional(maxLength(COLLAB_LIMITS.availabilityNotes.max)),
};

export const validateAvailabilitySlots: Validator<unknown> = optional(
  arrayOfSchema(availabilitySlotSchema)
);

export interface AvailabilityFormValues {
  slots: Array<{ day_of_week: string; time_from: string; time_to: string; notes?: string }>;
}

export const availabilitySchema: FormSchema<AvailabilityFormValues> = {
  slots: validateAvailabilitySlots,
};

export function validateAvailabilityForm(
  values: AvailabilityFormValues
): FormErrors<AvailabilityFormValues> {
  return validateForm(values, availabilitySchema);
}

// ---------------------------------------------------------------------------
// Status / note / reject flows
// ---------------------------------------------------------------------------

export const validateTrajectoryStatus: Validator<unknown> = composeValidators(
  required('Estado requerido'),
  enumOf(TRAJECTORY_STATUSES)
);

export const validateAdminNote: Validator<unknown> = composeValidators(
  required('La nota es obligatoria'),
  minLength(COLLAB_LIMITS.adminNote.min),
  maxLength(COLLAB_LIMITS.adminNote.max)
);

export const validateRejectReason: Validator<unknown> = optional(
  maxLength(COLLAB_LIMITS.rejectReason.max)
);

export interface CollaboratorStatusFormValues {
  status: string;
}
export const collaboratorStatusSchema: FormSchema<CollaboratorStatusFormValues> = {
  status: validateTrajectoryStatus,
};
export function validateCollaboratorStatusForm(
  values: CollaboratorStatusFormValues
): FormErrors<CollaboratorStatusFormValues> {
  return validateForm(values, collaboratorStatusSchema);
}

export interface CollaboratorNoteFormValues {
  note: string;
}
export const collaboratorNoteSchema: FormSchema<CollaboratorNoteFormValues> = {
  note: validateAdminNote,
};
export function validateCollaboratorNoteForm(
  values: CollaboratorNoteFormValues
): FormErrors<CollaboratorNoteFormValues> {
  return validateForm(values, collaboratorNoteSchema);
}

export interface RejectCollaboratorFormValues {
  reason?: string | null;
}
export const rejectCollaboratorSchema: FormSchema<RejectCollaboratorFormValues> = {
  reason: validateRejectReason,
};
export function validateRejectCollaboratorForm(
  values: RejectCollaboratorFormValues
): FormErrors<RejectCollaboratorFormValues> {
  return validateForm(values, rejectCollaboratorSchema);
}
