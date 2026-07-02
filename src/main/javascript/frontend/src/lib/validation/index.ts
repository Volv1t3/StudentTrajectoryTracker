/**
 * Validation library entry point.
 *
 * Usage from a route component:
 *
 *   import {
 *     validateProjectForm,
 *     projectFieldMap,
 *     extractApiError,
 *     mapBackendFields,
 *     summarizeFormError,
 *   } from '$lib/validation';
 *
 * All domain modules expose:
 *   - Spanish field-level validators (`validateXxx`)
 *   - A form-level validator (`validateXxxForm`)
 *   - The `XXX_LIMITS` table mirroring DB + backend Zod rules
 */

export * from './core.js';
export * as fieldMaps from './fieldMaps.js';
export {
  fieldMaps as fieldMapsByName,
  projectFieldMap,
  eventFieldMap,
  signupFieldMap,
  authFieldMap,
  profileFieldMap,
  administratorFieldMap,
  contactFieldMap,
  applicationFieldMap,
  contentFieldMap,
  collaboratorAdminFieldMap,
  type FieldMap,
  type FieldMapName,
} from './fieldMaps.js';

export {
  extractApiError,
  extractApiErrorFromResponse,
  mapBackendFields,
  summarizeFormError,
  GENERIC_ERROR_MESSAGE,
  GENERIC_VALIDATION_SUMMARY,
  NETWORK_ERROR_MESSAGE,
  type ApiErrorIssue,
  type ExtractedApiError,
} from './apiError.js';

export * as project from './project.js';
export * as event from './event.js';
export * as auth from './auth.js';
export * as administrator from './administrator.js';
export * as collaborator from './collaborator.js';
export * as contact from './contact.js';
export * as application from './application.js';
export * as content from './content.js';
