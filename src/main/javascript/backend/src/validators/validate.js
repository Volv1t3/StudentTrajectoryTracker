import AppError from '../utils/AppError.js';

/**
 * Validation message normalization.
 *
 * Validators in this codebase are required to provide Spanish messages on
 * every refinement (.min, .max, .email, .url, .regex, refine, etc.). When a
 * validator omits a message — or relies on a Zod default — we still need a
 * Spanish fallback so the response is never English. This helper performs
 * that fallback mapping based on the `ZodIssue` shape.
 */
const DEFAULT_ENGLISH_MESSAGES = new Set([
  'Required',
  'Invalid email',
  'Invalid url',
  'Invalid input',
  'Invalid date',
  'Invalid enum value',
]);

function isLikelyEnglishDefault(message) {
  if (!message) return true;
  if (typeof message !== 'string') return true;
  if (DEFAULT_ENGLISH_MESSAGES.has(message)) return true;
  // Common Zod stock prefixes
  if (/^Expected\s/.test(message)) return true;
  if (/^String must contain/.test(message)) return true;
  if (/^Number must be/.test(message)) return true;
  if (/^Array must contain/.test(message)) return true;
  if (/^Invalid enum value/.test(message)) return true;
  if (/^Invalid date/.test(message)) return true;
  if (/^Invalid input/.test(message)) return true;
  if (/^Invalid literal/.test(message)) return true;
  if (/^Required$/.test(message)) return true;
  return false;
}

function mapIssueToSpanish(issue) {
  // If the validator supplied a Spanish message, prefer it.
  if (issue.message && !isLikelyEnglishDefault(issue.message)) {
    return issue.message;
  }

  switch (issue.code) {
    case 'invalid_type': {
      if (issue.received === 'undefined' || issue.received === 'null') {
        return 'Este campo es obligatorio';
      }
      return `Tipo de dato inválido (se esperaba ${issue.expected})`;
    }
    case 'too_small': {
      if (issue.type === 'string') {
        if (issue.minimum === 1) return 'Este campo es obligatorio';
        return `Debe tener al menos ${issue.minimum} caracteres`;
      }
      if (issue.type === 'array') {
        if (issue.minimum === 1) return 'Debe seleccionar al menos una opción';
        return `Debe contener al menos ${issue.minimum} elementos`;
      }
      if (issue.type === 'number') return `Debe ser mayor o igual a ${issue.minimum}`;
      if (issue.type === 'date') return 'La fecha es demasiado temprana';
      return 'Valor demasiado pequeño';
    }
    case 'too_big': {
      if (issue.type === 'string') return `Máximo ${issue.maximum} caracteres`;
      if (issue.type === 'array') return `Máximo ${issue.maximum} elementos`;
      if (issue.type === 'number') return `Debe ser menor o igual a ${issue.maximum}`;
      if (issue.type === 'date') return 'La fecha es demasiado tardía';
      return 'Valor demasiado grande';
    }
    case 'invalid_string': {
      if (issue.validation === 'email') return 'Correo electrónico inválido';
      if (issue.validation === 'url') return 'URL inválida';
      if (issue.validation === 'uuid') return 'UUID inválido';
      if (issue.validation === 'regex') return 'Formato inválido';
      if (issue.validation === 'datetime') return 'Fecha y hora inválidas';
      return 'Cadena inválida';
    }
    case 'invalid_enum_value': {
      const opts = Array.isArray(issue.options) ? issue.options.join(', ') : '';
      return opts
        ? `Valor inválido. Opciones permitidas: ${opts}`
        : 'Valor inválido';
    }
    case 'unrecognized_keys':
      return 'Campos no reconocidos en la solicitud';
    case 'invalid_date':
      return 'Fecha inválida';
    case 'invalid_literal':
      return 'Valor inválido';
    case 'invalid_union':
    case 'invalid_union_discriminator':
      return 'Valor inválido';
    case 'invalid_arguments':
    case 'invalid_return_type':
      return 'Argumentos inválidos';
    case 'not_multiple_of':
      return `Debe ser múltiplo de ${issue.multipleOf}`;
    case 'not_finite':
      return 'Debe ser un número finito';
    case 'custom':
      return issue.message || 'Valor inválido';
    default:
      return issue.message || 'Valor inválido';
  }
}

/**
 * Validation middleware. Collects every Zod issue, maps each to a Spanish
 * message, and forwards an AppError carrying:
 *   - fields: flat map of backend payload key → first message for that key
 *   - issues: ordered array of { path, message } for full detail
 *
 * The error handler is responsible for serializing this into the
 * documented ERR_VALIDATION contract.
 */
export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (result.success) {
    req.validated = result.data;
    return next();
  }

  const issuesArr = result.error?.issues || result.error?.errors || [];
  const fields = {};
  const issues = [];

  for (const issue of issuesArr) {
    const path = Array.isArray(issue.path) ? issue.path : [];
    // Build a flat key from the path. For top-level/whole-form issues we
    // use '_form' so frontends can surface them as summary-level errors.
    const key = path.length ? path.map(String).join('.') : '_form';
    const message = mapIssueToSpanish(issue);
    if (!(key in fields)) {
      fields[key] = message;
    }
    issues.push({ path: path.map(String), message });
  }

  return next(new AppError(
    'ERR_VALIDATION',
    'Hay errores de validación en el formulario',
    400,
    { fields, issues },
  ));
};
