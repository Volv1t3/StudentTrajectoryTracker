import pool from '../config/db.js';
import AppError from '../utils/AppError.js';
import { generateSlug } from '../utils/slug.utils.js';
import * as tagQ from './tag.queries.js';
import * as mediaQ from './media.queries.js';
import { normalizeTagName } from '../services/tag.service.js';

function mapProjectError(error) {
  const message = String(error?.sqlMessage || error?.message || '');

  if (message.includes('Duplicate entry') && message.includes('slug')) {
    return new AppError('DUPLICATE_SLUG', 'Ya existe un proyecto con este slug o título similar', 409);
  }
  if (message.includes('Cannot delete project with active assignments')) {
    return new AppError('PROJECT_HAS_ASSIGNMENTS', 'No se puede eliminar un proyecto que tiene vinculaciones activas', 400);
  }

  return error;
}

const PROJECT_MODES = new Map([
  ['presencial', 'Presencial'],
  ['remoto', 'Remoto'],
  ['hibrido', 'Híbrido'],
  ['híbrido', 'Híbrido'],
  ['Presencial', 'Presencial'],
  ['Remoto', 'Remoto'],
  ['Híbrido', 'Híbrido'],
]);

function normalizeProjectMode(mode) {
  if (!mode) return null;
  return PROJECT_MODES.get(String(mode).trim()) || null;
}

function sqlNull(value) {
  return value === undefined ? null : value;
}

function sanitizeSqlParams(params = []) {
  return params.map((value) => (value === undefined ? null : value));
}

function parseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sortProjectTags(tags = []) {
  return [...tags].sort((left, right) => {
    const systemDelta = Number(Boolean(right?.is_system)) - Number(Boolean(left?.is_system));
    if (systemDelta !== 0) return systemDelta;
    return String(left?.name || '').localeCompare(String(right?.name || ''), 'es');
  });
}

function normalizeProjectTagCollections(tags = []) {
  const orderedTags = sortProjectTags(tags);
  const categories = orderedTags.filter((tag) => tag?.is_system).slice(0, 3);
  const subcategories = orderedTags.filter((tag) => !tag?.is_system);
  return { tags: orderedTags, categories, subcategories };
}

function normalizeProjectRow(project) {
  if (!project) return null;
  const collections = normalizeProjectTagCollections(parseJsonArray(project.tags));
  const required_skill_items = parseJsonArray(project.required_skill_items);
  const meeting_days = parseJsonArray(project.meeting_days);
  return {
    ...project,
    ...collections,
    required_skill_items,
    meeting_days,
  };
}

async function registerExternalMedia(publicUrl, kind, adminId) {
  const filename = `${kind}-${Date.now()}`;
  const mediaId = await mediaQ.register({
    originalFilename: filename,
    storedFilename: `${filename}.txt`,
    publicUrl,
    storageType: 'Nube',
    storagePath: null,
    mimeType: 'text/plain',
    fileSizeBytes: null,
    entityType: 'project',
    entityId: null,
    altText: kind === 'header_image' ? 'Project header image' : 'Project video',
    caption: null,
    adminId,
  });
  return mediaId;
}

async function attachProjectMedia(target, projectId, mediaIds = {}) {
  const executor = target?.execute ? target : pool;
  const headerMediaId = mediaIds.header_image_media_asset_id || null;
  const videoMediaId = mediaIds.video_media_asset_id || null;

  await executor.execute(
    `UPDATE projects
     SET header_image_media_asset_id = ?,
         video_media_asset_id = ?,
         updated_at = NOW()
     WHERE id = ?`,
    sanitizeSqlParams([headerMediaId, videoMediaId, projectId]),
  );

  if (headerMediaId) {
    await executor.execute(
      `UPDATE media_assets
       SET entity_type = 'project',
           entity_id = ?
       WHERE id = ?`,
      sanitizeSqlParams([projectId, headerMediaId]),
    );
  }

  if (videoMediaId) {
    await executor.execute(
      `UPDATE media_assets
       SET entity_type = 'project',
           entity_id = ?
       WHERE id = ?`,
      sanitizeSqlParams([projectId, videoMediaId]),
    );
  }
}

