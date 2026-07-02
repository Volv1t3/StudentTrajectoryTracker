/**
 * AppError
 *
 * Backward-compatible error primitive.
 *
 * Legacy signature (still supported):
 *   new AppError(code, message, httpStatus)
 *
 * Extended signature (optional metadata for structured error responses):
 *   new AppError(code, message, httpStatus, metadata)
 *
 * `metadata` may carry:
 *   - fields: { [payloadKey: string]: string }
 *   - issues: Array<{ path: string[], message: string }>
 *
 * Consumers that ignore metadata continue to work — only the error handler
 * needs to know how to serialize the extended fields.
 */
export default class AppError extends Error {
  constructor(code, message, httpStatus, metadata) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
    // Always present; defaults to empty object so callers can safely
    // read `err.metadata?.fields` without optional-chain gymnastics.
    this.metadata = metadata && typeof metadata === 'object' ? metadata : {};
    if (this.metadata.fields && typeof this.metadata.fields === 'object') {
      this.fields = this.metadata.fields;
    }
    if (Array.isArray(this.metadata.issues)) {
      this.issues = this.metadata.issues;
    }
  }
}
