import pool from '../config/db.js';
import AppError from '../utils/AppError.js';

const DEFAULT_STATUS_COUNTS = {
  Activo: 0,
  Pausado: 0,
  Finalizado: 0,
  Removido: 0,
};

function buildAssignmentFilter({ projectId, collaboratorId, status } = {}) {
  const conditions = ['1=1'];
  const params = [];

  if (projectId) {
    conditions.push('a.project_id = ?');
    params.push(projectId);
  }
  if (collaboratorId) {
    conditions.push('a.collaborator_id = ?');
    params.push(collaboratorId);
  }
  if (status) {
    conditions.push('a.status = ?');
    params.push(status);
  }

  return {
    where: conditions.join(' AND '),
    params,
  };
}

function normalizeOptionalText(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function mapAssignmentError(error) {
  const message = String(error?.sqlMessage || error?.message || '');

  if (message.includes('Collaborator already has an active assignment for this project')
    || message.includes('Active assignment already exists')
    || message.includes('Live assignment already exists')) {
    return new AppError('DUPLICATE_ASSIGNMENT', 'El colaborador ya tiene una vinculación activa o pausada con este proyecto', 409);
  }

  if (message.includes('Project is at max collaborator capacity')
    || message.includes('Project at max capacity')) {
    return new AppError('PROJECT_CAPACITY', 'El proyecto ya alcanzó su cupo máximo', 409);
  }

  if (message.includes('Project not found')) {
    return new AppError('PROJECT_NOT_FOUND', 'Proyecto no encontrado', 404);
  }

  if (message.includes('Collaborator not found')) {
    return new AppError('COLLABORATOR_NOT_FOUND', 'Colaborador no encontrado', 404);
  }

  if (message.includes('Assignment not found')) {
    return new AppError('ASSIGNMENT_NOT_FOUND', 'Vinculación no encontrada', 404);
  }

  if (message.includes('End reason is required')) {
    return new AppError('END_REASON_REQUIRED', 'Debes ingresar un motivo para cerrar o remover la vinculación', 400);
  }

  if (message.includes('Assignment is not in an endable state')
    || message.includes('Invalid assignment transition')
    || message.includes('Invalid end status value')) {
    return new AppError('INVALID_ASSIGNMENT_TRANSITION', 'La transición de estado de la vinculación no es válida', 400);
  }

  return error;
}

async function applyDirectUpdate(id, current, data, { adminId, ipAddress }) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [[locked]] = await conn.execute(
      'SELECT id, status, role_in_project, end_reason FROM assignments WHERE id = ? FOR UPDATE',
      [id],
    );

    if (!locked) {
      throw new AppError('ASSIGNMENT_NOT_FOUND', 'Vinculación no encontrada', 404);
    }

    const nextRole = data.role_in_project === undefined ? locked.role_in_project : normalizeOptionalText(data.role_in_project);
    const nextStatus = data.status === undefined ? locked.status : data.status;
    const nextEndReason = data.end_reason === undefined ? locked.end_reason : normalizeOptionalText(data.end_reason);

    await conn.execute(
      `UPDATE assignments
       SET role_in_project = ?,
           status = ?,
           ended_at = CASE WHEN ? = 'Activo' THEN NULL ELSE ended_at END,
           end_reason = ?
       WHERE id = ?`,
      [nextRole, nextStatus, nextStatus, nextEndReason, id],
    );

    await conn.execute(
      'CALL sp_audit_write(?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        'Administrador',
        adminId,
        'Actualizar',
        'assignments',
        id,
        JSON.stringify({
          status: current.status,
          role_in_project: current.role_in_project,
          end_reason: current.end_reason,
        }),
        JSON.stringify({
          status: nextStatus,
          role_in_project: nextRole,
          end_reason: nextEndReason,
        }),
        'Assignment updated by admin',
        ipAddress || null,
      ],
    );

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw mapAssignmentError(error);
  } finally {
    conn.release();
  }
}