async function resolveProjectMediaIds(data, adminId) {
  let { header_image_media_asset_id, video_media_asset_id, header_image_url, video_url } = data;

  if (!header_image_media_asset_id && header_image_url) {
    header_image_media_asset_id = await registerExternalMedia(header_image_url, 'header_image', adminId);
  }
  if (!video_media_asset_id && video_url) {
    video_media_asset_id = await registerExternalMedia(video_url, 'video', adminId);
  }

  return { header_image_media_asset_id: header_image_media_asset_id || null, video_media_asset_id: video_media_asset_id || null };
}

async function resolveProjectTags(tags = [], newTags = [], adminId) {
  const tagIds = [...tags];
  for (const tag of newTags) {
    const normalizedName = normalizeTagName(tag.name);
    const resolvedSlug = tag.slug || generateSlug(normalizedName);
    const existingTag = await tagQ.findBySlug(resolvedSlug);
    const tagId = existingTag
      ? existingTag.id
      : await tagQ.create({
          name: normalizedName,
          slug: resolvedSlug,
          category: tag.category || 'General',
          adminId,
        });
    tagIds.push(tagId);
  }
  return Array.from(new Set(tagIds.map(Number).filter((id) => Number.isInteger(id) && id > 0)));
}

function normalizeMeetingDays(meetingDays = []) {
  return meetingDays
    .map((day) => ({
      day_of_week: day?.day_of_week ?? day?.dayOfWeek ?? null,
      start_time: day?.start_time ?? day?.startTime ?? null,
      end_time: day?.end_time ?? day?.endTime ?? null,
      notes: day?.notes ?? null,
    }))
    .filter((day) => day.day_of_week && day.start_time && day.end_time);
}

function normalizeSkillName(name) {
  return normalizeTagName(name);
}

function buildSkillSlug(name, slug) {
  const resolved = String(slug || '').trim();
  if (resolved) return resolved;
  return generateSlug(name);
}

function resolveProjectSkills(skillItems = [], adminId) {
  const uniqueSkills = new Map();
  for (const skill of skillItems) {
    const name = normalizeSkillName(skill?.name);
    if (!name) continue;
    const resolvedSlug = buildSkillSlug(name, skill?.slug);
    if (!uniqueSkills.has(resolvedSlug)) {
      uniqueSkills.set(resolvedSlug, {
        name,
        slug: resolvedSlug,
        created_by_admin_id: adminId || null,
      });
    }
  }
  return Array.from(uniqueSkills.values());
}

function normalizeProjectManagers(managers = []) {
  return managers
    .map((manager) => ({
      administrator_id: manager?.administrator_id ?? manager?.admin_id ?? manager?.administratorId ?? null,
      admin_id: manager?.admin_id ?? manager?.administrator_id ?? manager?.administratorId ?? null,
      is_primary: manager?.is_primary ?? manager?.isPrimary ?? false,
    }))
    .filter((manager) => Number.isInteger(manager.admin_id) && manager.admin_id > 0);
}

