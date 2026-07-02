import pool from '../config/db.js';
import AppError from '../utils/AppError.js';

function mapCollaboratorError(error) {
  const message = String(error?.sqlMessage || error?.message || '');


  if (message.includes('usfq_email')) return new AppError('DUPLICATE_EMAIL', 'El correo USFQ ya está registrado', 409);
  if (message.includes('personal_email')) return new AppError('DUPLICATE_EMAIL', 'El correo personal ya está registrado', 409);


  if (message.includes('Collaborator has active assignments')) {
    return new AppError('COLLABORATOR_HAS_ASSIGNMENTS', 'No se puede eliminar un colaborador que tiene vinculaciones activas', 400);
  }

  return error;
}

export async function findByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT * FROM collaborators WHERE usfq_email COLLATE utf8mb4_unicode_ci = ? COLLATE utf8mb4_unicode_ci',
    [email]
  );
  return rows[0];
}

export async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT c.*,
            (
              SELECT COUNT(*)
              FROM assignments a
              WHERE a.collaborator_id = c.id
                AND a.status COLLATE utf8mb4_unicode_ci = 'Activo'
            ) AS active_assignment_count,
            JSON_ARRAYAGG(IF(t.id IS NOT NULL, JSON_OBJECT('id',t.id,'name',t.name,'slug',t.slug,'category',t.category), NULL)) as tags
     FROM collaborators c
     LEFT JOIN collaborator_tags ct ON c.id = ct.collaborator_id
     LEFT JOIN tags t ON ct.tag_id = t.id
     WHERE c.id = ? GROUP BY c.id`,
    [id]
  );
  return rows[0];
}

export async function create({ firstName, lastName, personalEmail, usfqEmail, major, graduationYear, passwordHash }) {
  try {
    const [result] = await pool.execute(
      `INSERT INTO collaborators (
        first_name, last_name, personal_email, usfq_email, major,
        current_university_year, expected_graduation_year, password_hash,
        trajectory_status, profile_complete, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Nuevo', FALSE, NOW(), NOW())`,
      [firstName, lastName, personalEmail, usfqEmail || null, major, 1, graduationYear, passwordHash]
    );
    return result.insertId;
  } catch (error) {
    throw mapCollaboratorError(error);
  }
}

export async function updatePassword(collaboratorId, passwordHash) {
  await pool.execute('UPDATE collaborators SET password_hash = ?, updated_at = NOW() WHERE id = ?', [passwordHash, collaboratorId]);
}

export async function register(data) {
  try {
    const {
      firstName, middleName, lastName, secondLastName, personalEmail, usfqEmail,
      phoneNumber, dateOfBirth, major, currentUniversityYear, expectedGraduationYear,
      experienceDescription, motivationDescription, interestInMachinery, interestInDesign,
      interestInMaterials, intakeSource, tagIds, availabilitySlots
    } = data;
    await pool.execute(
      `CALL sp_collaborator_register(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,@id)`,
      [firstName, middleName, lastName, secondLastName, personalEmail, usfqEmail,
       phoneNumber, dateOfBirth, major, currentUniversityYear, expectedGraduationYear,
       experienceDescription, motivationDescription, interestInMachinery, interestInDesign,
       interestInMaterials, intakeSource, JSON.stringify(tagIds || []), JSON.stringify(availabilitySlots || [])]
    );
    const [[{ id }]] = await pool.execute('SELECT @id as id');
    return id;
  } catch (error) {
    throw mapCollaboratorError(error);
  }
}

export async function updateProfile(collaboratorId, data, actorId, ipAddress) {
  try {
    const {
      firstName, middleName, lastName, secondLastName, personalEmail, usfqEmail, phoneNumber,
      dateOfBirth, major, currentUniversityYear, expectedGraduationYear,
      experienceDescription, motivationDescription, interestInMachinery,
      interestInDesign, interestInMaterials
    } = data;

    // Normalize ISO date string to YYYY-MM-DD or null
    const normalizeDate = (v) => {
      if (!v) return null;
      const d = new Date(v);
      if (isNaN(d.getTime())) return null;
      return d.toISOString().slice(0, 10);
    };

    await pool.execute(
      'CALL sp_collaborator_update_profile(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [
        collaboratorId,
        firstName ?? null,
        middleName ?? null,
        lastName ?? null,
        secondLastName ?? null,
        personalEmail ?? null,
        usfqEmail ?? null,
        phoneNumber ?? null,
        normalizeDate(dateOfBirth),
        major ?? null,
        currentUniversityYear ?? null,
        expectedGraduationYear ?? null,
        experienceDescription ?? null,
        motivationDescription ?? null,
        interestInMachinery ?? false,
        interestInDesign ?? false,
        interestInMaterials ?? false,
        actorId,
        ipAddress
      ]
    );
  } catch (error) {
    throw mapCollaboratorError(error);
  }
}

export async function updateStatus(collaboratorId, newStatus, actorId, ipAddress) {
  await pool.execute('CALL sp_collaborator_set_status(?,?,?,?)', [collaboratorId, newStatus, actorId, ipAddress]);
}

