import { resend } from '../config/resend.js';
import { env } from '../config/env.js';

const from = () => `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM}>`;
const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

async function send(to, subject, html, replyTo) {
  try { await resend.emails.send({ from: from(), to, subject, html, replyTo }); }
  catch (e) { console.error('[email]', subject, e.message); }
}

const projectLinkHtml = (projectSlug) =>
  projectSlug
    ? `<p><a href="${escapeHtml(`${env.SITE_URL}/projects/${projectSlug}`)}">Ver proyecto</a></p>`
    : '';

const optionalDetailHtml = (label, value) =>
  value
    ? `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value).replace(/\n/g, '<br />')}</p>`
    : '';

const actionLinkHtml = (url, label) =>
  url
    ? `<p><a href="${escapeHtml(url)}">${escapeHtml(label)}</a></p>`
    : '';

function sendStandardCollaboratorEmail({
  email,
  subject,
  firstName,
  intro,
  details = [],
  actionUrl,
  actionLabel,
  closing = 'Si tienes dudas, comunícate con el equipo administrativo de DLAB.',
}) {
  const detailRows = details
    .filter((detail) => detail?.value)
    .map((detail) => optionalDetailHtml(detail.label, detail.value))
    .join('');

  return send(
    email,
    subject,
    `<p>Hola ${escapeHtml(firstName)},</p>
     <p>${intro}</p>
     ${detailRows}
     ${actionLinkHtml(actionUrl, actionLabel || 'Ver detalle')}
     <p>${escapeHtml(closing)}</p>`
  );
}

function sendStandardAdminEmail({
  emails,
  subject,
  intro,
  details = [],
  highlightedLabel,
  highlightedValue,
  actionUrl,
  actionLabel,
  replyTo,
}) {
  const detailRows = details
    .filter((detail) => detail?.value)
    .map((detail) => optionalDetailHtml(detail.label, detail.value))
    .join('');

  return send(
    emails,
    subject,
    `${highlightedValue ? `<p><strong>${escapeHtml(highlightedLabel || 'Registro')}:</strong> ${escapeHtml(highlightedValue)}</p>` : ''}
     <p>${intro}</p>
     ${detailRows}
     ${actionLinkHtml(actionUrl, actionLabel || 'Revisar')}
     <p>Este mensaje fue generado automáticamente por DLAB.</p>`,
    replyTo,
  );
}

function sendCollaboratorProjectUpdate({
  email,
  subject,
  firstName,
  projectTitle,
  projectSlug,
  intro,
  statusLabel,
  roleInProject,
  adminNotes,
  endReason,
}) {
  return send(
    email,
    subject,
    `<p>Hola ${escapeHtml(firstName)},</p>
     <p>${intro.replace('__PROJECT__', `<strong>${escapeHtml(projectTitle)}</strong>`)}</p>
     ${statusLabel ? `<p><strong>Estado:</strong> ${escapeHtml(statusLabel)}</p>` : ''}
     ${roleInProject ? `<p><strong>Rol:</strong> ${escapeHtml(roleInProject)}</p>` : ''}
     ${optionalDetailHtml('Notas administrativas', adminNotes)}
     ${optionalDetailHtml('Motivo', endReason)}
     ${projectLinkHtml(projectSlug)}
     <p>Si tienes dudas, comunícate con el equipo administrativo de DLAB.</p>`
  );
}

export const sendSignupReceived = ({
  firstName,
  lastName,
  to,
  personalEmail,
  usfqEmail,
  phoneNumber,
  dateOfBirth,
  major,
  currentUniversityYear,
  interestAreas,
  tagNames,
  motivationDescription,
  experienceDescription,
}) =>
  sendStandardCollaboratorEmail({
    email: to,
    subject: 'Recibimos tu solicitud a DLAB USFQ',
    firstName,
    intro: 'Recibimos tu solicitud y un administrador la revisará pronto. Por ahora tu cuenta está en revisión y aún no puede iniciar sesión.',
    details: [
      { label: 'Nombre', value: `${firstName} ${lastName}` },
      { label: 'Correo USFQ', value: usfqEmail },
      { label: 'Correo personal', value: personalEmail },
      { label: 'Teléfono', value: phoneNumber || 'No registrado' },
      { label: 'Fecha de nacimiento', value: dateOfBirth || 'No registrada' },
      { label: 'Carrera', value: major },
      { label: 'Semestre', value: currentUniversityYear },
      { label: 'Áreas de interés', value: interestAreas.length ? interestAreas.join(', ') : 'No registradas' },
      { label: 'Habilidades', value: tagNames.length ? tagNames.join(', ') : 'No registradas' },
      { label: 'Motivación', value: motivationDescription },
      { label: 'Experiencia previa', value: experienceDescription || null },
    ],
  });

