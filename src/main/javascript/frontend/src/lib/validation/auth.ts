/**
 * auth.ts — validation for signup, login, activate, forgot/reset password.
 *
 * Authority:
 *   - DB: collaborators / administrators tables.
 *       first_name, last_name              VARCHAR(100)
 *       middle_name, second_last_name      VARCHAR(100) NULL
 *       personal_email, usfq_email         VARCHAR(255)
 *       phone_number                       VARCHAR(20)
 *       major                              VARCHAR(150)
 *   - Backend Zod: `backend/src/validators/auth.validator.js`
 *       motivation_description min 50
 *       tag_names[] min 2 max 50
 *       availability_slots min 1
 *       current_university_year 1..12
 *   - Password policy: `backend/src/validators/password.policy.js`
 *       12+ chars, 1 uppercase, 2+ digits
 *       (mirrored in `frontend/src/lib/utils/password.ts`)
 */

import {
  arrayOf,
  arrayOfSchema,
  composeValidators,
  enumOf,
  intRange,
  isoDate,
  maxLength,
  minLength,
  optional,
  phone,
  required,
  timeHHMM,
  usfqEmail,
  email as emailValidator,
  validateForm,
  type FormErrors,
  type FormSchema,
  type Validator,
} from './core.js';

import {
  PASSWORD_POLICY_ERROR,
  validatePasswordPolicy as runPasswordPolicy,
} from '$lib/utils/password.js';

export const AUTH_LIMITS = Object.freeze({
  first_name: { min: 1, max: 100 },
  middle_name: { max: 100 },
  last_name: { min: 1, max: 100 },
  second_last_name: { max: 100 },
  personal_email: { max: 255 },
  usfq_email: { max: 255 },
  phone_number: { min: 7, max: 20 },
  major: { min: 1, max: 150 },
  current_university_year: { min: 1, max: 12 },
  motivation_description: { min: 50 },
  tag_name: { min: 2, max: 50 },
});

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
// Field-level validators
// ---------------------------------------------------------------------------

export const validateFirstName: Validator<unknown> = composeValidators(
  required('El nombre es obligatorio'),
  maxLength(AUTH_LIMITS.first_name.max)
);
export const validateLastName: Validator<unknown> = composeValidators(
  required('El apellido es obligatorio'),
  maxLength(AUTH_LIMITS.last_name.max)
);
export const validateMiddleName: Validator<unknown> = optional(
  maxLength(AUTH_LIMITS.middle_name.max)
);
export const validateSecondLastName: Validator<unknown> = optional(
  maxLength(AUTH_LIMITS.second_last_name.max)
);

export const validatePersonalEmail: Validator<unknown> = composeValidators(
  required('El correo personal es obligatorio'),
  emailValidator(),
  maxLength(AUTH_LIMITS.personal_email.max)
);

export const validateUsfqEmail: Validator<unknown> = composeValidators(
  required('El correo institucional es obligatorio'),
  usfqEmail(),
  maxLength(AUTH_LIMITS.usfq_email.max)
);

export const validatePhoneNumber: Validator<unknown> = composeValidators(
  required('El teléfono es obligatorio'),
  phone(`El teléfono debe tener entre ${AUTH_LIMITS.phone_number.min} y ${AUTH_LIMITS.phone_number.max} caracteres`)
);

export const validateDateOfBirth: Validator<unknown> = composeValidators(
  required('La fecha de nacimiento es obligatoria'),
  isoDate()
);

export const validateMajor: Validator<unknown> = composeValidators(
  required('La carrera es obligatoria'),
  maxLength(AUTH_LIMITS.major.max)
);

export const validateUniversityYear: Validator<unknown> = composeValidators(
  required('El semestre es obligatorio'),
  intRange(AUTH_LIMITS.current_university_year.min, AUTH_LIMITS.current_university_year.max)
);

export const validateGraduationYear: Validator<unknown> = composeValidators(
  required('El año de graduación es obligatorio'),
  intRange(2000, 2100, 'Año de graduación inválido')
);

export const validateMotivation: Validator<unknown> = composeValidators(
  required('La motivación es obligatoria'),
  minLength(
    AUTH_LIMITS.motivation_description.min,
    `Mínimo ${AUTH_LIMITS.motivation_description.min} caracteres`
  )
);

export const validateTagName: Validator<unknown> = composeValidators(
  required('El nombre de la habilidad es obligatorio'),
  minLength(AUTH_LIMITS.tag_name.min),
  maxLength(AUTH_LIMITS.tag_name.max)
);

