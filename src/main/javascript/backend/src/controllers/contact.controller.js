import * as authQ from '../queries/auth.queries.js';
import * as emailService from '../services/email.service.js';

const errorResponse = (res, code, message, status) =>
  res.status(status).json({ success: false, error: { code, message } });

export async function submitInquiry(req, res, next) {
  try {
    const admins = await authQ.listActiveAdminEmails();
    if (admins.length === 0) {
      return errorResponse(res, 'NO_ADMIN_EMAILS', 'No hay administradores disponibles para recibir la consulta', 503);
    }

    await emailService.sendContactInquiry(
      {
        name: req.validated.name,
        email: req.validated.email,
        subject: req.validated.subject,
        message: req.validated.message,
      },
      admins,
    );

    res.status(201).json({ message: 'Consulta enviada' });
  } catch (e) {
    next(e);
  }
}