export async function createByAdmin(data, actorId, ipAddress) {
  try {
    const {
      firstName, middleName, lastName, secondLastName, personalEmail, usfqEmail,
      phoneNumber, dateOfBirth, passwordHash, major, currentUniversityYear,
      expectedGraduationYear, experienceDescription, motivationDescription,
      interestInTraining, interestInResearch, interestInFabrication,
      trajectoryStatus, isActive, profileComplete, intakeSource
    } = data;

    await pool.execute(
      'CALL sp_collaborator_admin_create(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,@p_collaborator_id)',
      [
        firstName, middleName || null, lastName, secondLastName || null, personalEmail,
        usfqEmail || null, phoneNumber || null, dateOfBirth || null, passwordHash || null,
        major, currentUniversityYear, expectedGraduationYear,
        experienceDescription || null, motivationDescription || null,
        interestInTraining, interestInResearch, interestInFabrication,
        trajectoryStatus, isActive, profileComplete, intakeSource || null,
        actorId, ipAddress
      ]
    );

    const [[{ '@p_collaborator_id': collaboratorId }]] = await pool.execute('SELECT @p_collaborator_id');
    return collaboratorId;
  } catch (error) {
    throw mapCollaboratorError(error);
  }
}

export async function updateByAdmin(collaboratorId, data, actorId, ipAddress) {
  try {
    const {
      firstName, middleName, lastName, secondLastName, personalEmail, usfqEmail,
      phoneNumber, dateOfBirth, major, currentUniversityYear,
      expectedGraduationYear, experienceDescription, motivationDescription,
      interestInTraining, interestInResearch, interestInFabrication,
      trajectoryStatus, isActive, profileComplete, intakeSource
    } = data;

    await pool.execute(
      'CALL sp_collaborator_admin_update(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [
        collaboratorId, firstName, middleName || null, lastName, secondLastName || null, personalEmail,
        usfqEmail || null, phoneNumber || null, dateOfBirth || null,
        major, currentUniversityYear, expectedGraduationYear,
        experienceDescription || null, motivationDescription || null,
        interestInTraining, interestInResearch, interestInFabrication,
        trajectoryStatus, isActive, profileComplete, intakeSource || null,
        actorId, ipAddress
      ]
    );
  } catch (error) {
    throw mapCollaboratorError(error);
  }
}

export async function setActiveByAdmin(collaboratorId, isActive, actorId, ipAddress) {
  await pool.execute('CALL sp_collaborator_admin_set_active(?,?,?,?)', [collaboratorId, isActive, actorId, ipAddress]);
}

export async function deleteByAdmin(collaboratorId, actorId, ipAddress) {
  try {
    await pool.execute('CALL sp_collaborator_admin_delete(?,?,?)', [collaboratorId, actorId, ipAddress]);
  } catch (error) {
    throw mapCollaboratorError(error);
  }
}

export async function syncTags(collaboratorId, tagIds) {
  await pool.execute('CALL sp_collaborator_sync_tags(?,?)', [collaboratorId, JSON.stringify(tagIds)]);
}

export async function syncAvailability(collaboratorId, availabilitySlots) {
  await pool.execute('CALL sp_collaborator_sync_availability(?,?)', [collaboratorId, JSON.stringify(availabilitySlots)]);
}

export async function list({ status, search, major, limit = 20, offset = 0 } = {}) {
  let where = '1=1';
  const params = [];
  if (status) { where += ' AND trajectory_status = ?'; params.push(status); }
  if (search) { where += ' AND (first_name LIKE ? OR last_name LIKE ? OR usfq_email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (major) { where += ' AND major = ?'; params.push(major); }

  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) as total FROM vw_admin_collaborators WHERE ${where}`, params);
  const [rows] = await pool.execute(
    `SELECT
      vc.*,
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'day_of_week', av.day_of_week,
            'time_from', TIME_FORMAT(av.time_from, '%H:%i'),
            'time_to', TIME_FORMAT(av.time_to, '%H:%i'),
            'notes', av.notes
          )
        )
        FROM availability_slots av
        WHERE av.collaborator_id = vc.id
      ) AS availability_slots
     FROM vw_admin_collaborators vc
     WHERE ${where}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, String(limit), String(offset)]
  );
  return { rows, total };
}

export async function getAdminDetail(id) {
  const [rows] = await pool.execute('SELECT * FROM vw_admin_collaborators WHERE id = ?', [id]);
  const [[accountState]] = await pool.execute(
    'SELECT password_hash IS NOT NULL AS has_password FROM collaborators WHERE id = ?',
    [id]
  );
  const [applications] = await pool.execute(
    `SELECT a.*, p.title AS project_title
     FROM applications a
     JOIN projects p ON p.id = a.project_id
     WHERE a.collaborator_id = ?`,
    [id]
  );
  const [assignments] = await pool.execute('SELECT * FROM assignments WHERE collaborator_id = ?', [id]);
  const [availabilitySlots] = await pool.execute(
    "SELECT day_of_week, TIME_FORMAT(time_from, '%H:%i') AS time_from, TIME_FORMAT(time_to, '%H:%i') AS time_to, notes FROM availability_slots WHERE collaborator_id = ? ORDER BY id ASC",
    [id]
  );
  const [auditLog] = await pool.execute(
    "SELECT * FROM audit_log WHERE entity_type = 'collaborators' AND entity_id = ? ORDER BY created_at DESC", [id]
  );
  return {
    ...rows[0],
    applications,
    assignments,
    availability_slots: availabilitySlots,
    auditLog,
    activation_pending: rows[0]?.trajectory_status === 'Contactado' && !Boolean(accountState?.has_password)
  };
}
