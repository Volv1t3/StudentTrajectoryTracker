import { z } from 'zod';

export const submitApplicationSchema = z.object({
  project_id: z.number().int().positive(),
  reason_for_applying: z.string().min(20).max(2000),
});

export const reviewApplicationSchema = z.object({
  status: z.enum(['En_Revisión', 'Aprobada', 'Rechazada', 'Retirada']),
  admin_notes: z.string().max(2000).optional(),
  role_in_project: z.string().optional(),
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
  collaborator_id: z.number().int().positive(),
  project_id: z.number().int().positive(),
  reason_for_linking: z.string().min(20).max(2000),
  role_in_project: z.string().optional(),
  admin_notes: z.string().max(2000).optional(),
});

export const endAssignmentSchema = z.object({
  end_status: z.enum(['Pausado', 'Finalizado', 'Removido']),
  end_reason: z.string().max(300).optional(),
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
  role_in_project: z.string().optional(),
  status: z.enum(['Activo', 'Pausado', 'Finalizado', 'Removido']).optional(),
  end_reason: z.string().max(300).optional(),
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
