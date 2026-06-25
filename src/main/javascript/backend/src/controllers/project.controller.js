import * as projectQ from '../queries/project.queries.js';
import { parsePagination } from '../utils/paginate.js';

const errorResponse = (res, code, message, status) =>
  res.status(status).json({ success: false, error: { code, message } });

export async function list(req, res, next) {
  try {
    const { limit, offset, page } = parsePagination(req.query);
    const { rows, total } = await projectQ.listPublic({ tag: req.query.tag, status: req.query.status, search: req.query.search, limit, offset });
    res.json({ data: rows, meta: { page, limit, total } });
  } catch (e) {
    next(e);
  }
}

export async function getBySlug(req, res, next) {
  try {
    const project = await projectQ.findBySlug(req.params.slug);
    if (!project) return errorResponse(res, 'NOT_FOUND', 'Proyecto no encontrado', 404);
    res.json(project);
  } catch (e) {
    next(e);
  }
}
