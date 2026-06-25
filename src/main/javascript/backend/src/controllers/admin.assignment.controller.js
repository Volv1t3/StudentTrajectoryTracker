import * as assignmentQ from '../queries/assignment.queries.js';
import * as authQ from '../queries/auth.queries.js';
import * as emailService from '../services/email.service.js';
import * as analytics from '../services/analytics.service.js';
import { env } from '../config/env.js';

const errorResponse = (res, code, message, status) =>
  res.status(status).json({ success: false, error: { code, message } });

function collaboratorRecipient(assignment) {
  return assignment?.collaborator_usfq_email || assignment?.collaborator_personal_email || null;
}

function buildAssignmentAnalyticsProps(assignment, extra = {}) {
  if (!assignment) return { source: 'backend', distinct_role: 'admin', ...extra };
  return {
    source: 'backend',
    distinct_role: 'admin',
    assignment_id: assignment.id,
    project_id: assignment.project_id || null,
    project_slug: assignment.project_slug || null,
    project_name: assignment.project_title || null,
    collaborator_id: assignment.collaborator_id || null,
    role_in_project: assignment.role_in_project || null,
    end_reason: assignment.end_reason || null,
    ...extra,
  };
}

function dispatchAssignmentStatusEmail(previous, current) {
  const recipient = collaboratorRecipient(current);
  if (!previous || !current || !recipient || previous.status === current.status) return;

  const payload = {
    firstName: current.collaborator_first_name || 'colaborador',
    email: recipient,
    projectTitle: current.project_title || 'Proyecto',
    projectSlug: current.project_slug || null,
    roleInProject: current.role_in_project || null,
    endReason: current.end_reason || null,
  };

  if (current.status === 'Pausado') {
    emailService.sendCollaboratorAssignmentPaused(payload);
  } else if (previous.status === 'Pausado' && current.status === 'Activo') {
    emailService.sendCollaboratorAssignmentResumed(payload);
  } else if (current.status === 'Finalizado') {
    emailService.sendCollaboratorAssignmentFinalized(payload);
  } else if (current.status === 'Removido') {
    emailService.sendCollaboratorAssignmentRemoved(payload);
  }
}

export async function list(req, res, next) {
  try {
    const { rows, total, statusCounts } = await assignmentQ.listAdmin({
      projectId: req.query.project_id || req.query.projectId,
      collaboratorId: req.query.collaborator_id || req.query.collaboratorId,
      status: req.query.status,
    });
    res.json({ data: rows, summary: { total, status_counts: statusCounts } });
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const {
      collaborator_id,
      project_id,
      reason_for_linking,
      role_in_project,
      admin_notes,
    } = req.validated;
    const id = await assignmentQ.createManual({
      collaboratorId: collaborator_id,
      projectId: project_id,
      adminId: req.user.sub,
      reasonForLinking: reason_for_linking,
      roleInProject: role_in_project,
      adminNotes: admin_notes,
      ipAddress: req.ip,
    });

    const [assignment, adminEmails, actingAdmin] = await Promise.all([
      assignmentQ.getAdminDetail(id),
      authQ.listActiveAdminEmails(),
      authQ.findAdminById(req.user.sub),
    ]);

    // Analytics: emit AFTER successful persistence with source=manual_linkage.
    analytics.capture(
      analytics.distinctIdForAdmin(req.user.sub),
      'assignment_created',
      buildAssignmentAnalyticsProps(assignment, {
        source: 'manual_linkage',
        actor_admin_id: req.user.sub,
      }),
    );

    const recipient = collaboratorRecipient(assignment);
    if (assignment && recipient) {
      emailService.sendCollaboratorManualLinkageCreated({
        firstName: assignment.collaborator_first_name || 'colaborador',
        email: recipient,
        projectTitle: assignment.project_title || 'Proyecto',
        projectSlug: assignment.project_slug || null,
        roleInProject: assignment.role_in_project || null,
        adminNotes: admin_notes || null,
      });
    }

    if (assignment && adminEmails.length > 0) {
      const collaboratorName = [
        assignment.collaborator_first_name,
        assignment.collaborator_last_name,
        assignment.collaborator_second_last_name,
      ].filter(Boolean).join(' ');

      const actingAdminName = [
        actingAdmin?.first_name,
        actingAdmin?.middle_name,
        actingAdmin?.last_name,
        actingAdmin?.second_last_name,
      ].filter(Boolean).join(' ');

      emailService.sendAdminManualLinkageCreated({
        collaboratorName: collaboratorName || 'Colaborador',
        collaboratorEmail: assignment.collaborator_usfq_email || assignment.collaborator_personal_email || '',
        projectTitle: assignment.project_title || 'Proyecto',
        projectSlug: assignment.project_slug || null,
        reasonForLinking: reason_for_linking,
        roleInProject: assignment.role_in_project || null,
        actingAdminName,
        adminReviewUrl: `${env.SITE_URL}/admin/linkage`,
      }, adminEmails);
    }

    res.status(201).json({ id });
  } catch (e) {
    next(e);
  }
}

