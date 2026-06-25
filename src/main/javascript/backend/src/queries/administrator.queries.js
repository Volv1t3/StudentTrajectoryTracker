import pool from '../config/db.js';
import AppError from '../utils/AppError.js';

function mapAdminError(error) {
  const message = String(error?.sqlMessage || error?.message || '');

  if (message.includes('Duplicate entry') && message.includes('usfq_email')) {
    return new AppError('DUPLICATE_EMAIL', 'El correo USFQ ya está registrado', 409);
  }
  if (message.includes('Duplicate entry') && message.includes('personal_email')) {
    return new AppError('DUPLICATE_EMAIL', 'El correo personal ya está registrado', 409);
  }

  return error;
}

export async function list({ search, limit = 20, offset = 0 } = {}) {
  let where = '1=1';
  const params = [];
  if (search) {
    where += ' AND (first_name LIKE ? OR last_name LIKE ? OR usfq_email LIKE ? OR personal_email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) as total FROM administrators WHERE ${where}`, params);
  const [rows] = await pool.execute(
    `SELECT id, first_name, middle_name, last_name, second_last_name, personal_email, usfq_email, phone_number, date_of_birth, is_active, created_at, updated_at FROM administrators WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, String(limit), String(offset)]
  );
  return { rows, total };
}

export async function findById(id) {
  const [rows] = await pool.execute(
    'SELECT id, first_name, middle_name, last_name, second_last_name, personal_email, usfq_email, phone_number, date_of_birth, is_active, created_at, updated_at FROM administrators WHERE id = ?',
    [id]
  );
  return rows[0];
}

export async function create(data, actorId, ipAddress) {
  try {
    const { firstName, middleName, lastName, secondLastName, personalEmail, usfqEmail, phoneNumber, dateOfBirth, passwordHash } = data;
    const [result] = await pool.execute(
      `INSERT INTO administrators (first_name, middle_name, last_name, second_last_name, personal_email, usfq_email, phone_number, date_of_birth, password_hash, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,TRUE,NOW(),NOW())`,
      [firstName, middleName || null, lastName, secondLastName || null, personalEmail, usfqEmail, phoneNumber || null, dateOfBirth || null, passwordHash]
    );
    await pool.execute(
      `INSERT INTO audit_log (actor_type, actor_id, action, entity_type, entity_id, description, ip_address, created_at) VALUES ('Administrador',?,'Crear','administrators',?,?,?,NOW())`,
      [actorId ?? null, result.insertId, 'Administrator created', ipAddress || null]
    );
    return result.insertId;
  } catch (error) {
    throw mapAdminError(error);
  }
}

export async function update(id, data, actorId, ipAddress) {
  try {
    const { firstName, middleName, lastName, secondLastName, personalEmail, usfqEmail, phoneNumber, dateOfBirth, isActive } = data;
    await pool.execute(
      `UPDATE administrators SET first_name=?, middle_name=?, last_name=?, second_last_name=?, personal_email=?, usfq_email=?, phone_number=?, date_of_birth=?, is_active=?, updated_at=NOW() WHERE id=?`,
      [firstName, middleName || null, lastName, secondLastName || null, personalEmail, usfqEmail, phoneNumber || null, dateOfBirth || null, isActive, id]
    );
    await pool.execute(
      `INSERT INTO audit_log (actor_type, actor_id, action, entity_type, entity_id, description, ip_address, created_at) VALUES ('Administrador',?,'Actualizar','administrators',?,?,?,NOW())`,
      [actorId ?? null, id, 'Administrator updated', ipAddress || null]
    );
  } catch (error) {
    throw mapAdminError(error);
  }
}

export async function remove(id, actorId, ipAddress) {
  await pool.execute('DELETE FROM administrators WHERE id = ?', [id]);
  await pool.execute(
    `INSERT INTO audit_log (actor_type, actor_id, action, entity_type, entity_id, description, ip_address, created_at) VALUES ('Administrador',?,'Eliminar','administrators',?,?,?,NOW())`,
    [actorId ?? null, id, 'Administrator deleted', ipAddress || null]
  );
}