export const validateTagNames: Validator<unknown> = composeValidators(
  required('Selecciona al menos una habilidad'),
  arrayOf(validateTagName)
) as Validator<unknown>;

const availabilitySlotSchema: FormSchema<{
  day_of_week: string;
  time_from: string;
  time_to: string;
  notes?: string;
}> = {
  day_of_week: composeValidators(required('Día requerido'), enumOf(WEEKDAYS)),
  time_from: composeValidators(required('Hora de inicio requerida'), timeHHMM()),
  time_to: composeValidators(required('Hora de fin requerida'), timeHHMM()),
  notes: optional(maxLength(200)),
};

export const validateAvailabilitySlots: Validator<unknown> = composeValidators(
  required('Indica al menos un horario de disponibilidad'),
  arrayOfSchema(availabilitySlotSchema)
) as Validator<unknown>;

/**
 * Password — runs the shared policy. Returns Spanish error or `null`.
 */
export const validatePassword: Validator<unknown> = (value) => {
  if (typeof value !== 'string' || value === '') return 'La contraseña es obligatoria';
  return runPasswordPolicy(value) ?? null;
};

export const validatePasswordSilent: Validator<unknown> = (value) => {
  if (typeof value !== 'string' || value.length === 0) return null;
  return runPasswordPolicy(value) ?? null;
};

export { PASSWORD_POLICY_ERROR };

// ---------------------------------------------------------------------------
// Form-level validators
// ---------------------------------------------------------------------------

export interface SignupFormValues {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  second_last_name?: string | null;
  personal_email: string;
  usfq_email: string;
  phone_number: string;
  date_of_birth: string;
  major: string;
  current_university_year: number;
  expected_graduation_year: number;
  motivation_description: string;
  experience_description?: string | null;
  interest_in_machinery: boolean;
  interest_in_design: boolean;
  interest_in_materials: boolean;
  tag_names: string[];
  availability_slots: Array<{
    day_of_week: string;
    time_from: string;
    time_to: string;
    notes?: string;
  }>;
}

export const signupSchema: FormSchema<SignupFormValues> = {
  first_name: validateFirstName,
  middle_name: validateMiddleName,
  last_name: validateLastName,
  second_last_name: validateSecondLastName,
  personal_email: validatePersonalEmail,
  usfq_email: validateUsfqEmail,
  phone_number: validatePhoneNumber,
  date_of_birth: validateDateOfBirth,
  major: validateMajor,
  current_university_year: validateUniversityYear,
  expected_graduation_year: validateGraduationYear,
  motivation_description: validateMotivation,
  tag_names: validateTagNames,
  availability_slots: validateAvailabilitySlots,
};

export function validateSignupForm(values: SignupFormValues): FormErrors<SignupFormValues> {
  return validateForm(values, signupSchema);
}

export interface LoginFormValues {
  email: string;
  password: string;
}

export const loginSchema: FormSchema<LoginFormValues> = {
  email: validateUsfqEmail,
  password: required('La contraseña es obligatoria'),
};

export function validateLoginForm(values: LoginFormValues): FormErrors<LoginFormValues> {
  return validateForm(values, loginSchema);
}

export interface ActivateFormValues {
  token: string;
  password: string;
}

export const activateSchema: FormSchema<ActivateFormValues> = {
  token: required('Token requerido'),
  password: validatePassword,
};

export function validateActivateForm(values: ActivateFormValues): FormErrors<ActivateFormValues> {
  return validateForm(values, activateSchema);
}

export interface ForgotPasswordFormValues {
  email: string;
}

export const forgotPasswordSchema: FormSchema<ForgotPasswordFormValues> = {
  email: validateUsfqEmail,
};

export function validateForgotPasswordForm(
  values: ForgotPasswordFormValues
): FormErrors<ForgotPasswordFormValues> {
  return validateForm(values, forgotPasswordSchema);
}

export interface ResetPasswordFormValues {
  token: string;
  new_password: string;
  confirm: string;
}

export const resetPasswordSchema: FormSchema<ResetPasswordFormValues> = {
  token: required('Token requerido'),
  new_password: validatePassword,
  confirm: required('Confirma la contraseña'),
};

export function validateResetPasswordForm(
  values: ResetPasswordFormValues
): FormErrors<ResetPasswordFormValues> {
  const errors = validateForm(values, resetPasswordSchema);
  if (!errors.confirm && values.new_password !== values.confirm) {
    errors.confirm = 'Las contraseñas no coinciden';
  }
  return errors;
}
