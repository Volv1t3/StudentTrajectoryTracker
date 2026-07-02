const MB = 1024 * 1024;

export const MAX_BUCKET_UPLOAD_SIZE_MB = 50;
export const MAX_BUCKET_UPLOAD_SIZE_BYTES = MAX_BUCKET_UPLOAD_SIZE_MB * MB;

export function validateBucketUpload(
  file: FormDataEntryValue | null,
  label: string,
): string | null {
  if (!(file instanceof File) || file.size <= 0) return null;
  if (file.size <= MAX_BUCKET_UPLOAD_SIZE_BYTES) return null;
  return `${label} excede el límite de ${MAX_BUCKET_UPLOAD_SIZE_MB} MB.`;
}
