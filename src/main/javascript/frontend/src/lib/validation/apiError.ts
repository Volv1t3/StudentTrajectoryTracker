/**
 * apiError.ts — frontend utilities to consume the unified backend error
 * contract:
 *
 *   {
 *     success: false,
 *     error: {
 *       code: 'ERR_VALIDATION',
 *       message: 'Hay errores de validación en el formulario',
 *       fields: { [backend_key]: 'mensaje en español' },
 *       issues?: [{ path: [...], message }]
 *     }
 *   }
 *
 * Other backend failures may omit `fields` and/or `code`, but
 * `error.message` is always populated. This module is resilient to:
 *   - the full contract body
 *   - bodies with only `error.message`
 *   - plain-text bodies
 *   - HTML / unknown bodies
 *   - fetch errors that never produced a response
 */

import type { FieldMap } from './fieldMaps.js';

export interface ApiErrorIssue {
  path: ReadonlyArray<string | number>;
  message: string;
}

export interface ExtractedApiError {
  /** Backend error code, or a synthetic fallback. */
  code: string;
  /** Always populated. Falls back to a generic Spanish message. */
  message: string;
  /** Backend-keyed field errors. Empty object when missing. */
  fields: Record<string, string>;
  /** Optional Zod-style issues array. Empty array when missing. */
  issues: ApiErrorIssue[];
}

export const GENERIC_ERROR_MESSAGE = 'Ocurrió un error inesperado. Intenta de nuevo.';
export const GENERIC_VALIDATION_SUMMARY = 'Hay errores de validación en el formulario';
export const NETWORK_ERROR_MESSAGE = 'No se pudo contactar al servidor. Verifica tu conexión.';

// ---------------------------------------------------------------------------
// Body normalization helpers
// ---------------------------------------------------------------------------

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim() !== '') return value;
  return null;
}

function normalizeFields(raw: unknown): Record<string, string> {
  if (!isPlainObject(raw)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'string' && v.trim() !== '') out[k] = v;
    else if (v != null) out[k] = String(v);
  }
  return out;
}

function normalizeIssues(raw: unknown): ApiErrorIssue[] {
  if (!Array.isArray(raw)) return [];
  const out: ApiErrorIssue[] = [];
  for (const item of raw) {
    if (!isPlainObject(item)) continue;
    const message = asString(item.message);
    if (!message) continue;
    const path = Array.isArray(item.path)
      ? item.path.filter((p): p is string | number => typeof p === 'string' || typeof p === 'number')
      : [];
    out.push({ path, message });
  }
  return out;
}

/**
 * Build issues from a flat `fields` map when the backend omitted `issues`.
 */
function issuesFromFields(fields: Record<string, string>): ApiErrorIssue[] {
  return Object.entries(fields).map(([k, message]) => ({ path: [k], message }));
}

// ---------------------------------------------------------------------------
// extractApiError
// ---------------------------------------------------------------------------

/**
 * Accepts any of:
 *   - a parsed JSON body following the ERR_VALIDATION contract
 *   - a partial body with only `error.message` (or top-level `message`)
 *   - a plain-text string
 *   - a thrown value (Error, network failure, etc.)
 *   - a Response (will not await it — pass the parsed body instead)
 *   - null / undefined
 *
 * Always returns a fully-shaped `ExtractedApiError`.
 */
