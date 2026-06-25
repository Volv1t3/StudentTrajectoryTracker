import * as projectQ from '../queries/project.queries.js';
import * as authQ from '../queries/auth.queries.js';
import * as emailService from '../services/email.service.js';
import { parsePagination } from '../utils/paginate.js';

const errorResponse = (res, code, message, status) =>
  res.status(status).json({ success: false, error: { code, message } });

export async function list(req, res, next) {
  try {
    const { limit, offset, page } = parsePagination(req.query);
    const { rows, total } = await projectQ.listAdmin({ status: req.query.status, isVisible: req.query.is_visible, search: req.query.search, limit, offset });
    res.json({ data: rows, meta: { page, limit, total } });
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const id = await projectQ.create(req.validated, req.user.sub);
    res.status(201).json({ id });
  } catch (e) {
    next(e);
  }
}

export async function getById(req, res, next) {
  try {
    const project = await projectQ.findById(req.params.id);
    if (!project) return errorResponse(res, 'NOT_FOUND', 'Proyecto no encontrado', 404);
    res.json(project);
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const existing = await projectQ.findById(req.params.id);
    if (!existing) return errorResponse(res, 'NOT_FOUND', 'Proyecto no encontrado', 404);
    await projectQ.update(req.params.id, req.validated, req.user.sub);
    res.json({ message: 'Proyecto actualizado' });
  } catch (e) {
    next(e);
  }
}

export async function toggleVisibility(req, res, next) {
  try {
    const existing = await projectQ.findById(req.params.id);
    if (!existing) return errorResponse(res, 'NOT_FOUND', 'Proyecto no encontrado', 404);
    await projectQ.updateVisibility(req.params.id, req.validated.is_visible);
    res.json({ message: 'Visibilidad actualizada' });
  } catch (e) {
    next(e);
  }
}

export async function deleteProject(req, res, next) {
  try {
    const existing = await projectQ.findById(req.params.id);
    if (!existing) return errorResponse(res, 'NOT_FOUND', 'Proyecto no encontrado', 404);
    await projectQ.deleteProject(req.params.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}

export async function notifyMediaFailure(req, res, next) {
  try {
    const project = await projectQ.findById(req.params.id);
    if (!project) return errorResponse(res, 'NOT_FOUND', 'Proyecto no encontrado', 404);

    const admin = await authQ.findAdminById(req.user.sub);
    if (!admin?.usfq_email) {
      return res.status(202).json({ notified: false });
    }

    await emailService.sendProjectMediaFailure({
      firstName: admin.first_name,
      email: admin.usfq_email,
      projectId: project.id,
      projectTitle: project.title,
      operation: req.validated.operation,
      stage: req.validated.stage,
    });

    res.status(202).json({ notified: true });
  } catch (e) {
    next(e);
  }
}
