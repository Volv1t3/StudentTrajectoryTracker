/**
 * administrator.ts — validation for admin create/edit of administrators.
 *
 * Authority:
 *   - DB: administrators table
 *       first_name, middle_name, last_name, second_last_name VARCHAR(100)
 *       personal_email, usfq_email                           VARCHAR(255)
 *       phone_number                                         VARCHAR(20) NULL
 *   - Backend Zod: `backend/src/validators/administrator.validator.js`
 *   - Password policy: `backend/src/validators/password.policy.js`
 */

import {
  composeValidators,
  email,
  isoDate,
  maxLength,
  optional,
  phone,
  required,
  usfqEmail,
  validateForm,
  type FormErrors,
  type FormSchema,
  type Validator,
} from './core.js';

import { validatePasswordPolicy as runPasswordPolicy } from '$lib/utils/password.js';

export const ADMIN_LIMITS = Object.freeze({
  firstName: { min: 1, max: 100 },
  middleName: { max: 100 },
  lastName: { min: 1, max: 100 },
  secondLastName: { max: 100 },
  personalEmail: { max: 255 },
  usfqEmail: { max: 255 },
  phoneNumber: { min: 7, max: 20 },
});

// ---------------------------------------------------------------------------
// Field-level validators (backend uses camelCase keys for this domain)
// ---------------------------------------------------------------------------

export const validateAdminFirstName: Validator<unknown> = composeValidators(
  required('El nombre es obligatorio'),
  maxLength(ADMIN_LIMITS.firstName.max)
);

export const validateAdminMiddleName: Validator<unknown> = optional(
  maxLength(ADMIN_LIMITS.middleName.max)
);

export const validateAdminLastName: Validator<unknown> = composeValidators(
  required('El apellido es obligatorio'),
  maxLength(ADMIN_LIMITS.lastName.max)
);

export const validateAdminSecondLastName: Validator<unknown> = optional(
  maxLength(ADMIN_LIMITS.secondLastName.max)
);

export const validateAdminPersonalEmail: Validator<unknown> = composeValidators(
  required('El correo personal es obligatorio'),
  email(),
  maxLength(ADMIN_LIMITS.personalEmail.max)
);

export const validateAdminUsfqEmail: Validator<unknown> = composeValidators(
  required('El correo institucional es obligatorio'),
  usfqEmail(),
  maxLength(ADMIN_LIMITS.usfqEmail.max)
);

export const validateAdminPhoneNumber: Validator<unknown> = optional(phone());

export const validateAdminDateOfBirth: Validator<unknown> = optional(isoDate());

export const validateAdminPassword: Validator<unknown> = (value) => {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return 'Contraseña inválida';
  return runPasswordPolicy(value) ?? null;
};

// ---------------------------------------------------------------------------
// Form-level validator
// ---------------------------------------------------------------------------

export interface AdministratorFormValues {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  secondLastName?: string | null;
  personalEmail: string;
  usfqEmail: string;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  password?: string | null;
  isActive?: boolean;
}

export interface AdministratorResetRequestValues {
  administratorId: number;
  usfqEmail: string;
  isActive?: boolean;
}

export const administratorSchema: FormSchema<AdministratorFormValues> = {
  firstName: validateAdminFirstName,
  middleName: validateAdminMiddleName,
  lastName: validateAdminLastName,
  secondLastName: validateAdminSecondLastName,
  personalEmail: validateAdminPersonalEmail,
  usfqEmail: validateAdminUsfqEmail,
  phoneNumber: validateAdminPhoneNumber,
  dateOfBirth: validateAdminDateOfBirth,
  password: validateAdminPassword,
};

export function validateAdministratorForm(
  values: AdministratorFormValues
): FormErrors<AdministratorFormValues> {
  return validateForm(values, administratorSchema);
}

export function validateAdministratorResetRequest(
  values: AdministratorResetRequestValues
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!Number.isInteger(values.administratorId) || values.administratorId <= 0) {
    errors.administratorId = 'Administrador inválido';
  }

  const emailError = validateAdminUsfqEmail(values.usfqEmail);
  if (emailError) {
    errors.usfqEmail = emailError;
  }

  if (values.isActive === false) {
    errors.isActive = 'Solo se puede enviar el enlace a administradores activos';
  }

  return errors;
}
