import * as adminQ from '../queries/administrator.queries.js';
import * as authService from '../services/auth.service.js';
import { parsePagination } from '../utils/paginate.js';

const errorResponse = (res, code, message, status) =>
  res.status(status).json({ success: false, error: { code, message } });

export async function list(req, res, next) {
  try {
    const { limit, offset, page } = parsePagination(req.query);
    const { rows, total } = await adminQ.list({ search: req.query.search, limit, offset });
    res.json({ data: rows, meta: { page, limit, total } });
  } catch (e) {
    next(e);
  }
}

export async function getById(req, res, next) {
  try {
    const data = await adminQ.findById(req.params.id);
    if (!data) return errorResponse(res, 'NOT_FOUND', 'Administrador no encontrado', 404);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const { password, ...rest } = req.validated;
    if (!password) return errorResponse(res, 'VALIDATION', 'La contraseña es requerida', 400);
    const passwordHash = await authService.hashPassword(password);
    const id = await adminQ.create({ ...rest, passwordHash }, req.user.sub, req.ip);
    res.status(201).json({ id });
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const existing = await adminQ.findById(req.params.id);
    if (!existing) return errorResponse(res, 'NOT_FOUND', 'Administrador no encontrado', 404);
    await adminQ.update(req.params.id, req.validated, req.user.sub, req.ip);
    res.json({ message: 'Administrador actualizado' });
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const existing = await adminQ.findById(req.params.id);
    if (!existing) return errorResponse(res, 'NOT_FOUND', 'Administrador no encontrado', 404);
    if (Number(req.params.id) === req.user.sub) return errorResponse(res, 'FORBIDDEN', 'No puedes eliminarte a ti mismo', 403);
    await adminQ.remove(req.params.id, req.user.sub, req.ip);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}
