/**
 * core.ts — primitive validators and combinators for the shared frontend
 * validation layer.
 *
 * Conventions:
 * - Every validator returns `null` when the value is valid, or a Spanish
 *   user-facing string when the value is invalid.
 * - Validators that accept `null | undefined | ''` as "not provided" should
 *   short-circuit and return `null` so they can be safely composed with
 *   `required(...)` and `optional(...)`.
 * - All user-facing strings are in Spanish (this is non-negotiable per the
 *   coordinator contract). Do not translate them on the fly.
 *
 * Authority:
 * - Length and enum limits ultimately come from
 *   `src/main/sql/db/db_init_ordered.sql` and the backend Zod validators
 *   under `src/main/javascript/backend/src/validators/`. Domain modules
 *   document the exact constants they mirror.
 */

export type Validator<T = unknown> = (value: T) => string | null;

export type FormErrors<T = Record<string, unknown>> = Partial<Record<keyof T & string, string>>;

export type FormSchema<T> = {
  // Each schema entry accepts a value typed as the field, but TypeScript loses
  // narrowing precision when the schema is iterated, so we widen the input to
  // `any` here. The runtime contract is unchanged.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in keyof T]?: Validator<any> | Array<Validator<any>>;
};

// ---------------------------------------------------------------------------
// String emptiness helpers
// ---------------------------------------------------------------------------

export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

function toStr(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

// ---------------------------------------------------------------------------
// Primitive validators
// ---------------------------------------------------------------------------

export function required(message = 'Este campo es obligatorio'): Validator<unknown> {
  return (value) => (isEmpty(value) ? message : null);
}

export function minLength(min: number, message?: string): Validator<unknown> {
  const msg = message ?? `Mínimo ${min} caracteres`;
  return (value) => {
    if (isEmpty(value)) return null;
    const s = toStr(value);
    return s.length < min ? msg : null;
  };
}

export function maxLength(max: number, message?: string): Validator<unknown> {
  const msg = message ?? `Máximo ${max} caracteres`;
  return (value) => {
    if (isEmpty(value)) return null;
    const s = toStr(value);
    return s.length > max ? msg : null;
  };
}

// Basic email regex matching the backend behavior (zod's `string().email()`
// equivalent — kept intentionally loose to mirror server acceptance).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function email(message = 'Correo electrónico inválido'): Validator<unknown> {
  return (value) => {
    if (isEmpty(value)) return null;
    return EMAIL_REGEX.test(toStr(value).trim()) ? null : message;
  };
}

// Mirrors `frontend/src/lib/utils/email.ts` and the backend
// `src/utils/email.utils.js#isUsfqEmail`.
const USFQ_EMAIL_REGEX = /@([a-z0-9-]+\.)*usfq\.edu\.ec$/i;

export function usfqEmail(
  message = 'Debe usar un correo institucional USFQ (@usfq.edu.ec)'
): Validator<unknown> {
  return (value) => {
    if (isEmpty(value)) return null;
    const s = toStr(value).trim().toLowerCase();
    if (!EMAIL_REGEX.test(s)) return 'Correo electrónico inválido';
    return USFQ_EMAIL_REGEX.test(s) ? null : message;
  };
}

export function url(message = 'URL inválida'): Validator<unknown> {
  return (value) => {
    if (isEmpty(value)) return null;
    try {
      // eslint-disable-next-line no-new
      new URL(toStr(value).trim());
      return null;
    } catch {
      return message;
    }
  };
}

export function positiveInt(
  message = 'Debe ser un número entero positivo'
): Validator<unknown> {
  return (value) => {
    if (isEmpty(value)) return null;
    const n = typeof value === 'number' ? value : Number(toStr(value));
    if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return message;
    return null;
  };
}

export function intRange(min: number, max: number, message?: string): Validator<unknown> {
  const msg = message ?? `Debe estar entre ${min} y ${max}`;
  return (value) => {
    if (isEmpty(value)) return null;
    const n = typeof value === 'number' ? value : Number(toStr(value));
    if (!Number.isFinite(n) || !Number.isInteger(n)) return 'Debe ser un número entero';
    if (n < min || n > max) return msg;
    return null;
  };
}

export function enumOf<T extends string | number>(
  values: readonly T[],
  message?: string
): Validator<unknown> {
  const msg = message ?? `Valor no permitido. Opciones válidas: ${values.join(', ')}`;
  return (value) => {
    if (isEmpty(value)) return null;
    return (values as readonly unknown[]).includes(value as T) ? null : msg;
  };
}

export function regex(pattern: RegExp, message = 'Formato inválido'): Validator<unknown> {
  return (value) => {
    if (isEmpty(value)) return null;
    return pattern.test(toStr(value)) ? null : message;
  };
}

