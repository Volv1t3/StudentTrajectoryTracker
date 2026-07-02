import { env } from '../config/env.js';
import * as collaboratorQ from '../queries/collaborator.queries.js';
import * as administratorQ from '../queries/administrator.queries.js';
import * as authQ from '../queries/auth.queries.js';
import * as authService from '../services/auth.service.js';
import * as emailService from '../services/email.service.js';
import * as analytics from '../services/analytics.service.js';
import { ensureTagIdsForNames } from '../services/tag.service.js';
import { signAccessToken, signRefreshToken } from '../utils/jwt.utils.js';
import { createHmac } from 'crypto';

const errorResponse = (res, code, message, status) =>
  res.status(status).json({ success: false, error: { code, message } });

const COOKIE = 'dlab_refresh';
const cookieOpts = { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 };
const hashToken = (t) => createHmac('sha256', env.JWT_REFRESH_SECRET).update(t).digest('hex');
const uniqueEmails = (...emails) => [...new Set(emails.flat().filter(Boolean))];

export async function register(req, res, next) {
  try {
    const d = req.validated;
    const tagIds = await ensureTagIdsForNames(d.tag_names || []);
    const interestAreas = [];
    if (d.interest_in_machinery) interestAreas.push('Maquinaria');
    if (d.interest_in_design) interestAreas.push('Diseño');
    if (d.interest_in_materials) interestAreas.push('Materiales');

    const registrationData = {
      firstName: d.first_name,
      middleName: d.middle_name || null,
      lastName: d.last_name,
      secondLastName: d.second_last_name || null,
      personalEmail: d.personal_email,
      usfqEmail: d.usfq_email,
      phoneNumber: d.phone_number,
      dateOfBirth: d.date_of_birth,
      major: d.major,
      currentUniversityYear: d.current_university_year,
      expectedGraduationYear: d.expected_graduation_year,
      experienceDescription: d.experience_description || null,
      motivationDescription: d.motivation_description,
      interestInMachinery: d.interest_in_machinery,
      interestInDesign: d.interest_in_design,
      interestInMaterials: d.interest_in_materials,
      intakeSource: 'signup_form',
      tagIds,
      availabilitySlots: d.availability_slots
    };

    const id = await collaboratorQ.register(registrationData);
    const adminEmails = await authQ.listActiveAdminEmails();
    const reviewUrl = `${env.SITE_URL}/admin/colaboradores/${id}`;
    const recipientEmails = uniqueEmails(d.usfq_email, d.personal_email);

    // Analytics: emit AFTER successful persistence. Failures are isolated.
    const collaboratorDistinctId = analytics.distinctIdForCollaborator(id);
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

export async function activate(req, res, next) {
  try {
    const { token, password } = req.validated;
    const records = await authQ.findActivationToken(createHmac('sha256', env.ACTIVATION_TOKEN_SECRET).update(token).digest('hex'));
    if (!records) return errorResponse(res, 'INVALID_TOKEN', 'Token inválido o expirado', 400);
    const hash = await authService.hashPassword(password);
    await collaboratorQ.updatePassword(records.collaborator_id, hash);
    await authQ.markActivationTokenUsed(records.token_hash);

    // Analytics: emit AFTER successful activation persistence.
    analytics.capture(
      analytics.distinctIdForCollaborator(records.collaborator_id),
      'account_activated',
      {
        source: 'backend',
        distinct_role: 'collaborator',
      },
    );

    res.json({ message: 'Cuenta activada' });
  } catch (e) {
    next(e);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.validated;
    const user = await collaboratorQ.findByEmail(email);
    if (!user || !user.password_hash) return errorResponse(res, 'AUTH_FAILED', 'Credenciales inválidas', 401);
    if (!await authService.comparePassword(password, user.password_hash)) return errorResponse(res, 'AUTH_FAILED', 'Credenciales inválidas', 401);
    if (!user.is_active) return errorResponse(res, 'INACTIVE', 'Cuenta inactiva', 403);
    const payload = { sub: user.id, role: 'collaborator' };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await authQ.storeRefreshToken({ userType: 'Colaborador', userId: user.id, tokenHash: hashToken(refreshToken), expiresAt: new Date(Date.now() + 7 * 86400000), userAgent: req.headers['user-agent'], ipAddress: req.ip });
    res.cookie(COOKIE, refreshToken, cookieOpts);
    res.json({ access_token: accessToken, user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.usfq_email } });
  } catch (e) {
    next(e);
  }
}

export async function logout(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE];
    if (token) { await authQ.revokeToken(hashToken(token)); res.clearCookie(COOKIE, cookieOpts); }
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE];
    if (!token) return errorResponse(res, 'NO_TOKEN', 'No refresh token', 401);
    const tokenHash = hashToken(token);
    const stored = await authQ.findRefreshToken(tokenHash);
    if (!stored || stored.user_type !== 'Colaborador') {
      return errorResponse(res, 'INVALID_TOKEN', 'Token inválido', 401);
    }
    await authQ.revokeToken(tokenHash);
    const payload = { sub: stored.user_id, role: 'collaborator' };
    const newRefresh = signRefreshToken(payload);
    await authQ.storeRefreshToken({ userType: 'Colaborador', userId: stored.user_id, tokenHash: hashToken(newRefresh), expiresAt: new Date(Date.now() + 7 * 86400000), userAgent: req.headers['user-agent'], ipAddress: req.ip });
    res.cookie(COOKIE, newRefresh, cookieOpts);
    res.json({ access_token: signAccessToken(payload) });
  } catch (e) {
    next(e);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.validated;
    const user = await collaboratorQ.findByEmail(email);
    if (user && user.is_active && user.password_hash) {
      const { token, hash } = authService.generateResetToken();
      await authQ.storeResetToken({
        collaboratorId: user.id,
        administratorId: null,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + env.RESET_TOKEN_TTL_M * 60000)
      });
      emailService.sendPasswordReset({
        firstName: user.first_name,
        email: user.usfq_email,
        resetUrl: `${env.SITE_URL}/forgot-password?token=${encodeURIComponent(token)}`,
        expiryMinutes: env.RESET_TOKEN_TTL_M,
      });
    }
    res.json({ message: 'Si el correo existe, recibirás instrucciones' });
  } catch (e) {
    next(e);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, new_password } = req.validated;
    const h = createHmac('sha256', env.RESET_TOKEN_SECRET).update(token).digest('hex');
    const record = await authQ.findResetToken(h);
    if (!record) return errorResponse(res, 'INVALID_TOKEN', 'Token inválido o expirado', 400);
    const hash = await authService.hashPassword(new_password);

    if (record.collaborator_id) {
      await collaboratorQ.updatePassword(record.collaborator_id, hash);
      await authQ.revokeAllUserTokens('Colaborador', record.collaborator_id);
    } else if (record.administrator_id) {
      await administratorQ.updatePassword(record.administrator_id, hash);
      await authQ.revokeAllUserTokens('Administrador', record.administrator_id);
    } else {
      return errorResponse(res, 'INVALID_TOKEN', 'Token inválido o expirado', 400);
    }

    await authQ.markResetTokenUsed(h);
    res.json({ message: 'Contraseña actualizada' });
  } catch (e) {
    next(e);
  }
}
