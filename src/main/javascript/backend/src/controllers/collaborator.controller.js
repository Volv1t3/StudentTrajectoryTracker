import * as collaboratorQ from '../queries/collaborator.queries.js';
import { ensureTagIdsForNames } from '../services/tag.service.js';
import pool from '../config/db.js';

const normalizeTimeValue = (value) => typeof value === 'string' ? value.slice(0, 5) : value;

export async function getProfile(req, res, next) {
  try {
    const user = await collaboratorQ.findById(req.user.sub);
    res.json(user);
  } catch (e) {
    next(e);
  }
}

export async function createTag(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') return res.status(400).json({ error: { message: 'Nombre requerido' } });
    const [tagId] = await ensureTagIdsForNames([name]);
    const [[tagRow]] = await pool.execute('SELECT id, name, slug FROM tags WHERE id = ?', [tagId]);

    // Link to collaborator
    await pool.execute(
      'INSERT IGNORE INTO collaborator_tags (collaborator_id, tag_id) VALUES (?, ?)',
      [req.user.sub, tagId]
    );

    res.status(201).json({ id: tagId, name: tagRow?.name, slug: tagRow?.slug });
  } catch (e) {
    next(e);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { tag_ids, ...fields } = req.validated;
    await collaboratorQ.updateProfile(req.user.sub, fields, req.user.sub, req.ip);
    if (tag_ids) {
      await collaboratorQ.syncTags(req.user.sub, tag_ids);
    }
    res.json({ message: 'Perfil actualizado' });
  } catch (e) {
    next(e);
  }
}

export async function getAvailability(req, res, next) {
  try {
    const [rows] = await pool.execute('SELECT day_of_week, time_from, time_to, notes FROM availability_slots WHERE collaborator_id = ? ORDER BY id ASC', [req.user.sub]);
    res.json({
      slots: rows.map((row) => ({
        ...row,
        time_from: normalizeTimeValue(row.time_from),
        time_to: normalizeTimeValue(row.time_to),
      }))
    });
  } catch (e) {
    next(e);
  }
}

export async function updateAvailability(req, res, next) {
  try {
    await collaboratorQ.syncAvailability(req.user.sub, req.validated.slots);
    res.json({ message: 'Disponibilidad actualizada' });
  } catch (e) {
    next(e);
  }
}
