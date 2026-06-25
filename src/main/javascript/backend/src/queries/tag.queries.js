import pool from '../config/db.js';
import AppError from '../utils/AppError.js';

function mapTagError(error) {
  const message = String(error?.sqlMessage || error?.message || '');

  if (message.includes('Duplicate entry') && message.includes('slug')) {
    return new AppError('DUPLICATE_SLUG', 'Ya existe una etiqueta con este slug', 409);
  }
  if (message.includes('Tag not found')) {
    return new AppError('TAG_NOT_FOUND', 'Etiqueta no encontrada', 404);
  }
  if (message.includes('Cannot delete system tag')) {
    return new AppError('FORBIDDEN', 'No se puede eliminar una etiqueta del sistema', 403);
  }

  return error;
}

function buildScopeWhere(scope) {
  if (scope === 'system') return 'WHERE is_system = TRUE';
  if (scope === 'project') {
    return `WHERE is_system = FALSE`;
  }
  return '';
}

export async function listAll({ scope } = {}) {
  const where = buildScopeWhere(scope);
  const [rows] = await pool.execute(`SELECT * FROM tags ${where} ORDER BY is_system DESC, category, name`);
  return rows;
}

export async function listPaged({ limit = 20, offset = 0, search = '', scope } = {}) {
  const params = [];
  const conds = [];
  if (scope === 'system') conds.push('is_system = TRUE');
  if (scope === 'project') {
    conds.push(`is_system = FALSE`);
    conds.push(`EXISTS (SELECT 1 FROM project_tags pt WHERE pt.tag_id = tags.id)`);
  }
  if (search) {
    conds.push('(name LIKE ? OR slug LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM tags ${where}`, params);
  const [rows] = await pool.execute(
    `SELECT * FROM tags ${where} ORDER BY is_system DESC, category, name LIMIT ? OFFSET ?`,
    [...params, String(limit), String(offset)],
  );
  return { rows, total };
}

export async function listWithUsage({ scope } = {}) {
  const conds = [];
  if (scope === 'system') conds.push('t.is_system = TRUE');
  if (scope === 'project') {
    conds.push('t.is_system = FALSE');
    conds.push(`EXISTS (SELECT 1 FROM project_tags pt WHERE pt.tag_id = t.id)`);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const [rows] = await pool.execute(
    `SELECT t.*,
      (SELECT COUNT(*) FROM collaborator_tags WHERE tag_id = t.id) AS collaborator_count,
      (SELECT COUNT(*) FROM project_tags WHERE tag_id = t.id) AS project_count,
      (SELECT COUNT(*) FROM event_tags WHERE tag_id = t.id) AS event_count
     FROM tags t
     ${where}
     ORDER BY t.is_system DESC, t.category, t.name`
  );
  return rows;
}

export async function create({ name, slug, category, adminId }) {
  try {
    await pool.execute('CALL sp_tag_create(?, ?, ?, ?, @tid)', [name, slug, category, adminId]);
    const [[row]] = await pool.execute('SELECT @tid AS tagId');
    return row.tagId;
  } catch (error) {
    throw mapTagError(error);
  }
}

export async function deleteTag(id, adminId) {
  try {
    await pool.execute('CALL sp_tag_delete(?, ?)', [id, adminId]);
  } catch (error) {
    throw mapTagError(error);
  }
}

export async function findBySlug(slug) {
  const [[row]] = await pool.execute('SELECT * FROM tags WHERE slug = ?', [slug]);
  return row || null;
}

export async function findByCollaboratorId(collaboratorId) {
  const [rows] = await pool.execute(
    `SELECT t.*
     FROM tags t
     JOIN collaborator_tags ct ON ct.tag_id = t.id
     WHERE ct.collaborator_id = ?`,
    [collaboratorId]
  );
  return rows;
}

export async function deleteIfOrphaned(tagId) {
  const [result] = await pool.execute(
    `DELETE FROM tags
     WHERE id = ?
       AND is_system = FALSE
       AND NOT EXISTS (SELECT 1 FROM collaborator_tags WHERE tag_id = ?)
       AND NOT EXISTS (SELECT 1 FROM project_tags WHERE tag_id = ?)
       AND NOT EXISTS (SELECT 1 FROM event_tags WHERE tag_id = ?)`,
    [tagId, tagId, tagId, tagId]
  );
  return result.affectedRows > 0;
}
