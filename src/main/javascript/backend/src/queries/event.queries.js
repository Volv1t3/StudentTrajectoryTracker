import pool from '../config/db.js';
import AppError from '../utils/AppError.js';
import * as mediaQ from './media.queries.js';
import { generateSlug } from '../utils/slug.utils.js';

function mapEventError(error) {
  const message = String(error?.sqlMessage || error?.message || '');

  if (message.includes('Duplicate entry') && message.includes('slug')) {
    return new AppError('DUPLICATE_SLUG', 'Ya existe un evento con este slug o título similar', 409);
  }
  if (message.includes('Event not found')) {
    return new AppError('EVENT_NOT_FOUND', 'Evento no encontrado', 404);
  }

  return error;
}

function sqlNull(value) {
  return value === undefined ? null : value;
}

function normalizeManagers(managers = []) {
  return managers.map((manager) => ({
    admin_id: manager.admin_id ?? manager.administratorId,
    is_primary: manager.is_primary ?? manager.isPrimary ?? false,
  })).filter((manager) => Number.isInteger(manager.admin_id) && manager.admin_id > 0);
}

function buildRemoteMediaName(kind, eventId) {
  return `event-${eventId}-${kind}-${Date.now()}`;
}

async function registerRemoteMedia({ eventId, url, kind, adminId }) {
  const mediaName = buildRemoteMediaName(kind, eventId);
  const mimeType = kind === 'video' ? 'video/external-url' : 'image/external-url';
  return mediaQ.register({
    originalFilename: mediaName,
    storedFilename: mediaName,
    publicUrl: url,
    storageType: 'Nube',
    storagePath: url,
    mimeType,
    fileSizeBytes: null,
    entityType: 'event',
    entityId: eventId,
    altText: kind === 'banner'
      ? 'Banner del evento'
      : kind === 'poster'
        ? 'Afiche del evento'
        : 'Video del evento',
    caption: null,
    adminId,
  });
}

async function resolveMediaUpdates({ eventId, data, adminId, currentEvent }) {
  const updates = {};
  const mappings = [
    {
      idField: 'banner_media_asset_id',
      urlField: 'banner_image_url',
      currentUrlField: 'banner_image_url',
      kind: 'banner',
    },
    {
      idField: 'poster_media_asset_id',
      urlField: 'poster_image_url',
      currentUrlField: 'poster_image_url',
      kind: 'poster',
    },
    {
      idField: 'video_media_asset_id',
      urlField: 'video_url',
      currentUrlField: 'video_url',
      kind: 'video',
    },
  ];

  for (const mapping of mappings) {
    if (
      Object.prototype.hasOwnProperty.call(data, mapping.idField)
      && data[mapping.idField] !== undefined
      && data[mapping.idField] !== null
    ) {
      updates[mapping.idField] = data[mapping.idField];
      continue;
    }

    if (!Object.prototype.hasOwnProperty.call(data, mapping.urlField)) {
      if (Object.prototype.hasOwnProperty.call(data, mapping.idField) && data[mapping.idField] === null) {
        updates[mapping.idField] = null;
      }
      continue;
    }

    const nextUrl = data[mapping.urlField];
    if (!nextUrl) {
      updates[mapping.idField] = null;
      continue;
    }

    if (currentEvent?.[mapping.currentUrlField] === nextUrl && currentEvent?.[mapping.idField]) {
      updates[mapping.idField] = currentEvent[mapping.idField];
      continue;
    }

    try {
      updates[mapping.idField] = await registerRemoteMedia({
        eventId,
        url: nextUrl,
        kind: mapping.kind,
        adminId,
      });
    } catch (error) {
      console.error(`[event.media] Failed to register ${mapping.kind} media`, error.message);
    }
  }

  return updates;
}

async function findEventBySlugInternal(slug, excludeId = null) {
  if (!slug) return null;
  const params = [slug];
  let sql = 'SELECT id, slug FROM events WHERE slug = ?';
  if (excludeId !== null && excludeId !== undefined) {
    sql += ' AND id <> ?';
    params.push(excludeId);
  }
  const [rows] = await pool.execute(sql, params);
  return rows[0] || null;
}