export const sendActivationEmail = ({ firstName, email, activationUrl }) =>
  sendStandardCollaboratorEmail({
    email,
    subject: 'Activa tu cuenta en DLAB USFQ',
    firstName,
    intro: 'Tu solicitud fue aprobada. Activa tu cuenta institucional para poder iniciar sesión en la plataforma.',
    actionUrl: activationUrl,
    actionLabel: 'Activar cuenta',
    closing: 'Una vez activada, inicia sesión con tu correo institucional USFQ.',
  });

export const sendAdminNewRegistration = ({ firstName, lastName, email, major, currentUniversityYear, adminReviewUrl }, adminEmails) =>
  sendStandardAdminEmail({
    emails: adminEmails,
    subject: `Nueva solicitud de colaborador — ${firstName} ${lastName}`,
    highlightedLabel: 'Colaborador',
    highlightedValue: `${firstName} ${lastName}`,
    intro: 'Se recibió una nueva solicitud de colaborador en la plataforma.',
    details: [
      { label: 'Correo USFQ', value: email },
      { label: 'Carrera', value: major },
      { label: 'Año/Semestre', value: currentUniversityYear },
    ],
    actionUrl: adminReviewUrl,
    actionLabel: 'Revisar solicitud',
  });

export const sendCollaboratorApproved = ({ firstName, email, activationUrl }) =>
  sendStandardCollaboratorEmail({
    email,
    subject: '¡Fuiste aprobado en DLAB! Activa tu cuenta',
    firstName,
    intro: 'Tu solicitud fue aprobada. Ya puedes activar tu cuenta para ingresar a la plataforma.',
    actionUrl: activationUrl,
    actionLabel: 'Activar cuenta',
  });

export const sendCollaboratorRejected = ({ firstName, email, reason }) =>
  sendStandardCollaboratorEmail({
    email,
    subject: 'Actualización sobre tu solicitud a DLAB',
    firstName,
    intro: 'Lamentablemente tu solicitud no fue aprobada.',
    details: [{ label: 'Motivo', value: reason || null }],
  });

export const sendPasswordReset = ({ firstName, email, resetUrl, expiryMinutes }) =>
  sendStandardCollaboratorEmail({
    email,
    subject: 'Restablecer contraseña — DLAB USFQ',
    firstName,
    intro: 'Recibimos una solicitud para restablecer tu contraseña.',
    details: [{ label: 'Expiración', value: `${expiryMinutes} minutos` }],
    actionUrl: resetUrl,
    actionLabel: 'Restablecer contraseña',
    closing: 'Si no solicitaste este cambio, puedes ignorar este correo.',
  });

export const sendContactInquiry = ({ name, email, bannerCode, subject, message }, adminEmails) =>
  sendStandardAdminEmail({
    emails: adminEmails,
    subject: `Consulta de contacto — ${String(subject).replace(/\r?\n/g, ' ').trim()}`,
    highlightedLabel: 'Remitente',
    highlightedValue: name,
    intro: 'Se recibió una nueva consulta desde el formulario de contacto.',
    details: [
      { label: 'Correo USFQ', value: email },
      { label: 'Código banner', value: bannerCode },
      { label: 'Asunto', value: subject },
      { label: 'Mensaje', value: message },
    ],
    replyTo: email,
  });

