import pool from '../config/db.js';
import AppError from '../utils/AppError.js';

function buildApplicationFilter({ status, projectId, collaboratorId } = {}, { includeStatus = true } = {}) {
  const conditions = [];
  const params = [];

  if (includeStatus && status) {
    conditions.push('a.status = ?');
    params.push(status);
  }
  if (projectId) {
    conditions.push('a.project_id = ?');
    params.push(projectId);
  }
  if (collaboratorId) {
    conditions.push('a.collaborator_id = ?');
    params.push(collaboratorId);
  }

  return {
    where: conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}

function mapApplicationError(error) {
  const message = String(error?.sqlMessage || error?.message || '');

  if (message.includes('Invalid application transition')) {
    return new AppError('INVALID_APPLICATION_TRANSITION', 'La transición de estado de la solicitud no es válida', 400);
  }

  if (message.includes('Rejection reason is required')) {
    return new AppError('REJECTION_REASON_REQUIRED', 'El motivo de rechazo es obligatorio', 400);
  }

  if (message.includes('Application cannot be approved from its current status')) {
    return new AppError('APPLICATION_NOT_APPROVABLE', 'La solicitud no puede aprobarse desde su estado actual', 400);
  }

  if (message.includes('Application not found')) {
    return new AppError('APPLICATION_NOT_FOUND', 'Solicitud no encontrada', 404);
  }

  if (message.includes('Project is at max collaborator capacity')) {
    return new AppError('PROJECT_CAPACITY', 'El proyecto ya alcanzó su cupo máximo', 409);
  }

  if (message.includes('Project has reached maximum collaborator capacity')) {
    return new AppError('PROJECT_CAPACITY', 'El proyecto ya alcanzó su cupo máximo', 409);
  }

  if (message.includes('Collaborator already has an active assignment for this project')
    || message.includes('Collaborator already has a live assignment for this project')) {
    return new AppError('DUPLICATE_ASSIGNMENT', 'El colaborador ya tiene una vinculación activa o pausada con este proyecto', 409);
  }

  if (message.includes('A live assignment already exists for this project')) {
    return new AppError('DUPLICATE_ASSIGNMENT', 'Ya tienes una vinculación activa o pausada con este proyecto', 409);
  }

  if (message.includes('An active application already exists for this project')) {
    return new AppError('DUPLICATE_APPLICATION', 'Ya tienes una solicitud pendiente o en revisión para este proyecto', 409);
  }

  if (message.includes('Project is not accepting applications')) {
    return new AppError('PROJECT_NOT_ACCEPTING_APPLICATIONS', 'El proyecto no está aceptando solicitudes', 409);
  }

  return error;
}

export async function submit(collaboratorId, projectId, reason, ip) {
  await pool.execute('CALL sp_application_submit(?, ?, ?, ?, @app_id)', [collaboratorId, projectId, reason, ip || null]);
  const [[row]] = await pool.execute('SELECT @app_id as id');
  return row.id;
}

export async function create({ collaboratorId, projectId, reason, ipAddress }) {
  return submit(collaboratorId, projectId, reason, ipAddress);
}

export async function countActiveAssignmentsByCollaborator(collaboratorId) {
  const [[row]] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM assignments
     WHERE collaborator_id = ?
       AND status COLLATE utf8mb4_unicode_ci = 'Activo'`,
    [collaboratorId]
  );
  return Number(row?.count || 0);
}

export async function countLiveAssignmentsByCollaboratorAndProject(collaboratorId, projectId) {
  const [[row]] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM assignments
     WHERE collaborator_id = ?
       AND project_id = ?
       AND status COLLATE utf8mb4_unicode_ci IN ('Activo', 'Pausado')`,
    [collaboratorId, projectId],
  );
  return Number(row?.count || 0);
}

export async function setStatus(applicationId, newStatus, adminNotes, actorId, ip) {
  try {
    await pool.execute('CALL sp_application_set_status(?, ?, ?, ?, ?)', [applicationId, newStatus, adminNotes || null, actorId, ip || null]);
  } catch (error) {
    throw mapApplicationError(error);
  }
}

export async function updateStatus(applicationId, { status, adminNotes, adminId, ipAddress }) {
  return setStatus(applicationId, status, adminNotes, adminId, ipAddress);
}