// URL-friendly slug — letters, numbers, hyphens, optionally separated by `_`.
// Mirrors the loose backend acceptance and the local `slugify` util output.
const SLUG_REGEX = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export function slug(
  message = 'El slug solo puede contener minúsculas, números y guiones'
): Validator<unknown> {
  return (value) => {
    if (isEmpty(value)) return null;
    return SLUG_REGEX.test(toStr(value).trim()) ? null : message;
  };
}

// Phone — tolerant: 7-20 chars, digits + common punctuation.
// Mirrors backend `auth.validator.js`: phone_number min 7 max 20.
const PHONE_REGEX = /^[+\-\s().0-9]{7,20}$/;

export function phone(
  message = 'Número de teléfono inválido (entre 7 y 20 caracteres)'
): Validator<unknown> {
  return (value) => {
    if (isEmpty(value)) return null;
    return PHONE_REGEX.test(toStr(value).trim()) ? null : message;
  };
}

// ISO date YYYY-MM-DD — mirrors backend auth.validator `date_of_birth`.
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isoDate(message = 'Fecha inválida (AAAA-MM-DD)'): Validator<unknown> {
  return (value) => {
    if (isEmpty(value)) return null;
    if (!ISO_DATE_REGEX.test(toStr(value))) return message;
    const d = new Date(toStr(value));
    return Number.isNaN(d.getTime()) ? message : null;
  };
}

// HH:MM (or HH:MM:SS) — mirrors backend `collaborator.validator.js` time slots.
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export function timeHHMM(message = 'Hora inválida (HH:MM)'): Validator<unknown> {
  return (value) => {
    if (isEmpty(value)) return null;
    return TIME_REGEX.test(toStr(value)) ? null : message;
  };
}

// ---------------------------------------------------------------------------
// Composite combinators
// ---------------------------------------------------------------------------

/**
 * Run a list of validators left-to-right; return the first error found.
 */
export function composeValidators<T>(...validators: Array<Validator<T>>): Validator<T> {
  return (value) => {
    for (const v of validators) {
      const err = v(value);
      if (err) return err;
    }
    return null;
  };
}

/**
 * Alias of `composeValidators` — reads more naturally inline.
 */
export const all = composeValidators;

/**
 * Wraps validators so they only run when the value is present; useful for
 * fields that are optional but still constrained when filled.
 */
export function optional<T>(...validators: Array<Validator<T>>): Validator<T> {
  const composed = composeValidators(...validators);
  return (value) => (isEmpty(value) ? null : composed(value));
}

/**
 * Run a validator against every element of an array; returns the first
 * element-level error encountered, suffixed with the offending index.
 */
export function arrayOf<T>(itemValidator: Validator<T>): Validator<T[]> {
  return (value) => {
    if (!Array.isArray(value)) return null;
    for (let i = 0; i < value.length; i++) {
      const err = itemValidator(value[i]);
      if (err) return `[#${i + 1}] ${err}`;
    }
    return null;
  };
}

/**
 * Run the named schema for every element of an array; collapse errors into a
 * single Spanish summary so they can be rendered against a single field.
 */
export function arrayOfSchema<T>(schema: FormSchema<T>): Validator<unknown> {
  return (value) => {
    if (!Array.isArray(value)) return null;
    for (let i = 0; i < value.length; i++) {
      const errs = validateForm<T>(value[i] as T, schema);
      const firstKey = Object.keys(errs)[0];
      if (firstKey) {
        return `[#${i + 1}] ${(errs as Record<string, string>)[firstKey]}`;
      }
    }
    return null;
  };
}

// ---------------------------------------------------------------------------
// Form runner
// ---------------------------------------------------------------------------

/**
 * Run a schema against an object of values, returning a Spanish-keyed errors
 * object where each key maps to the first error message produced for that
 * field. Untouched / valid fields are simply omitted from the result.
 *
 * The result is always a plain object; callers can shallow-merge backend
 * errors into it with `Object.assign` or `{ ...frontend, ...backend }`.
 */
export function validateForm<T>(
  values: T,
  schema: FormSchema<T>
): FormErrors<T> {
  const errors: FormErrors<T> = {};
  const v = values as Record<string, unknown>;
  for (const key of Object.keys(schema) as Array<keyof T & string>) {
    const entry = (schema as Record<string, Validator<unknown> | Array<Validator<unknown>> | undefined>)[key];
    if (!entry) continue;
    const validator: Validator<unknown> = Array.isArray(entry)
      ? composeValidators<unknown>(...entry)
      : entry;
    const err = validator(v[key]);
    if (err) errors[key] = err;
  }
  return errors;
}

/**
 * Helper: is a `FormErrors` object empty?
 */
export function hasErrors(errors: FormErrors): boolean {
  return Object.values(errors).some((v) => !!v);
}