export async function listPublic({ tag, status, search, limit = 20, offset = 0 }) {
  const conds = [], params = [];
  if (status) { conds.push('p.status = ?'); params.push(status); }
  if (search) { conds.push('p.title LIKE ?'); params.push(`%${search}%`); }
  if (tag) {
    conds.push(`EXISTS (
      SELECT 1
      FROM project_tags pt
      JOIN tags t ON t.id = pt.tag_id
      WHERE pt.project_id = p.id
        AND t.is_system = TRUE
        AND (t.slug = ? OR t.name = ?)
    )`);
    params.push(tag, tag);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) as total FROM vw_public_projects p ${where}`, params);
  const [rows] = await pool.execute(`SELECT * FROM vw_public_projects p ${where} ORDER BY p.id DESC LIMIT ? OFFSET ?`, [...params, String(limit), String(offset)]);
  return { rows: rows.map(normalizeProjectRow), total };
}

export async function findBySlug(slug) {
  const [rows] = await pool.execute('SELECT * FROM vw_public_projects WHERE slug = ?', [slug]);
  const project = normalizeProjectRow(rows[0] || null);
  if (!project) return null;

  const [managers] = await pool.execute(
    `
      SELECT
        pm.id,
        pm.project_id,
        pm.admin_id,
        pm.is_primary,
        pm.assigned_at,
        a.first_name,
        a.middle_name,
        a.last_name,
        a.second_last_name,
        a.usfq_email,
        a.personal_email
      FROM project_managers pm
      JOIN administrators a ON a.id = pm.admin_id
      WHERE pm.project_id = ?
      ORDER BY pm.is_primary DESC, pm.assigned_at ASC, pm.id ASC
    `,
    [project.id],
  );

  return { ...project, managers };
}

export async function findById(id) {
  const [[project]] = await pool.execute(
    `SELECT
      p.*,
      mh.public_url AS header_image_url,
      mv.public_url AS video_url
     FROM projects p
     LEFT JOIN media_assets mh ON mh.id = p.header_image_media_asset_id
     LEFT JOIN media_assets mv ON mv.id = p.video_media_asset_id
     WHERE p.id = ?`,
    [id],
  );
  if (!project) return null;
  const [tags] = await pool.execute(
    `SELECT t.*
     FROM tags t
     JOIN project_tags pt ON t.id = pt.tag_id
     WHERE pt.project_id = ?
     ORDER BY t.is_system DESC, t.name ASC`,
    [id],
  );
  const [requiredSkillItems] = await pool.execute('SELECT * FROM project_required_skills WHERE project_id = ? ORDER BY created_at ASC, id ASC', [id]);
  const [meetingDays] = await pool.execute('SELECT * FROM project_meeting_days WHERE project_id = ?', [id]);
  const [managers] = await pool.execute(
    `SELECT
      id,
      project_id,
      admin_id AS administrator_id,
      admin_id,
      is_primary,
      assigned_at
     FROM project_managers
     WHERE project_id = ?`,
    [id],
  );
  return {
    ...project,
    ...normalizeProjectTagCollections(tags),
    requiredSkillItems,
    meetingDays,
    managers,
  };
}

export async function create(data, adminId) {
  try {
    const {
      title,
      slug,
      short_description,
      full_description,
      target_audience,
      required_skills,
      participation_mode,
      status,
      is_highlighted,
      is_visible,
      max_collaborators,
      tags = [],
      new_tags = [],
      required_skill_items = [],
      meetingDays = [],
      managers = [],
      header_image_media_asset_id,
      video_media_asset_id,
      header_image_url,
      video_url,
    } = data;
    const resolvedSlug = (slug && String(slug).trim()) || generateSlug(title);
    const normalizedMode = normalizeProjectMode(participation_mode);
    const resolvedTagIds = await resolveProjectTags(tags, new_tags, adminId);
    const resolvedSkillItems = resolveProjectSkills(required_skill_items, adminId);
    const resolvedMeetingDays = normalizeMeetingDays(meetingDays);
    const resolvedMediaIds = await resolveProjectMediaIds(
      { header_image_media_asset_id, video_media_asset_id, header_image_url, video_url },
      adminId,
    );
    const [rows] = await pool.execute(
      `CALL sp_project_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, @p_id)`,
      sanitizeSqlParams([
        sqlNull(title),
        sqlNull(resolvedSlug),
        sqlNull(short_description),
        sqlNull(full_description),
        sqlNull(target_audience),
        sqlNull(required_skills),
        sqlNull(normalizedMode),
        sqlNull(resolvedMediaIds.header_image_media_asset_id),
        sqlNull(resolvedMediaIds.video_media_asset_id),
        sqlNull(status || 'Próximo'),
        is_highlighted ? 1 : 0,
        is_visible ? 1 : 0,
        sqlNull(max_collaborators || null),
        sqlNull(adminId),
        JSON.stringify(resolvedTagIds),
        JSON.stringify(resolvedSkillItems),
        JSON.stringify(resolvedMeetingDays),
        JSON.stringify(normalizeProjectManagers(managers)),
      ]),
    );
    const [[{ id }]] = await pool.execute('SELECT @p_id as id');

    if (resolvedMediaIds.header_image_media_asset_id || resolvedMediaIds.video_media_asset_id) {
      await attachProjectMedia(pool, id, resolvedMediaIds);
    }
    return id;
  } catch (error) {
    throw mapProjectError(error);
  }
}

export async function update(id, data, adminId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { tags, new_tags, required_skill_items, meetingDays, managers, header_image_media_asset_id, video_media_asset_id, header_image_url, video_url, participation_mode, slug, ...fields } = data;
    const [[currentProject]] = await conn.execute(
      `SELECT
        p.header_image_media_asset_id,
        p.video_media_asset_id,
        mh.public_url AS current_header_image_url,
        mv.public_url AS current_video_url
       FROM projects p
       LEFT JOIN media_assets mh ON mh.id = p.header_image_media_asset_id
       LEFT JOIN media_assets mv ON mv.id = p.video_media_asset_id
       WHERE p.id = ?`,
      [id],
    );
    const resolvedMode = normalizeProjectMode(participation_mode);
    const hasTagPayload = tags !== undefined || new_tags !== undefined;
    const hasSkillPayload = required_skill_items !== undefined;
    const hasMeetingDays = meetingDays !== undefined;
    const hasManagers = managers !== undefined;
    const hasHeaderMedia = header_image_media_asset_id !== undefined || header_image_url !== undefined;
    const hasVideoMedia = video_media_asset_id !== undefined || video_url !== undefined;
    const resolvedTagIds = hasTagPayload ? await resolveProjectTags(tags || [], new_tags || [], adminId) : null;
    const resolvedSkillItems = hasSkillPayload ? resolveProjectSkills(required_skill_items || [], adminId) : null;
    const resolvedMeetingDays = hasMeetingDays ? normalizeMeetingDays(meetingDays || []) : null;
    const nextHeaderMediaId = (
      header_image_media_asset_id === undefined &&
      header_image_url !== undefined &&
      header_image_url &&
      header_image_url === (currentProject?.current_header_image_url ?? null)
    )
      ? currentProject?.header_image_media_asset_id ?? null
      : header_image_media_asset_id;
    const nextVideoMediaId = (
      video_media_asset_id === undefined &&
      video_url !== undefined &&
      video_url &&
      video_url === (currentProject?.current_video_url ?? null)
    )
      ? currentProject?.video_media_asset_id ?? null
      : video_media_asset_id;
    const mediaIds = (hasHeaderMedia || hasVideoMedia)
      ? await resolveProjectMediaIds(
          {
            header_image_media_asset_id: nextHeaderMediaId,
            video_media_asset_id: nextVideoMediaId,
            header_image_url,
            video_url,
          },
          adminId,
        )
      : null;
    const updateFields = Object.fromEntries(Object.entries({
      ...fields,
      ...(slug ? { slug: String(slug).trim() } : {}),
      ...(resolvedMode ? { participation_mode: resolvedMode } : {}),
    }).filter(([, value]) => value !== undefined));
    if (mediaIds && hasHeaderMedia) updateFields.header_image_media_asset_id = mediaIds.header_image_media_asset_id;
    if (mediaIds && hasVideoMedia) updateFields.video_media_asset_id = mediaIds.video_media_asset_id;
    if (Object.keys(updateFields).length) {
      const sets = Object.keys(updateFields).map(k => `${k} = ?`).join(', ');
      await conn.execute(
        `UPDATE projects SET ${sets}, updated_at = NOW() WHERE id = ?`,
        sanitizeSqlParams([...Object.values(updateFields), id]),
      );
    }
    if (mediaIds && (hasHeaderMedia || hasVideoMedia)) {
      await attachProjectMedia(conn, id, {
        header_image_media_asset_id: hasHeaderMedia ? (updateFields.header_image_media_asset_id ?? currentProject?.header_image_media_asset_id ?? null) : currentProject?.header_image_media_asset_id ?? null,
        video_media_asset_id: hasVideoMedia ? (updateFields.video_media_asset_id ?? currentProject?.video_media_asset_id ?? null) : currentProject?.video_media_asset_id ?? null,
      });
    }
    if (resolvedTagIds) {
      await conn.execute('DELETE FROM project_tags WHERE project_id = ?', [id]);
      for (const tagId of resolvedTagIds) {
        await conn.execute(
          'INSERT INTO project_tags (project_id, tag_id) VALUES (?, ?)',
          sanitizeSqlParams([id, tagId]),
        );
      }
    }
    if (resolvedSkillItems) {
      await conn.execute('DELETE FROM project_required_skills WHERE project_id = ?', [id]);
      for (const skill of resolvedSkillItems) {
        await conn.execute(
          'INSERT INTO project_required_skills (project_id, name, slug, created_by_admin_id) VALUES (?, ?, ?, ?)',
          sanitizeSqlParams([id, skill.name, skill.slug, skill.created_by_admin_id]),
        );
      }
    }
    if (hasMeetingDays) {
      await conn.execute('DELETE FROM project_meeting_days WHERE project_id = ?', [id]);
      for (const d of resolvedMeetingDays) {
        await conn.execute(
          'INSERT INTO project_meeting_days (project_id, day_of_week, start_time, end_time, notes) VALUES (?, ?, ?, ?, ?)',
          sanitizeSqlParams([id, d.day_of_week, d.start_time, d.end_time, d.notes || null]),
        );
      }
    }
    if (hasManagers) {
      const normalizedManagers = normalizeProjectManagers(managers || []);
      await conn.execute('DELETE FROM project_managers WHERE project_id = ?', [id]);
      for (const manager of normalizedManagers) {
        await conn.execute(
          'INSERT INTO project_managers (project_id, admin_id, is_primary) VALUES (?, ?, ?)',
          sanitizeSqlParams([id, manager.admin_id, manager.is_primary ? 1 : 0]),
        );
      }
    }
    await conn.commit();
  } catch (e) { await conn.rollback(); throw mapProjectError(e); }
  finally { conn.release(); }
}

export async function setStatus(projectId, newStatus, adminId, ipAddress) {
  await pool.execute('CALL sp_project_set_status(?, ?, ?, ?)', [projectId, newStatus, adminId, ipAddress || null]);
}

export async function toggleVisibility(projectId, adminId) {
  await pool.execute('CALL sp_project_toggle_visibility(?, ?)', [projectId, adminId]);
}

export async function updateVisibility(projectId, isVisible) {
  const [result] = await pool.execute('UPDATE projects SET is_visible = ?, updated_at = NOW() WHERE id = ?', [isVisible ? 1 : 0, projectId]);
  return result.affectedRows;
}

export async function deleteProject(id) {
  try {
    const [[{ count }]] = await pool.execute("SELECT COUNT(*) as count FROM assignments WHERE project_id = ? AND status = 'Activo'", [id]);
    if (count > 0) throw new Error('Cannot delete project with active assignments');
    await pool.execute('DELETE FROM projects WHERE id = ?', [id]);
  } catch (error) {
    throw mapProjectError(error);
  }
}

export async function listAdmin({ status, isVisible, search, limit = 20, offset = 0 }) {
  const conds = [], params = [];
  if (status) { conds.push('status = ?'); params.push(status); }
  if (isVisible !== undefined) { conds.push('is_visible = ?'); params.push(isVisible); }
  if (search) { conds.push('title LIKE ?'); params.push(`%${search}%`); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) as total FROM projects ${where}`, params);
  const [rows] = await pool.execute(
    `SELECT p.*,
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', t.id,
            'name', t.name,
            'slug', t.slug,
            'category', t.category,
            'is_system', t.is_system
          )
        )
        FROM project_tags pt
        JOIN tags t ON t.id = pt.tag_id
        WHERE pt.project_id = p.id
      ) AS tags,
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', prs.id,
            'name', prs.name,
            'slug', prs.slug
          )
        )
        FROM project_required_skills prs
        WHERE prs.project_id = p.id
      ) AS required_skill_items,
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', pmd.id,
            'day_of_week', pmd.day_of_week,
            'start_time', TIME_FORMAT(pmd.start_time, '%H:%i'),
            'end_time', TIME_FORMAT(pmd.end_time, '%H:%i'),
            'notes', pmd.notes
          )
        )
        FROM project_meeting_days pmd
        WHERE pmd.project_id = p.id
      ) AS meeting_days,
      (
        SELECT GROUP_CONCAT(
          CONCAT(
            pmd.day_of_week,
            ' ',
            TIME_FORMAT(pmd.start_time, '%H:%i'),
            '-',
            TIME_FORMAT(pmd.end_time, '%H:%i'),
            COALESCE(CONCAT(' · ', pmd.notes), '')
          )
          ORDER BY pmd.id ASC SEPARATOR ', '
        )
        FROM project_meeting_days pmd
        WHERE pmd.project_id = p.id
      ) AS meeting_days_summary,
      (
        SELECT COUNT(*)
        FROM applications a
        WHERE a.project_id = p.id
          AND a.status COLLATE utf8mb4_unicode_ci IN ('Pendiente', 'En_Revisión')
      ) AS pending_count,
      adm.id AS responsible_admin_id,
      CONCAT_WS(' ', adm.first_name, NULLIF(adm.middle_name, ''), adm.last_name, NULLIF(adm.second_last_name, '')) AS responsible_admin_name,
      adm.usfq_email AS responsible_admin_email
     FROM projects p
     LEFT JOIN project_managers pm ON pm.project_id = p.id AND pm.is_primary = TRUE
     LEFT JOIN administrators adm ON adm.id = pm.admin_id
     ${where}
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, String(limit), String(offset)],
  );
  return { rows: rows.map(normalizeProjectRow), total };
}
