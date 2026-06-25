import pool from '../config/db.js';

export async function insert({ actorType, actorId, action, entityType, entityId, previousValue, newValue, description, ipAddress }) {
  const [result] = await pool.execute(
    'INSERT INTO audit_log (actor_type, actor_id, action, entity_type, entity_id, previous_value, new_value, description, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [actorType, actorId, action, entityType, entityId, previousValue || null, newValue || null, description || null, ipAddress || null]
  );
  return result.insertId;
}

export async function listByEntity(entityType, entityId) {
  const [rows] = await pool.execute(
    'SELECT * FROM audit_log WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC',
    [entityType, entityId]
  );
  return rows;
}
