import * as collaboratorQ from '../queries/collaborator.queries.js';
import * as auditQ from '../queries/audit.queries.js';
import * as authQ from '../queries/auth.queries.js';
import * as authService from '../services/auth.service.js';
import * as emailService from '../services/email.service.js';
import * as tagQ from '../queries/tag.queries.js';
import { env } from '../config/env.js';
import { parsePagination } from '../utils/paginate.js';

const errorResponse = (res, code, message, status) =>
  res.status(status).json({ success: false, error: { code, message } });

const uniqueEmails = (...emails) => [...new Set(emails.flat().filter(Boolean))];

export async function list(req, res, next) {
  try {
    const { limit, offset, page } = parsePagination(req.query);
    const { rows, total } = await collaboratorQ.list({ status: req.query.status, search: req.query.search, major: req.query.major, limit, offset });
    res.json({ data: rows, meta: { page, limit, total } });
  } catch (e) {
    next(e);
  }
}

export async function getById(req, res, next) {
  try {
    const data = await collaboratorQ.getAdminDetail(req.params.id);
    if (!data) return errorResponse(res, 'NOT_FOUND', 'Colaborador no encontrado', 404);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

export async function updateStatus(req, res, next) {
  try {
    await collaboratorQ.updateStatus(req.params.id, req.validated.status, req.user.sub, req.ip);
    res.json({ message: 'Estado actualizado' });
  } catch (e) {
    next(e);
  }
}

export async function approve(req, res, next) {
  try {
    const collaborator = await collaboratorQ.getAdminDetail(req.params.id);
    if (!collaborator) return errorResponse(res, 'NOT_FOUND', 'Colaborador no encontrado', 404);
    const isReviewApproval = ['Nuevo', 'En_Revisión'].includes(collaborator.trajectory_status);
    const isActivationResend = collaborator.trajectory_status === 'Contactado' && collaborator.activation_pending;

    if (!isReviewApproval && !isActivationResend) {
      return errorResponse(res, 'INVALID_STATUS', 'Solo se pueden aprobar colaboradores en revision o reenviar activaciones pendientes', 400);
    }

    if (collaborator.trajectory_status === 'Nuevo') {
      await collaboratorQ.updateStatus(req.params.id, 'En_Revisión', req.user.sub, req.ip);
      await collaboratorQ.updateStatus(req.params.id, 'Contactado', req.user.sub, req.ip);
    } else if (collaborator.trajectory_status === 'En_Revisión') {
      await collaboratorQ.updateStatus(req.params.id, 'Contactado', req.user.sub, req.ip);
    }

    await authQ.deletePendingActivationTokens(req.params.id);

    const { token, hash } = authService.generateActivationToken();
    await authQ.storeActivationToken({
      collaboratorId: req.params.id,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + env.ACTIVATION_TOKEN_TTL_H * 3600000),
    });

    if (!collaborator.usfq_email) {
      return errorResponse(res, 'INVALID_COLLABORATOR', 'El colaborador no tiene correo institucional registrado', 400);
    }

    emailService.sendActivationEmail({
      firstName: collaborator.first_name,
      email: collaborator.usfq_email,
      activationUrl: `${env.SITE_URL}/activate?token=${encodeURIComponent(token)}`,
    });

    res.json({ message: isActivationResend ? 'Email de activacion reenviado' : 'Colaborador aprobado y email de activacion enviado' });
  } catch (e) { next(e); }
}

export async function create(req, res, next) {
  try {
    const id = await collaboratorQ.createByAdmin(req.validated, req.user.sub, req.ip);
    res.status(201).json({ id });
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    await collaboratorQ.updateByAdmin(req.params.id, req.validated, req.user.sub, req.ip);
    res.json({ message: 'Colaborador actualizado' });
  } catch (e) {
    next(e);
  }
}

export async function setActive(req, res, next) {
  try {
    await collaboratorQ.setActiveByAdmin(req.params.id, req.validated.is_active, req.user.sub, req.ip);
    res.json({ message: 'Estado de actividad actualizado' });
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    await collaboratorQ.deleteByAdmin(req.params.id, req.user.sub, req.ip);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}

export async function reject(req, res, next) {
  try {
    const collaborator = await collaboratorQ.getAdminDetail(req.params.id);
    if (!collaborator) return errorResponse(res, 'NOT_FOUND', 'Colaborador no encontrado', 404);
    if (!['Nuevo', 'En_Revisión'].includes(collaborator.trajectory_status)) {
      return errorResponse(res, 'INVALID_STATUS', 'Solo se pueden rechazar colaboradores en revision', 400);
    }

    const collaboratorTags = await tagQ.findByCollaboratorId(req.params.id);

    await collaboratorQ.deleteByAdmin(req.params.id, req.user.sub, req.ip);

    for (const collaboratorTag of collaboratorTags) {
      await tagQ.deleteIfOrphaned(collaboratorTag.id);
    }

    const recipientEmails = uniqueEmails(collaborator.usfq_email, collaborator.personal_email);
    if (recipientEmails.length > 0) {
      emailService.sendCollaboratorRejected({
        firstName: collaborator.first_name,
        email: recipientEmails,
        reason: req.validated.reason || null,
      });
    }

    res.json({ message: 'Colaborador rechazado y eliminado' });
  } catch (e) { next(e); }
}

export async function addNote(req, res, next) {
  try {
    await auditQ.insert({ actorType: 'Administrador', actorId: req.user.sub, action: 'Actualizar', entityType: 'collaborators', entityId: req.params.id, description: req.validated.note, ipAddress: req.ip });
    res.status(201).json({ message: 'Nota agregada' });
  } catch (e) { next(e); }
}