async function resolveEventSlug(title, requestedSlug, excludeId = null) {
  const requested = String(requestedSlug || '').trim();
  const titleText = String(title || '').trim();
  const baseSlug = generateSlug(requested || titleText || 'evento') || `evento-${Date.now()}`;

  let candidate = baseSlug;
  let suffix = 2;
  while (await findEventBySlugInternal(candidate, excludeId)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

async function getEventCreateProcedureParamCount() {
  const [[row]] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM information_schema.parameters
     WHERE specific_schema = DATABASE()
       AND specific_name = 'sp_event_create'`,
  );
  return Number(row?.total || 0);
}

const PUBLIC_EVENT_SELECT = `
  SELECT
    id,
    title,
    slug,
    type,
    short_description,
    full_description,
    target_audience,
    location,
    DATE_FORMAT(event_date, '%Y-%m-%dT%H:%i:%s') AS event_date,
    DATE_FORMAT(event_end_date, '%Y-%m-%dT%H:%i:%s') AS event_end_date,
    DATE_FORMAT(registration_deadline, '%Y-%m-%dT%H:%i:%s') AS registration_deadline,
    capacity,
    banner_media_asset_id,
    video_media_asset_id,
    poster_media_asset_id,
    banner_image_url,
    video_url,
    poster_image_url,
    registration_url,
    status,
    is_highlighted,
    tags
  FROM vw_public_events
`;

export async function listPublic({ upcoming, type, status, limit = 20, offset = 0 }) {
  const conds = [];
  const params = [];
  if (upcoming) { conds.push('event_date >= NOW()'); }
  if (type) { conds.push('type = ?'); params.push(type); }
  if (status) { conds.push('status = ?'); params.push(status); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) as total FROM vw_public_events ${where}`, params);
  const [rows] = await pool.execute(`${PUBLIC_EVENT_SELECT} ${where} ORDER BY event_date ASC LIMIT ? OFFSET ?`, [...params, String(limit), String(offset)]);
  return { rows, total };
}

export async function findBySlug(slug) {
  const [rows] = await pool.execute(`${PUBLIC_EVENT_SELECT} WHERE slug = ?`, [slug]);
  return rows[0] || null;
}

export async function findById(id) {
  const [rows] = await pool.execute(`
    SELECT
      e.*,
      DATE_FORMAT(e.event_date, '%Y-%m-%dT%H:%i:%s') AS event_date,
      DATE_FORMAT(e.event_end_date, '%Y-%m-%dT%H:%i:%s') AS event_end_date,
      DATE_FORMAT(e.registration_deadline, '%Y-%m-%dT%H:%i:%s') AS registration_deadline,
      (SELECT ma.public_url FROM media_assets ma WHERE ma.id = e.banner_media_asset_id) AS banner_image_url,
      (SELECT mv.public_url FROM media_assets mv WHERE mv.id = e.video_media_asset_id) AS video_url,
      (SELECT mp.public_url FROM media_assets mp WHERE mp.id = e.poster_media_asset_id) AS poster_image_url
    FROM events e
    WHERE e.id = ?
  `, [id]);
  if (!rows[0]) return null;
  const [tags] = await pool.execute('SELECT t.* FROM tags t JOIN event_tags et ON t.id = et.tag_id WHERE et.event_id = ?', [id]);
  const [managers] = await pool.execute(`
    SELECT
      id,
      event_id,
      admin_id AS administrator_id,
      admin_id,
      is_primary,
      assigned_at
    FROM event_managers
    WHERE event_id = ?
  `, [id]);
  return { ...rows[0], tags, managers };
}

export async function create(data, adminId) {
  try {
    const {
      title,
      slug,
      type,
      short_description,
      full_description,
      target_audience,
      location,
      event_date,
      event_end_date,
      registration_deadline,
      capacity,
      banner_media_asset_id,
      video_media_asset_id,
      poster_media_asset_id,
      registration_url,
      status,
      is_highlighted,
      is_visible,
      tags = [],
      managers = [],
    } = data;
    const resolvedSlug = await resolveEventSlug(title, slug);
    const procedureParamCount = await getEventCreateProcedureParamCount();

    if (procedureParamCount >= 22) {
      await pool.execute(
        'CALL sp_event_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,@p_event_id)',
        [
          title,
          resolvedSlug,
          type,
          short_description || null,
          full_description || null,
          target_audience || null,
          location || null,
          event_date,
          event_end_date || null,
          registration_deadline || null,
          capacity || null,
          sqlNull(banner_media_asset_id),
          sqlNull(video_media_asset_id),
          sqlNull(poster_media_asset_id),
          registration_url || null,
          status || 'Próximo',
          is_highlighted || false,
          is_visible ?? true,
          adminId,
          JSON.stringify(tags),
          JSON.stringify(normalizeManagers(managers)),
        ],
      );
    } else {
      await pool.execute(
        'CALL sp_event_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,@p_event_id)',
        [
          title,
          resolvedSlug,
          type,
          short_description || null,
          full_description || null,
          target_audience || null,
          location || null,
          event_date,
          event_end_date || null,
          registration_deadline || null,
          capacity || null,
          null,
          data.banner_image_url || null,
          registration_url || null,
          status || 'Próximo',
          is_highlighted || false,
          is_visible ?? true,
          adminId,
          JSON.stringify(tags),
          JSON.stringify(normalizeManagers(managers)),
        ],
      );
    }
    const [[{ id }]] = await pool.execute('SELECT @p_event_id as id');
    if (procedureParamCount >= 22) {
      try {
        const mediaUpdates = await resolveMediaUpdates({ eventId: id, data, adminId });
        if (Object.keys(mediaUpdates).length > 0) {
          await update(id, mediaUpdates, adminId);
        }
      } catch (error) {
        console.error('[event.create] Media post-processing failed', error.message);
      }
    }
    return id;
  } catch (error) {
    throw mapEventError(error);
  }
}

export async function update(id, data, adminId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const currentEvent = await findById(id);
    const mediaUpdates = adminId
      ? await resolveMediaUpdates({ eventId: Number(id), data, adminId, currentEvent })
      : {};
    const {
      tags,
      managers,
      banner_image_url,
      poster_image_url,
      video_url,
      ...rawFields
    } = data;
    const fields = { ...rawFields, ...mediaUpdates };
    if (Object.keys(fields).length) {
      const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
      await conn.execute(`UPDATE events SET ${sets}, updated_at = NOW() WHERE id = ?`, [...Object.values(fields), id]);
    }
    if (tags) {
      await conn.execute('DELETE FROM event_tags WHERE event_id = ?', [id]);
      for (const tagId of tags) await conn.execute('INSERT INTO event_tags (event_id, tag_id) VALUES (?, ?)', [id, tagId]);
    }
    if (managers) {
      const normalizedManagers = normalizeManagers(managers);
      await conn.execute('DELETE FROM event_managers WHERE event_id = ?', [id]);
      for (const manager of normalizedManagers) {
        await conn.execute(
          'INSERT INTO event_managers (event_id, admin_id, is_primary) VALUES (?, ?, ?)',
          [id, manager.admin_id, manager.is_primary]
        );
      }
    }
    await conn.commit();
  } catch (e) { await conn.rollback(); throw mapEventError(e); }
  finally { conn.release(); }
}

