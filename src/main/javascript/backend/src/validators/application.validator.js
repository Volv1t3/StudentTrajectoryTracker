import { z } from 'zod';

// DB limit references (db_init_ordered.sql):
//   assignments.end_reason     VARCHAR(300)
//   assignments.role_in_project VARCHAR(150)
//   applications.reason_for_applying TEXT (no DB length, app-level 2000)
//   applications.admin_notes        TEXT

const reasonForApplyingSchema = z.string({ required_error: 'El motivo de postulación es obligatorio', invalid_type_error: 'El motivo de postulación es obligatorio' })
  .min(20, 'El motivo debe tener al menos 20 caracteres')
  .max(2000, 'Máximo 2000 caracteres');

const adminNotesSchema = z.string()
  .max(2000, 'Máximo 2000 caracteres')
  .optional();

const reasonForLinkingSchema = z.string({ required_error: 'El motivo de vinculación es obligatorio', invalid_type_error: 'El motivo de vinculación es obligatorio' })
  .min(20, 'El motivo de vinculación debe tener al menos 20 caracteres')
  .max(2000, 'Máximo 2000 caracteres');

const endReasonSchema = z.string()
  .max(300, 'Máximo 300 caracteres')
  .optional();

const applicationStatusSchema = z.enum(
  ['En_Revisión', 'Aprobada', 'Rechazada'],
  { errorMap: () => ({ message: 'Estado inválido. Opciones permitidas: En_Revisión, Aprobada, Rechazada' }) },
);

const assignmentEndStatusSchema = z.enum(
  ['Pausado', 'Finalizado', 'Removido'],
  { errorMap: () => ({ message: 'Estado de cierre inválido. Opciones permitidas: Pausado, Finalizado, Removido' }) },
);

const assignmentStatusSchema = z.enum(
  ['Activo', 'Pausado', 'Finalizado', 'Removido'],
  { errorMap: () => ({ message: 'Estado de vinculación inválido. Opciones permitidas: Activo, Pausado, Finalizado, Removido' }) },
);

export const submitApplicationSchema = z.object({
  project_id: z.number({ required_error: 'El proyecto es obligatorio', invalid_type_error: 'El proyecto es obligatorio' })
    .int('El proyecto debe ser un número entero')
    .positive('El proyecto debe ser un número positivo'),
  reason_for_applying: reasonForApplyingSchema,
});

export const reviewApplicationSchema = z.object({
  status: applicationStatusSchema,
  admin_notes: adminNotesSchema,
  role_in_project: z.string().max(150, 'Máximo 150 caracteres').optional(),
}).superRefine((data, ctx) => {
  if (data.status === 'Rechazada' && !data.admin_notes?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['admin_notes'],
      message: 'El motivo de rechazo es obligatorio',
    });
  }
});

export const createAssignmentSchema = z.object({
  collaborator_id: z.number({ required_error: 'El colaborador es obligatorio', invalid_type_error: 'El colaborador es obligatorio' })
    .int('El colaborador debe ser un número entero')
    .positive('El colaborador debe ser un número positivo'),
  project_id: z.number({ required_error: 'El proyecto es obligatorio', invalid_type_error: 'El proyecto es obligatorio' })
    .int('El proyecto debe ser un número entero')
    .positive('El proyecto debe ser un número positivo'),
  reason_for_linking: reasonForLinkingSchema,
  role_in_project: z.string().max(150, 'Máximo 150 caracteres').optional(),
  admin_notes: adminNotesSchema,
});

export const endAssignmentSchema = z.object({
  end_status: assignmentEndStatusSchema,
  end_reason: endReasonSchema,
}).superRefine((data, ctx) => {
  if (['Finalizado', 'Removido'].includes(data.end_status) && !data.end_reason?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['end_reason'],
      message: 'El motivo de cierre es obligatorio',
    });
  }
});

export const updateAssignmentSchema = z.object({
  role_in_project: z.string().max(150, 'Máximo 150 caracteres').optional(),
  status: assignmentStatusSchema.optional(),
  end_reason: endReasonSchema,
}).superRefine((data, ctx) => {
  if (!data.role_in_project && !data.status && !data.end_reason) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Debes enviar al menos un campo para actualizar la vinculación',
    });
  }

  if (['Finalizado', 'Removido'].includes(data.status || '') && !data.end_reason?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['end_reason'],
      message: 'El motivo de cierre es obligatorio',
    });
  }
});
