import * as applicationQ from '../queries/application.queries.js';
import * as emailService from '../services/email.service.js';
import * as analytics from '../services/analytics.service.js';
import { parsePagination } from '../utils/paginate.js';

const errorResponse = (res, code, message, status) =>
  res.status(status).json({ success: false, error: { code, message } });

function collaboratorRecipient(application) {
  return application?.collaborator_usfq_email || application?.collaborator_personal_email || null;
}

export async function list(req, res, next) {
  try {
    const { limit, offset, page } = parsePagination(req.query);
    const { rows, total, statusCounts } = await applicationQ.listAdmin({
      status: req.query.status,
      projectId: req.query.project_id,
      collaboratorId: req.query.collaborator_id,
      limit,
      offset,
    });
    res.json({
      data: rows,
      meta: { page, limit, total },
      summary: {
        total,
        status_counts: statusCounts,
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const { status, admin_notes, role_in_project } = req.validated;
    const current = await applicationQ.getAdminDetail(req.params.id);
    if (!current) return errorResponse(res, 'NOT_FOUND', 'Solicitud no encontrada', 404);

    const fromStatus = current?.status || null;
    const adminDistinctId = analytics.distinctIdForAdmin(req.user.sub);
    const collaboratorId = current?.collaborator_id || null;
    const baseAnalyticsProps = {
      source: 'backend',
      distinct_role: 'admin',
      application_id: Number(req.params.id),
      project_id: current?.project_id || null,
      project_slug: current?.project_slug || null,
      project_name: current?.project_title || null,
      collaborator_id: collaboratorId,
      actor_admin_id: req.user.sub,
    };

    if (status === 'Aprobada') {
      const assignmentId = await applicationQ.approve(
        req.params.id,
        req.user.sub,
        role_in_project || null,
        admin_notes || null,
        req.ip || null
      );

      // Analytics: emit AFTER successful persistence.
      analytics.capture(adminDistinctId, 'application_status_changed', {
        ...baseAnalyticsProps,
        from_status: fromStatus,
        to_status: 'Aprobada',
      });
      analytics.capture(adminDistinctId, 'assignment_created', {
        ...baseAnalyticsProps,
        source: 'application_approval',
        assignment_id: assignmentId,
        role_in_project: role_in_project || null,
      });

      const recipient = collaboratorRecipient(current);
      if (current && recipient) {
         emailService.sendCollaboratorApplicationApproved({
          firstName: current.collaborator_first_name || 'colaborador',
          email: recipient,
          projectTitle: current.project_title || 'Proyecto',
          projectSlug: current.project_slug || null,
          roleInProject: role_in_project || null,
          adminNotes: admin_notes || null,
        });
      }

      return res.json({ message: 'Aplicación aprobada', assignmentId });
    }
    await applicationQ.updateStatus(req.params.id, {
      status,
      adminNotes: admin_notes,
      adminId: req.user.sub,
      ipAddress: req.ip,
    });

    // Analytics: emit AFTER successful persistence.
    analytics.capture(adminDistinctId, 'application_status_changed', {
      ...baseAnalyticsProps,
      from_status: fromStatus,
      to_status: status,
    });

    const recipient = collaboratorRecipient(current);
    if (current && recipient) {
      const basePayload = {
        firstName: current.collaborator_first_name || 'colaborador',
        email: recipient,
        projectTitle: current.project_title || 'Proyecto',
        projectSlug: current.project_slug || null,
        adminNotes: admin_notes || null,
      };

      if (status === 'En_Revisión') {
         emailService.sendCollaboratorApplicationInReview(basePayload);
      } else if (status === 'Rechazada') {
         emailService.sendCollaboratorApplicationRejected(basePayload);
      } else if (status === 'Retirada') {
         emailService.sendCollaboratorApplicationWithdrawn(basePayload);
      }
    }

    res.json({ message: 'Estado actualizado' });
  } catch (e) {
    next(e);
  }
}