export async function approve(applicationId, adminId, roleInProject, adminNotes, ip) {
  try {
    await pool.execute('CALL sp_application_approve(?, ?, ?, ?, ?, @assign_id)', [applicationId, adminId, roleInProject || null, adminNotes || null, ip || null]);
    const [[row]] = await pool.execute('SELECT @assign_id as id');
    return row.id;
  } catch (error) {
    throw mapApplicationError(error);
  }
}

export async function listByCollaborator(collaboratorId, status) {
  let sql = `
    SELECT
      a.*,
      p.title AS project_title,
      p.slug AS project_slug,
      p.participation_mode AS modality,
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
      ) AS project_categories
    FROM applications a
    JOIN projects p ON a.project_id = p.id
    WHERE a.collaborator_id = ?
  `;
  const params = [collaboratorId];
  if (status) { sql += ' AND a.status=?'; params.push(status); }
  sql += ' ORDER BY a.applied_at DESC, a.id DESC';
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function withdraw(id, collaboratorId) {
  const [result] = await pool.execute(
    "UPDATE applications SET status='Retirada' WHERE id=? AND collaborator_id=? AND status IN ('Pendiente','En_Revisión')",
    [id, collaboratorId]
  );
  return result.affectedRows > 0;
}

export async function listAdmin({ status, projectId, collaboratorId, limit = 20, offset = 0 } = {}) {
  const { where, params } = buildApplicationFilter({ status, projectId, collaboratorId });
  const { where: summaryWhere, params: summaryParams } = buildApplicationFilter(
    { status, projectId, collaboratorId },
    { includeStatus: false },
  );

  const base = `
    FROM applications a
    JOIN collaborators c ON a.collaborator_id = c.id
    JOIN projects p ON a.project_id = p.id
    LEFT JOIN project_managers pm ON pm.project_id = p.id AND pm.is_primary = TRUE
    LEFT JOIN administrators adm ON adm.id = pm.admin_id
    ${where}
  `;
  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) as total ${base}`, params);
  const [rows] = await pool.execute(
    `SELECT
      a.*,
      CONCAT_WS(' ', c.first_name, NULLIF(c.middle_name, ''), c.last_name, NULLIF(c.second_last_name, '')) AS collaborator_name,
      COALESCE(c.usfq_email, c.personal_email) AS collaborator_email,
      c.usfq_email AS collaborator_usfq_email,
      p.title AS project_title,
      p.slug AS project_slug,
      p.participation_mode AS project_participation_mode,
      adm.id AS responsible_admin_id,
      CONCAT_WS(' ', adm.first_name, NULLIF(adm.middle_name, ''), adm.last_name, NULLIF(adm.second_last_name, '')) AS responsible_admin_name,
      adm.usfq_email AS responsible_admin_email,
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
      ) AS project_categories
     ${base}
     ORDER BY a.applied_at DESC, a.id DESC
     LIMIT ? OFFSET ?`,
    [...params, String(limit), String(offset)]
  );
  const [statusRows] = await pool.execute(
    `SELECT a.status, COUNT(*) AS total
     FROM applications a
     ${summaryWhere}
     GROUP BY a.status`,
    summaryParams,
  );

  const statusCounts = {
    Pendiente: 0,
    'En_Revisión': 0,
    Aprobada: 0,
    Rechazada: 0,
    Retirada: 0,
  };

  for (const row of statusRows) {
    if (Object.hasOwn(statusCounts, row.status)) {
      statusCounts[row.status] = Number(row.total || 0);
    }
  }

  return { rows, total, statusCounts };
}

export async function getAdminDetail(id) {
  const [rows] = await pool.execute(
    `SELECT
      a.*,
      c.first_name AS collaborator_first_name,
      c.middle_name AS collaborator_middle_name,
      c.last_name AS collaborator_last_name,
      c.second_last_name AS collaborator_second_last_name,
      c.personal_email AS collaborator_personal_email,
      c.usfq_email AS collaborator_usfq_email,
      p.title AS project_title,
      p.slug AS project_slug
     FROM applications a
     JOIN collaborators c ON c.id = a.collaborator_id
     JOIN projects p ON p.id = a.project_id
     WHERE a.id = ?
     LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}