export function extractApiError(input: unknown): ExtractedApiError {
  // 1. Nothing useful
  if (input == null) {
    return {
      code: 'ERR_UNKNOWN',
      message: GENERIC_ERROR_MESSAGE,
      fields: {},
      issues: [],
    };
  }

  // 2. Thrown Error (fetch network failure, JSON parse failure, etc.)
  if (input instanceof Error) {
    return {
      code: 'ERR_NETWORK',
      message:
        input.message && /failed to fetch|network|fetch/i.test(input.message)
          ? NETWORK_ERROR_MESSAGE
          : input.message || GENERIC_ERROR_MESSAGE,
      fields: {},
      issues: [],
    };
  }

  // 3. Plain string body (text/html, error toast string, etc.)
  if (typeof input === 'string') {
    const trimmed = input.trim();
    return {
      code: 'ERR_UNKNOWN',
      message: trimmed || GENERIC_ERROR_MESSAGE,
      fields: {},
      issues: [],
    };
  }

  // 4. A Response object — we can't await it here, so degrade gracefully.
  if (typeof Response !== 'undefined' && input instanceof Response) {
    return {
      code: 'ERR_UNKNOWN',
      message:
        input.statusText && input.statusText.trim() !== ''
          ? `${input.status} ${input.statusText}`
          : GENERIC_ERROR_MESSAGE,
      fields: {},
      issues: [],
    };
  }

  // 5. Object body — could be the full contract or a partial.
  if (isPlainObject(input)) {
    const errEnvelope = isPlainObject(input.error) ? input.error : null;
    const topMessage = asString(input.message);
    const envMessage = errEnvelope ? asString(errEnvelope.message) : null;
    const envCode = errEnvelope ? asString(errEnvelope.code) : null;
    const topCode = asString(input.code);

    const fields = errEnvelope
      ? normalizeFields(errEnvelope.fields)
      : normalizeFields((input as { fields?: unknown }).fields);

    let issues = errEnvelope
      ? normalizeIssues(errEnvelope.issues)
      : normalizeIssues((input as { issues?: unknown }).issues);
    if (issues.length === 0 && Object.keys(fields).length > 0) {
      issues = issuesFromFields(fields);
    }

    const code = envCode ?? topCode ?? (Object.keys(fields).length > 0 ? 'ERR_VALIDATION' : 'ERR_UNKNOWN');
    const message =
      envMessage ??
      topMessage ??
      (code === 'ERR_VALIDATION' ? GENERIC_VALIDATION_SUMMARY : GENERIC_ERROR_MESSAGE);

    return { code, message, fields, issues };
  }

  // 6. Anything else (number, boolean, array, …)
  return {
    code: 'ERR_UNKNOWN',
    message: GENERIC_ERROR_MESSAGE,
    fields: {},
    issues: [],
  };
}

// ---------------------------------------------------------------------------
// mapBackendFields
// ---------------------------------------------------------------------------

/**
 * Translate a backend-keyed field-error map into a frontend-keyed one using
 * a per-form mapping table from `fieldMaps.ts`. Keys not present in the map
 * are passed through verbatim so unknown backend keys still surface to the
 * user instead of being silently dropped.
 *
 * Example:
 *   mapBackendFields(
 *     { title: 'El título es obligatorio' },
 *     projectFieldMap
 *   ) === { nombre: 'El título es obligatorio' }
 */
export function mapBackendFields(
  fields: Record<string, string> | null | undefined,
  mapping: FieldMap
): Record<string, string> {
  if (!fields) return {};
  const out: Record<string, string> = {};
  for (const [backendKey, msg] of Object.entries(fields)) {
    const frontendKey = mapping[backendKey] ?? backendKey;
    out[frontendKey] = msg;
  }
  return out;
}

// ---------------------------------------------------------------------------
// summarizeFormError
// ---------------------------------------------------------------------------

/**
 * Produce the top-level Spanish summary string used for toast / banner
 * rendering. Accepts the same inputs as `extractApiError`, plus an already-
 * extracted `ExtractedApiError`. Falls back to a generic Spanish message
 * when nothing usable is present.
 *
 * Behavior:
 *   - validation errors → uses `error.message` (which the backend sets to
 *     "Hay errores de validación en el formulario") when there are field
 *     errors; otherwise the generic validation summary.
 *   - business-rule errors → uses `error.message` verbatim.
 *   - missing message → generic fallback.
 */
export function summarizeFormError(input: unknown): string {
  const extracted: ExtractedApiError =
    isPlainObject(input) &&
    'code' in input &&
    'message' in input &&
    'fields' in input &&
    'issues' in input
      ? (input as unknown as ExtractedApiError)
      : extractApiError(input);

  if (extracted.message && extracted.message.trim() !== '') {
    return extracted.message;
  }
  if (extracted.code === 'ERR_VALIDATION') return GENERIC_VALIDATION_SUMMARY;
  return GENERIC_ERROR_MESSAGE;
}

// ---------------------------------------------------------------------------
// Response-aware convenience helper
// ---------------------------------------------------------------------------

/**
 * Awaits a `Response`, attempts JSON, then falls back to text, and returns
 * the parsed `ExtractedApiError`. Useful for fetch-based callers.
 *
 *   const res = await fetch(...);
 *   if (!res.ok) {
 *     const err = await extractApiErrorFromResponse(res);
 *     // err.fields, err.message, err.code
 *   }
 */
export async function extractApiErrorFromResponse(
  response: Response
): Promise<ExtractedApiError> {
  try {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const body = await response.json();
      const result = extractApiError(body);
      // Preserve HTTP status info when the JSON didn't supply a message.
      if (result.message === GENERIC_ERROR_MESSAGE && response.statusText) {
        return { ...result, message: `${response.status} ${response.statusText}` };
      }
      return result;
    }
    const text = await response.text();
    return extractApiError(text || `${response.status} ${response.statusText}`);
  } catch (err) {
    return extractApiError(err);
  }
}