export async function listAdmin({ projectId, collaboratorId, status } = {}) {
  const { where, params } = buildAssignmentFilter({ projectId, collaboratorId, status });

  const [rows] = await pool.execute(
    `SELECT
      a.*,
      CONCAT_WS(' ', c.first_name, NULLIF(c.middle_name, ''), c.last_name, NULLIF(c.second_last_name, '')) AS collaborator_name,
      COALESCE(c.usfq_email, c.personal_email) AS collaborator_email,
      c.usfq_email AS collaborator_usfq_email,
      p.title AS project_title,
      p.slug AS project_slug,
      CONCAT_WS(' ', ad.first_name, NULLIF(ad.middle_name, ''), ad.last_name, NULLIF(ad.second_last_name, '')) AS assigned_by_admin_name
     FROM assignments a
     JOIN collaborators c ON c.id = a.collaborator_id
     JOIN projects p ON p.id = a.project_id
     LEFT JOIN administrators ad ON ad.id = a.assigned_by_admin_id
     WHERE ${where}
     ORDER BY a.assigned_at DESC`,
    params,
  );

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM assignments a
     WHERE ${where}`,
    params,
  );

  const [statusRows] = await pool.execute(
    `SELECT a.status, COUNT(*) AS total
     FROM assignments a
     WHERE ${where}
     GROUP BY a.status`,
    params,
  );

  const statusCounts = { ...DEFAULT_STATUS_COUNTS };
  for (const row of statusRows) {
    if (Object.hasOwn(statusCounts, row.status)) {
      statusCounts[row.status] = Number(row.total || 0);
    }
  }

  return { rows, total: Number(total || 0), statusCounts };
}

export async function createManual({
  collaboratorId,
  projectId,
  adminId,
  reasonForLinking,
  roleInProject,
  adminNotes,
  ipAddress,
}) {
  const normalizedCollaboratorId = Number(collaboratorId);
  const normalizedProjectId = Number(projectId);
  const normalizedAdminId = Number(adminId);
  const normalizedReason = String(reasonForLinking ?? '').trim();

  if (!Number.isInteger(normalizedCollaboratorId) || normalizedCollaboratorId <= 0) {
    throw new AppError('ERR_VALIDATION', 'El colaborador es obligatorio', 400);
  }

  if (!Number.isInteger(normalizedProjectId) || normalizedProjectId <= 0) {
    throw new AppError('ERR_VALIDATION', 'El proyecto es obligatorio', 400);
  }

  if (!Number.isInteger(normalizedAdminId) || normalizedAdminId <= 0) {
    throw new AppError('ERR_FORBIDDEN', 'Administrador inválido', 401);
  }

  if (normalizedReason.length < 20) {
    throw new AppError('ERR_VALIDATION', 'El motivo de vinculación debe tener al menos 20 caracteres', 400);
  }

  try {
    await pool.execute(
      'CALL sp_assignment_create_manual(?, ?, ?, ?, ?, ?, ?, @aid)',
      [
        normalizedCollaboratorId,
        normalizedProjectId,
        normalizedAdminId,
        normalizedReason,
        normalizeOptionalText(roleInProject),
        normalizeOptionalText(adminNotes),
        ipAddress || null,
      ],
    );
    const [[row]] = await pool.execute('SELECT @aid AS assignmentId');
    return row.assignmentId;
  } catch (error) {
    throw mapAssignmentError(error);
  }
}

export async function end(id, { endStatus, endReason, adminId, ipAddress }) {
  try {
    await pool.execute(
      'CALL sp_assignment_end(?, ?, ?, ?, ?)',
      [id, endStatus, normalizeOptionalText(endReason), adminId, ipAddress || null],
    );
  } catch (error) {
    throw mapAssignmentError(error);
  }
}

export async function hardDelete(id, { adminId, ipAddress }) {
  try {
    await pool.execute('CALL sp_assignment_delete_hard(?, ?, ?)', [id, adminId, ipAddress || null]);
  } catch (error) {
    throw mapAssignmentError(error);
  }
}

export async function getAdminDetail(id) {
  const [rows] = await pool.execute(
    `SELECT
      a.id,
      a.collaborator_id,
      a.project_id,
      a.application_id,
      a.role_in_project,
      a.end_reason,
      a.status,
      c.first_name AS collaborator_first_name,
      c.last_name AS collaborator_last_name,
      c.second_last_name AS collaborator_second_last_name,
      c.personal_email AS collaborator_personal_email,
      c.usfq_email AS collaborator_usfq_email,
      p.title AS project_title,
      p.slug AS project_slug
     FROM assignments a
     JOIN collaborators c ON c.id = a.collaborator_id
     JOIN projects p ON p.id = a.project_id
     WHERE a.id = ?
     LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

function buildCollaboratorAssignmentFilter(collaboratorId, { status } = {}) {
  const conditions = ['a.collaborator_id = ?'];
  const params = [collaboratorId];

  if (status) {
    conditions.push('a.status = ?');
    params.push(status);
  }

  return {
    where: conditions.join(' AND '),
    params,
  };
}

export async function listByCollaborator(collaboratorId, { status } = {}) {
  const { where, params } = buildCollaboratorAssignmentFilter(collaboratorId, { status });

  const [rows] = await pool.execute(
    `SELECT
      a.id,
      a.collaborator_id,
      a.project_id,
      a.application_id,
      a.assigned_by_admin_id,
      a.role_in_project,
      a.assigned_at,
      a.ended_at,
      a.end_reason,
      a.status,
      p.title AS project_title,
      p.slug AS project_slug,
      p.short_description AS project_short_description,
      p.status AS project_status,
      p.participation_mode AS project_participation_mode,
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
          AND t.is_system = TRUE
      ) AS project_categories,
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
          AND t.is_system = FALSE
      ) AS project_subcategories,
      (
        SELECT GROUP_CONCAT(
          CONCAT(pm_day.day_of_week, ' ', TIME_FORMAT(pm_day.start_time, '%H:%i'), '-', TIME_FORMAT(pm_day.end_time, '%H:%i'))
          ORDER BY FIELD(pm_day.day_of_week, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'),
                   pm_day.start_time
          SEPARATOR ', '
        )
        FROM project_meeting_days pm_day
        WHERE pm_day.project_id = p.id
      ) AS meeting_days_summary,
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'day_of_week', pm_day2.day_of_week,
            'time_from', TIME_FORMAT(pm_day2.start_time, '%H:%i'),
            'time_to', TIME_FORMAT(pm_day2.end_time, '%H:%i'),
            'notes', pm_day2.notes
          )
        )
        FROM project_meeting_days pm_day2
        WHERE pm_day2.project_id = p.id
        ORDER BY FIELD(pm_day2.day_of_week, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo')
      ) AS meeting_days,
      adm.id AS responsible_admin_id,
      CONCAT_WS(' ', adm.first_name, NULLIF(adm.middle_name, ''), adm.last_name, NULLIF(adm.second_last_name, '')) AS responsible_admin_name,
      adm.usfq_email AS responsible_admin_email
     FROM assignments a
     JOIN projects p ON p.id = a.project_id
     LEFT JOIN project_managers pm ON pm.project_id = p.id AND pm.is_primary = TRUE
     LEFT JOIN administrators adm ON adm.id = pm.admin_id
     WHERE ${where}
     ORDER BY a.assigned_at DESC, a.id DESC`,
    params,
  );

  return rows;
}

export async function update(id, data, { adminId, ipAddress }) {
  const [[current]] = await pool.execute(
    'SELECT id, status, role_in_project, end_reason FROM assignments WHERE id = ?',
    [id],
  );

  if (!current) {
    throw new AppError('ASSIGNMENT_NOT_FOUND', 'Vinculación no encontrada', 404);
  }

  const nextStatus = data.status;
  const nextEndReason = normalizeOptionalText(data.end_reason);

  if (nextStatus && nextStatus !== current.status) {
    if (['Pausado', 'Finalizado', 'Removido'].includes(nextStatus)) {
      await end(id, {
        endStatus: nextStatus,
        endReason: nextEndReason,
        adminId,
        ipAddress,
      });

      if (data.role_in_project !== undefined) {
        await applyDirectUpdate(
          id,
          {
            ...current,
            status: nextStatus,
            end_reason: nextEndReason,
          },
          { role_in_project: data.role_in_project },
          { adminId, ipAddress },
        );
      }

      return;
    }

    if (current.status === 'Pausado' && nextStatus === 'Activo') {
      await applyDirectUpdate(
        id,
        current,
        {
          role_in_project: data.role_in_project,
          status: 'Activo',
          end_reason: nextEndReason,
        },
        { adminId, ipAddress },
      );
      return;
    }

    throw new AppError('INVALID_ASSIGNMENT_TRANSITION', 'La transición de estado de la vinculación no es válida', 400);
  }

  await applyDirectUpdate(id, current, data, { adminId, ipAddress });
}
