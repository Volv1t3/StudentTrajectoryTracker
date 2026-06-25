import { v4 as uuid } from 'uuid';
import { getStorage } from '../storage/storageFactory.js';
import { env } from '../config/env.js';
import { extname, basename } from 'path';
import * as mediaQ from '../queries/media.queries.js';
import AppError from '../utils/AppError.js';

export function resolveBucket(resourceType) {
  if (resourceType === 'project') return env.SUPABASE_BUCKET_PROJECTS;
  if (resourceType === 'event') return env.SUPABASE_BUCKET_EVENTS;
  throw new Error(`Unknown resourceType: ${resourceType}`);
}

export function buildObjectPath(resourceType, originalFilename) {
  const ext = extname(originalFilename);
  const name = basename(originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${resourceType}s/${uuid()}-${name}${ext}`;
}

export async function uploadMedia({ file, resourceType, resourceId, altText, adminId }) {
  const storage = getStorage();
  const bucket = resolveBucket(resourceType);
  const path = buildObjectPath(resourceType, file.originalname);

  await storage.upload(bucket, path, file.buffer, file.mimetype);
  const publicUrl = storage.getPublicUrl(bucket, path);

  const mediaAssetId = await mediaQ.register({
    originalFilename: file.originalname,
    storedFilename: path.split('/').pop() || path,
    publicUrl,
    storageType: 'Nube',
    storagePath: path,
    mimeType: file.mimetype,
    fileSizeBytes: file.size || null,
    entityType: resourceType || null,
    entityId: resourceId ? Number(resourceId) : null,
    altText: altText || null,
    caption: null,
    adminId,
  });

  return { publicUrl, path, mediaAssetId };
}

export async function deleteMedia({ path, resourceType, adminId }) {
  if (!path) throw new AppError('MEDIA_PATH_REQUIRED', 'Ruta del recurso requerida', 400);
  const storage = getStorage();
  const bucket = resolveBucket(resourceType);
  const storedFilename = path.split('/').pop() || path;
  const mediaAsset = await mediaQ.findByPath(storedFilename);

  if (!mediaAsset) {
    throw new AppError('MEDIA_NOT_FOUND', 'Recurso multimedia no encontrado', 404);
  }

  await storage.delete(bucket, path);
  await mediaQ.deleteMedia(mediaAsset.id, adminId);
}