export async function end(req, res, next) {
  try {
    const { end_status, end_reason } = req.validated;
    const previous = await assignmentQ.getAdminDetail(req.params.id);
    if (!previous) return errorResponse(res, 'NOT_FOUND', 'Vinculación no encontrada', 404);

    await assignmentQ.end(req.params.id, {
      endStatus: end_status,
      endReason: end_reason,
      adminId: req.user.sub,
      ipAddress: req.ip,
    });

    // If the end transition is a Removed terminal, surface as assignment_removed.
    if (end_status === 'Removido') {
      analytics.capture(
        analytics.distinctIdForAdmin(req.user.sub),
        'assignment_removed',
        buildAssignmentAnalyticsProps(previous, {
          source: 'admin_end_removed',
          actor_admin_id: req.user.sub,
          end_reason: end_reason || previous?.end_reason || null,
          previous_status: previous?.status || null,
        }),
      );
    }

    res.json({ message: 'Asignación finalizada' });
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const previous = await assignmentQ.getAdminDetail(req.params.id);
    if (!previous) return errorResponse(res, 'NOT_FOUND', 'Vinculación no encontrada', 404);

    await assignmentQ.update(req.params.id, req.validated, { adminId: req.user.sub, ipAddress: req.ip });
    const current = await assignmentQ.getAdminDetail(req.params.id);
    dispatchAssignmentStatusEmail(previous, current);

    // If the status update transitions to Removido, surface as assignment_removed.
    if (current && current.status === 'Removido' && previous?.status !== 'Removido') {
      analytics.capture(
        analytics.distinctIdForAdmin(req.user.sub),
        'assignment_removed',
        buildAssignmentAnalyticsProps(current, {
          source: 'admin_status_update',
          actor_admin_id: req.user.sub,
          previous_status: previous?.status || null,
        }),
      );
    }

    res.json({ message: 'Asignación actualizada' });
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const assignment = await assignmentQ.getAdminDetail(req.params.id);
    if (!assignment) return errorResponse(res, 'NOT_FOUND', 'Vinculación no encontrada', 404);

    await assignmentQ.hardDelete(req.params.id, { adminId: req.user.sub, ipAddress: req.ip });

    // Analytics: emit AFTER successful persistence.
    analytics.capture(
      analytics.distinctIdForAdmin(req.user.sub),
      'assignment_removed',
      buildAssignmentAnalyticsProps(assignment, {
        source: 'admin_hard_delete',
        actor_admin_id: req.user.sub,
        previous_status: assignment?.status || null,
      }),
    );

    const recipient = collaboratorRecipient(assignment);
    if (assignment && recipient) {
      emailService.sendAssignmentRemoved({
        firstName: assignment.collaborator_first_name || 'colaborador',
        to: recipient,
        projectTitle: assignment.project_title || 'Proyecto',
        projectSlug: assignment.project_slug || null,
        endReason: assignment.end_reason || null,
      });
    }

    res.status(204).end();
  } catch (e) {
    next(e);
  }
}
