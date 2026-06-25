import * as eventQ from '../queries/event.queries.js';
import { parsePagination } from '../utils/paginate.js';

const errorResponse = (res, code, message, status) =>
  res.status(status).json({ success: false, error: { code, message } });

export async function list(req, res, next) {
  try {
    const { limit, offset, page } = parsePagination(req.query);
    const { rows, total } = await eventQ.listPublic({ upcoming: req.query.upcoming, tag: req.query.tag, type: req.query.type, limit, offset });
    res.json({ data: rows, meta: { page, limit, total } });
  } catch (e) {
    next(e);
  }
}

export async function getBySlug(req, res, next) {
  try {
    const event = await eventQ.findBySlug(req.params.slug);
    if (!event) return errorResponse(res, 'NOT_FOUND', 'Evento no encontrado', 404);
    res.json(event);
  } catch (e) {
    next(e);
  }
}