export async function setStatus(eventId, newStatus, adminId, ipAddress) {
  await pool.execute('CALL sp_event_set_status(?, ?, ?, ?)', [eventId, newStatus, adminId, ipAddress || null]);
}

export async function updateVisibility(id, isVisible) {
  const [result] = await pool.execute('UPDATE events SET is_visible = ?, updated_at = NOW() WHERE id = ?', [isVisible, id]);
  return result.affectedRows;
}

export async function deleteEvent(id) {
  const [result] = await pool.execute('DELETE FROM events WHERE id = ?', [id]);
  return result.affectedRows;
}

export async function listAdmin({ status, type, upcoming, limit = 20, offset = 0 }) {
  const conds = [];
  const params = [];
  if (status) { conds.push('status = ?'); params.push(status); }
  if (type) { conds.push('type = ?'); params.push(type); }
  if (upcoming) { conds.push('event_date >= NOW()'); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) as total FROM events ${where}`, params);
  const [rows] = await pool.execute(`
    SELECT
      id,
      title,
      slug,
      type,
      short_description,
      full_description,
      target_audience,
      location,
      DATE_FORMAT(event_date, '%Y-%m-%dT%H:%i:%s') AS event_date,
      DATE_FORMAT(event_end_date, '%Y-%m-%dT%H:%i:%s') AS event_end_date,
      DATE_FORMAT(registration_deadline, '%Y-%m-%dT%H:%i:%s') AS registration_deadline,
      capacity,
      banner_media_asset_id,
      video_media_asset_id,
      poster_media_asset_id,
      registration_url,
      status,
      is_highlighted,
      is_visible,
      created_by_admin_id,
      created_at,
      updated_at
    FROM events
    ${where}
    ORDER BY event_date DESC
    LIMIT ? OFFSET ?
  `, [...params, String(limit), String(offset)]);
  return { rows, total };
}
