import pool from '../config/db.js';
import AppError from '../utils/AppError.js';

function mapMediaError(error) {
  const message = String(error?.sqlMessage || error?.message || '');

  if (message.includes('Media asset not found')) {
    return new AppError('MEDIA_NOT_FOUND', 'Archivo multimedia no encontrado', 404);
  }

  return error;
}

export async function register({ originalFilename, storedFilename, publicUrl, storageType, storagePath, mimeType, fileSizeBytes, entityType, entityId, altText, caption, adminId }) {
  try {
    await pool.execute(
      'CALL sp_media_register(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @mid)',
      [originalFilename, storedFilename, publicUrl, storageType, storagePath, mimeType, fileSizeBytes, entityType || null, entityId || null, altText || null, caption || null, adminId]
    );
    const [[row]] = await pool.execute('SELECT @mid AS mediaId');
    return row.mediaId;
  } catch (error) {
    throw mapMediaError(error);
  }
}

export async function findByPath(storedFilename) {
  const [[row]] = await pool.execute('SELECT * FROM media_assets WHERE stored_filename = ?', [storedFilename]);
  return row || null;
}

export async function deleteMedia(id, adminId) {
  await pool.execute('CALL sp_media_delete(?, ?)', [id, adminId]);
}

export async function list({ entityType, entityId, limit = 20, offset = 0 }) {
  let where = '1=1';
  const params = [];
  if (entityType) { where += ' AND entity_type = ?'; params.push(entityType); }
  if (entityId) { where += ' AND entity_id = ?'; params.push(entityId); }
  const [rows] = await pool.execute(
    `SELECT * FROM media_assets WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, String(limit), String(offset)]
  );
  return rows;
}
