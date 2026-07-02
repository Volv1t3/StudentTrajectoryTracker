/**
 * contact.ts — validation for the public contact form.
 *
 * Authority:
 *   - Backend Zod: `backend/src/validators/contact.validator.js`
 *       name min 1 max 200
 *       email email (transformed/normalized)
 *       subject min 1 max 200
 *       message min 1 max 4000
 *   - The DB `contact_info` table is a separate read-only CMS singleton and
 *     is unrelated to the inbound contact-inquiry form.
 */

import {
  composeValidators,
  email,
  maxLength,
  required,
  validateForm,
  type FormErrors,
  type FormSchema,
  type Validator,
} from './core.js';

export const CONTACT_LIMITS = Object.freeze({
  name: { min: 1, max: 200 },
  subject: { min: 1, max: 200 },
  message: { min: 1, max: 4000 },
});

// ---------------------------------------------------------------------------
// Field-level validators
// ---------------------------------------------------------------------------

export const validateContactName: Validator<unknown> = composeValidators(
  required('El nombre es obligatorio'),
  maxLength(CONTACT_LIMITS.name.max)
);

export const validateContactEmail: Validator<unknown> = composeValidators(
  required('El correo es obligatorio'),
  email()
);

export const validateContactSubject: Validator<unknown> = composeValidators(
  required('El asunto es obligatorio'),
  maxLength(CONTACT_LIMITS.subject.max)
);

export const validateContactMessage: Validator<unknown> = composeValidators(
  required('El mensaje es obligatorio'),
  maxLength(CONTACT_LIMITS.message.max)
);

// ---------------------------------------------------------------------------
// Form-level validator
// ---------------------------------------------------------------------------

export interface ContactFormValues {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const contactSchema: FormSchema<ContactFormValues> = {
  name: validateContactName,
  email: validateContactEmail,
  subject: validateContactSubject,
  message: validateContactMessage,
};

export function validateContactForm(values: ContactFormValues): FormErrors<ContactFormValues> {
  return validateForm(values, contactSchema);
}