export const sendAdminNewProjectApplication = ({
  collaboratorFirstName,
  collaboratorLastName,
  collaboratorEmail,
  projectTitle,
  projectSlug,
  reasonForApplying,
  adminReviewUrl,
}, adminEmails) =>
  sendStandardAdminEmail({
    emails: adminEmails,
    subject: `Nueva solicitud a proyecto — ${escapeHtml(projectTitle)}`,
    highlightedLabel: 'Proyecto',
    highlightedValue: projectTitle,
    intro: 'Se recibió una nueva solicitud de vinculación a proyecto.',
    details: [
      { label: 'Colaborador', value: `${collaboratorFirstName} ${collaboratorLastName}` },
      { label: 'Correo USFQ', value: collaboratorEmail },
      { label: 'Slug', value: projectSlug },
      { label: 'Motivo de postulación', value: reasonForApplying },
    ],
    actionUrl: adminReviewUrl,
    actionLabel: 'Revisar solicitudes pendientes',
  });

export const sendAdminManualLinkageCreated = ({
  collaboratorName,
  collaboratorEmail,
  projectTitle,
  projectSlug,
  reasonForLinking,
  roleInProject,
  actingAdminName,
  adminReviewUrl,
}, adminEmails) =>
  sendStandardAdminEmail({
    emails: adminEmails,
    subject: `Nueva vinculación manual — ${escapeHtml(projectTitle)}`,
    highlightedLabel: 'Proyecto',
    highlightedValue: projectTitle,
    intro: 'Se registró una vinculación manual en la plataforma.',
    details: [
      { label: 'Colaborador', value: collaboratorName },
      { label: 'Correo USFQ', value: collaboratorEmail },
      { label: 'Slug', value: projectSlug || '' },
      { label: 'Rol', value: roleInProject || 'Sin rol definido' },
      { label: 'Registrado por', value: actingAdminName || 'Administrador' },
      { label: 'Motivo de vinculación', value: reasonForLinking },
    ],
    actionUrl: adminReviewUrl,
    actionLabel: 'Revisar vinculaciones',
  });

export const sendCollaboratorManualLinkageCreated = ({
  firstName,
  email,
  projectTitle,
  projectSlug,
  roleInProject,
  adminNotes,
}) =>
  sendCollaboratorProjectUpdate({
    email,
    subject: `Has sido vinculado a un proyecto — ${escapeHtml(projectTitle)}`,
    firstName,
    projectTitle,
    projectSlug,
    intro: 'Un administrador registró tu vinculación al proyecto __PROJECT__.',
    statusLabel: 'Activo',
    roleInProject: roleInProject || 'Por definir',
    adminNotes,
  });

export const sendCollaboratorApplicationInReview = ({
  firstName,
  email,
  projectTitle,
  projectSlug,
  adminNotes,
}) =>
  sendCollaboratorProjectUpdate({
    email,
    subject: `Tu solicitud está en revisión — ${escapeHtml(projectTitle)}`,
    firstName,
    projectTitle,
    projectSlug,
    intro: 'Tu solicitud para el proyecto __PROJECT__ pasó a revisión.',
    statusLabel: 'En revisión',
    adminNotes,
  });

export const sendCollaboratorApplicationApproved = ({
  firstName,
  email,
  projectTitle,
  projectSlug,
  roleInProject,
  adminNotes,
}) =>
  sendCollaboratorProjectUpdate({
    email,
    subject: `Tu solicitud fue aprobada — ${escapeHtml(projectTitle)}`,
    firstName,
    projectTitle,
    projectSlug,
    intro: 'Tu solicitud para el proyecto __PROJECT__ fue aprobada.',
    statusLabel: 'Aprobada',
    roleInProject: roleInProject || 'Por definir',
    adminNotes,
  });

export const sendCollaboratorApplicationRejected = ({
  firstName,
  email,
  projectTitle,
  projectSlug,
  adminNotes,
}) =>
  sendCollaboratorProjectUpdate({
    email,
    subject: `Tu solicitud fue rechazada — ${escapeHtml(projectTitle)}`,
    firstName,
    projectTitle,
    projectSlug,
    intro: 'Tu solicitud para el proyecto __PROJECT__ fue rechazada.',
    statusLabel: 'Rechazada',
    endReason: adminNotes,
  });

export const sendCollaboratorApplicationWithdrawn = ({
  firstName,
  email,
  projectTitle,
  projectSlug,
  adminNotes,
}) =>
  sendCollaboratorProjectUpdate({
    email,
    subject: `Tu solicitud fue retirada — ${escapeHtml(projectTitle)}`,
    firstName,
    projectTitle,
    projectSlug,
    intro: 'Tu solicitud para el proyecto __PROJECT__ fue retirada.',
    statusLabel: 'Retirada',
    adminNotes,
  });

