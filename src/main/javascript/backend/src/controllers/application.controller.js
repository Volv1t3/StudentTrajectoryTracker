import * as applicationQ from '../queries/application.queries.js';
import * as authQ from '../queries/auth.queries.js';
import * as collaboratorQ from '../queries/collaborator.queries.js';
import * as projectQ from '../queries/project.queries.js';
import * as emailService from '../services/email.service.js';
import * as analytics from '../services/analytics.service.js';
import { env } from '../config/env.js';

const errorResponse = (res, code, message, status) =>
  res.status(status).json({ success: false, error: { code, message } });

export async function list(req, res, next) {
  try {
    const rows = await applicationQ.listByCollaborator(req.user.sub, req.query.status);
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

export async function submit(req, res, next) {
  try {
    const { project_id, reason_for_applying } = req.validated;
    const activeAssignmentCount = await applicationQ.countActiveAssignmentsByCollaborator(req.user.sub);
    if (activeAssignmentCount >= 2) {
      return errorResponse(res, 'PROJECT_LIMIT_REACHED', 'Ya alcanzaste el máximo de 2 proyectos activos', 409);
    }
    const existing = await applicationQ.listByCollaborator(req.user.sub);
    if (existing.some(a => a.project_id === project_id && ['Pendiente', 'En_Revisión'].includes(a.status))) {
      return errorResponse(res, 'DUPLICATE_APPLICATION', 'Ya tienes una solicitud pendiente o en revisión para este proyecto', 409);
    }
    const liveAssignmentCount = await applicationQ.countLiveAssignmentsByCollaboratorAndProject(req.user.sub, project_id);
    if (liveAssignmentCount > 0) {
      return errorResponse(res, 'DUPLICATE_ASSIGNMENT', 'Ya tienes una vinculación activa o pausada con este proyecto', 409);
    }
    const id = await applicationQ.create({
      collaboratorId: req.user.sub,
      projectId: project_id,
      reason: reason_for_applying,
      ipAddress: req.ip,
    });

    const [adminEmails, collaborator, project] = await Promise.all([
      authQ.listActiveAdminEmails(),
      collaboratorQ.findById(req.user.sub),
      projectQ.findById(project_id),
    ]);

    // Analytics: emit AFTER successful persistence. Failures are isolated.
    const collaboratorDistinctId = analytics.distinctIdForCollaborator(req.user.sub);
    analytics.identify(collaboratorDistinctId, {
      distinct_role: 'collaborator',
      major: d.major,
      semester: d.current_university_year,
    });
    analytics.capture(collaboratorDistinctId, 'collaborator_signup_submitted', {
      source: 'backend',
      distinct_role: 'collaborator',
      major: d.major,
      semester: d.current_university_year,
      intake_source: 'signup_form',
    });

    if (recipientEmails.length > 0) {
      emailService.sendSignupReceived({
        firstName: d.first_name,
        lastName: d.last_name,
        to: recipientEmails,
        personalEmail: d.personal_email,
        usfqEmail: d.usfq_email,
        phoneNumber: d.phone_number,
        dateOfBirth: d.date_of_birth,
        major: d.major,
        currentUniversityYear: d.current_university_year,
        interestAreas,
        tagNames: d.tag_names || [],
        motivationDescription: d.motivation_description,
        experienceDescription: d.experience_description || null,
      });
    }

    if (adminEmails.length > 0) {
      emailService.sendAdminNewRegistration({
        firstName: d.first_name,
        lastName: d.last_name,
        email: d.usfq_email,
        major: d.major,
        currentUniversityYear: d.current_university_year,
        adminReviewUrl: reviewUrl,
      }, adminEmails);
    }

    res.status(201).json({ message: 'Registro exitoso' });
  } catch (e) {
    next(e);
  }
}

export async function withdraw(req, res, next) {
  try {
    // Capture pre-state for from_status reporting.
    const before = await applicationQ.listByCollaborator(req.user.sub);
    const target = before.find((a) => String(a.id) === String(req.params.id));

    const affected = await applicationQ.withdraw(req.params.id, req.user.sub);
    if (!affected) return errorResponse(res, 'NOT_FOUND', 'Aplicación no encontrada o no retirable', 404);

    // Analytics: emit AFTER successful persistence.
    analytics.capture(
      analytics.distinctIdForCollaborator(req.user.sub),
      'application_status_changed',
      {
        source: 'backend',
        distinct_role: 'collaborator',
        application_id: Number(req.params.id),
        project_id: target?.project_id || null,
        project_slug: target?.project_slug || null,
        project_name: target?.project_title || null,
        from_status: target?.status || 'Pendiente',
        to_status: 'Retirada',
      },
    );

    res.json({ message: 'Aplicación retirada' });
  } catch (e) {
    next(e);
  }
}
