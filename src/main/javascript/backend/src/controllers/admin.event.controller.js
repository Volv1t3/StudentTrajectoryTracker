import * as eventQ from '../queries/event.queries.js';
import * as authQ from '../queries/auth.queries.js';
import * as emailService from '../services/email.service.js';
import { parsePagination } from '../utils/paginate.js';

const errorResponse = (res, code, message, status) =>
  res.status(status).json({ success: false, error: { code, message } });

export async function list(req, res, next) {
  try {
    const { limit, offset, page } = parsePagination(req.query);
    const { rows, total } = await eventQ.listAdmin({ status: req.query.status, type: req.query.type, upcoming: req.query.upcoming, limit, offset });
    res.json({ data: rows, meta: { page, limit, total } });
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const id = await eventQ.create(req.validated, req.user.sub);
    res.status(201).json({ id });
  } catch (e) {
    next(e);
  }
}

export async function getById(req, res, next) {
  try {
    const event = await eventQ.findById(req.params.id);
    if (!event) return errorResponse(res, 'NOT_FOUND', 'Evento no encontrado', 404);
    res.json(event);
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const existing = await eventQ.findById(req.params.id);
    if (!existing) return errorResponse(res, 'NOT_FOUND', 'Evento no encontrado', 404);
    await eventQ.update(req.params.id, req.validated, req.user.sub);
    res.json({ message: 'Evento actualizado' });
  } catch (e) {
    next(e);
  }
}

export async function toggleVisibility(req, res, next) {
  try {
    const existing = await eventQ.findById(req.params.id);
    if (!existing) return errorResponse(res, 'NOT_FOUND', 'Evento no encontrado', 404);
    await eventQ.updateVisibility(req.params.id, req.validated.is_visible);
    res.json({ message: 'Visibilidad actualizada' });
  } catch (e) {
    next(e);
  }
}

export async function deleteEvent(req, res, next) {
  try {
    const existing = await eventQ.findById(req.params.id);
    if (!existing) return errorResponse(res, 'NOT_FOUND', 'Evento no encontrado', 404);
    await eventQ.deleteEvent(req.params.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}

export async function notifyMediaFailure(req, res, next) {
  try {
    const event = await eventQ.findById(req.params.id);
    if (!event) return errorResponse(res, 'NOT_FOUND', 'Evento no encontrado', 404);

    const admin = await authQ.findAdminById(req.user.sub);
    if (!admin?.usfq_email) {
      return res.status(202).json({ notified: false });
    }

    await emailService.sendEventMediaFailure({
      firstName: admin.first_name,
      email: admin.usfq_email,
      eventId: event.id,
      eventTitle: event.title,
      operation: req.validated.operation,
      stage: req.validated.stage,
    });

    res.status(202).json({ notified: true });
  } catch (e) {
    next(e);
  }
}
