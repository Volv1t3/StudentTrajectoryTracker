// Route-level sanitization middleware factory.
//
// Sanitizes an explicit, caller-provided list of `req.body` field names using
// the centralized sanitizeRichText utility, leaving every other field in the
// request body completely untouched. This is intentional: the coordination
// contract and backend/agent-task.md explicitly forbid a global blanket
// sanitizer, because that would silently mutate plain-text semantics
// (names, emails, statuses, slugs, etc.) and make field classification
// opaque.
//
// Usage (per backend/agent-task.md "Route Wiring Rules"):
//
//   router.put(
//     '/profile',
//     sanitizeRichTextFields(['motivationDescription', 'experienceDescription']),
//     validate(updateProfileSchema),
//     collaborator.updateProfile,
//   );
//
// Wiring order is sanitize -> validate -> controller so that:
//   - validation reflects the sanitized output that will actually be stored
//   - controllers keep receiving `req.validated` with unchanged field names
//     and string/null shapes (sanitizeRichText preserves null/undefined and
//     only ever narrows string content, never changes types)
//
// Only strings are sanitized in place. Fields that are `null`, `undefined`,
// or absent are left as-is (sanitizeRichText itself returns null for
// null/undefined input). If a listed field is present but not a string
// (e.g. a client sent a number/object for it), it is left untouched here —
// schema validation is responsible for rejecting the malformed payload.

import { sanitizePlainText, sanitizeRichText } from '../utils/sanitizeRichText.js';

/**
 * @param {string[]} fieldNames - explicit list of req.body field names to
 *   sanitize in place.
 * @param {(value: string|null|undefined) => string|null} sanitizer
 * @returns {import('express').RequestHandler}
 */
export function sanitizeBodyFields(fieldNames, sanitizer = sanitizeRichText) {
  if (!Array.isArray(fieldNames) || fieldNames.length === 0) {
    throw new Error('sanitizeBodyFields requires a non-empty array of field names');
  }

  return function sanitizeBodyFieldsMiddleware(req, _res, next) {
    if (req.body && typeof req.body === 'object') {
      for (const field of fieldNames) {
        const value = req.body[field];
        if (typeof value === 'string') {
          req.body[field] = sanitizer(value);
        }
        // null/undefined/absent/non-string values are left untouched;
        // validate(schema) enforces shape correctness downstream.
      }
    }
    next();
  };
}

export function sanitizeRichTextFields(fieldNames) {
  return sanitizeBodyFields(fieldNames, sanitizeRichText);
}

export function sanitizePlainTextFields(fieldNames) {
  return sanitizeBodyFields(fieldNames, sanitizePlainText);
}

export default sanitizeRichTextFields;
