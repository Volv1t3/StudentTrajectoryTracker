import * as mediaService from '../services/media.service.js';
import * as mediaQ from '../queries/media.queries.js';
import { parsePagination } from '../utils/paginate.js';

const errorResponse = (res, code, message, status) =>
  res.status(status).json({ success: false, error: { code, message } });

export async function upload(req, res, next) {
  try {
    if (!req.file) return errorResponse(res, 'NO_FILE', 'No se proporcionó archivo', 400);
    const result = await mediaService.uploadMedia({ file: req.file, resourceType: req.body.resource_type, resourceId: req.body.resource_id, altText: req.body.alt_text, adminId: req.user.sub });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function deleteMedia(req, res, next) {
  try {
    await mediaService.deleteMedia({ path: req.params.path || req.body.path, resourceType: req.body.resource_type, adminId: req.user.sub });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}

export async function list(req, res, next) {
  try {
    const { limit, offset } = parsePagination(req.query);
    const rows = await mediaQ.list({ entityType: req.query.entity_type, entityId: req.query.entity_id, limit, offset });
    res.json(rows);
  } catch (e) {
    next(e);
  }
}