export const sendCollaboratorAssignmentPaused = ({
  firstName,
  email,
  projectTitle,
  projectSlug,
  endReason,
}) =>
  sendCollaboratorProjectUpdate({
    email,
    subject: `Tu vinculación fue pausada — ${escapeHtml(projectTitle)}`,
    firstName,
    projectTitle,
    projectSlug,
    intro: 'Tu vinculación al proyecto __PROJECT__ fue actualizada.',
    statusLabel: 'Pausado',
    endReason,
  });

export const sendCollaboratorAssignmentResumed = ({
  firstName,
  email,
  projectTitle,
  projectSlug,
  roleInProject,
}) =>
  sendCollaboratorProjectUpdate({
    email,
    subject: `Tu vinculación fue reactivada — ${escapeHtml(projectTitle)}`,
    firstName,
    projectTitle,
    projectSlug,
    intro: 'Tu vinculación al proyecto __PROJECT__ fue reactivada.',
    statusLabel: 'Activo',
    roleInProject: roleInProject || 'Por definir',
  });

export const sendCollaboratorAssignmentFinalized = ({
  firstName,
  email,
  projectTitle,
  projectSlug,
  endReason,
}) =>
  sendCollaboratorProjectUpdate({
    email,
    subject: `Tu vinculación finalizó — ${escapeHtml(projectTitle)}`,
    firstName,
    projectTitle,
    projectSlug,
    intro: 'Tu vinculación al proyecto __PROJECT__ finalizó.',
    statusLabel: 'Finalizado',
    endReason,
  });

export const sendCollaboratorAssignmentRemoved = ({
  firstName,
  email,
  projectTitle,
  projectSlug,
  endReason,
}) =>
  sendCollaboratorProjectUpdate({
    email,
    subject: `Tu vinculación fue removida — ${escapeHtml(projectTitle)}`,
    firstName,
    projectTitle,
    projectSlug,
    intro: 'Tu vinculación al proyecto __PROJECT__ fue removida por un administrador.',
    statusLabel: 'Removido',
    endReason,
  });

export const sendProjectMediaFailure = ({
  firstName,
  email,
  projectId,
  projectTitle,
  operation,
  stage,
}) =>
  sendStandardCollaboratorEmail({
    email,
    subject: `Advertencia de imagen en proyecto — ${escapeHtml(projectTitle)}`,
    firstName,
    intro: `El proyecto ${projectTitle} (ID ${projectId}) se guardó correctamente, pero la imagen principal no pudo aplicarse.`,
    details: [
      { label: 'Operación', value: operation },
      { label: 'Etapa fallida', value: stage },
      { label: 'Resultado', value: 'Se conservaron los cambios del proyecto y se limpió la referencia de imagen asociada a este intento.' },
    ],
    closing: 'Revisa el proyecto y vuelve a intentar la carga de la imagen si todavía la necesitas.',
  });

export const sendEventMediaFailure = ({
  firstName,
  email,
  eventId,
  eventTitle,
  operation,
  stage,
}) =>
  sendStandardCollaboratorEmail({
    email,
    subject: `Advertencia de multimedia en evento — ${escapeHtml(eventTitle)}`,
    firstName,
    intro: `El evento ${eventTitle} (ID ${eventId}) se guardó correctamente, pero uno de sus adjuntos no pudo aplicarse.`,
    details: [
      { label: 'Operación', value: operation },
      { label: 'Etapa fallida', value: stage },
      { label: 'Resultado', value: 'Se conservaron los cambios del evento y se limpió la referencia multimedia de este intento.' },
    ],
    closing: 'Revisa el evento y vuelve a intentar la carga del banner o del afiche si todavía lo necesitas.',
  });

export const sendAssignmentRemoved = ({
  firstName,
  to,
  projectTitle,
  projectSlug,
  endReason,
}) =>
  sendCollaboratorAssignmentRemoved({
    firstName,
    email: to,
    projectTitle,
    projectSlug,
    endReason,
  });
