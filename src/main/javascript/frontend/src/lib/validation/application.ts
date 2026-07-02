/**
 * application.ts — validation for project applications and admin linkage
 * (assignment) flows.
 *
 * Authority:
 *   - Backend Zod: `backend/src/validators/application.validator.js`
 *       submitApplicationSchema:    reason_for_applying 20..2000
 *       reviewApplicationSchema:    status enum; admin_notes ≤ 2000;
 *                                   admin_notes required when status=Rechazada
 *       createAssignmentSchema:     reason_for_linking 20..2000
 *       endAssignmentSchema:        end_reason required when status in
 *                                   {Finalizado, Removido}; end_reason ≤ 300
 *       updateAssignmentSchema:     similar end-reason rule
 *   - DB: assignments.role_in_project VARCHAR(150); end_reason VARCHAR(300)
 */

import {
  composeValidators,
  enumOf,
  maxLength,
  minLength,
  optional,
  positiveInt,
  required,
  validateForm,
  type FormErrors,
  type FormSchema,
  type Validator,
} from './core.js';

export const APPLICATION_LIMITS = Object.freeze({
  reason_for_applying: { min: 20, max: 2000 },
  reason_for_linking: { min: 20, max: 2000 },
  admin_notes: { max: 2000 },
  role_in_project: { max: 150 },
  end_reason: { max: 300 },
});

export const APPLICATION_REVIEW_STATUSES = ['En_Revisión', 'Aprobada', 'Rechazada'] as const;
export const ASSIGNMENT_END_STATUSES = ['Pausado', 'Finalizado', 'Removido'] as const;
export const ASSIGNMENT_STATUSES = ['Activo', 'Pausado', 'Finalizado', 'Removido'] as const;

// ---------------------------------------------------------------------------
// Field-level
// ---------------------------------------------------------------------------

export const validateReasonForApplying: Validator<unknown> = composeValidators(
  required('El motivo de aplicación es obligatorio'),
  minLength(APPLICATION_LIMITS.reason_for_applying.min),
  maxLength(APPLICATION_LIMITS.reason_for_applying.max)
);

export const validateReasonForLinking: Validator<unknown> = composeValidators(
  required('El motivo de vinculación es obligatorio'),
  minLength(APPLICATION_LIMITS.reason_for_linking.min),
  maxLength(APPLICATION_LIMITS.reason_for_linking.max)
);

export const validateAdminNotes: Validator<unknown> = optional(
  maxLength(APPLICATION_LIMITS.admin_notes.max)
);

export const validateRoleInProject: Validator<unknown> = optional(
  maxLength(APPLICATION_LIMITS.role_in_project.max)
);

export const validateEndReason: Validator<unknown> = optional(
  maxLength(APPLICATION_LIMITS.end_reason.max)
);

export const validateProjectId: Validator<unknown> = composeValidators(
  required('Proyecto requerido'),
  positiveInt('Proyecto inválido')
);

export const validateCollaboratorId: Validator<unknown> = composeValidators(
  required('Colaborador requerido'),
  positiveInt('Colaborador inválido')
);

export const validateReviewStatus: Validator<unknown> = composeValidators(
  required('Estado requerido'),
  enumOf(APPLICATION_REVIEW_STATUSES)
);

export const validateAssignmentEndStatus: Validator<unknown> = composeValidators(
  required('Estado de cierre requerido'),
  enumOf(ASSIGNMENT_END_STATUSES)
);

export const validateAssignmentStatus: Validator<unknown> = optional(enumOf(ASSIGNMENT_STATUSES));

// ---------------------------------------------------------------------------
// Submit application
// ---------------------------------------------------------------------------

export interface SubmitApplicationFormValues {
  project_id: number;
  reason_for_applying: string;
}

export const submitApplicationSchema: FormSchema<SubmitApplicationFormValues> = {
  project_id: validateProjectId,
  reason_for_applying: validateReasonForApplying,
};

export function validateSubmitApplicationForm(
  values: SubmitApplicationFormValues
): FormErrors<SubmitApplicationFormValues> {
  return validateForm(values, submitApplicationSchema);
}

// ---------------------------------------------------------------------------
// Review application
// ---------------------------------------------------------------------------

export interface ReviewApplicationFormValues {
  status: string;
  admin_notes?: string;
  role_in_project?: string;
}

export const reviewApplicationSchema: FormSchema<ReviewApplicationFormValues> = {
  status: validateReviewStatus,
  admin_notes: validateAdminNotes,
  role_in_project: validateRoleInProject,
};

export function validateReviewApplicationForm(
  values: ReviewApplicationFormValues
): FormErrors<ReviewApplicationFormValues> {
  const errors = validateForm(values, reviewApplicationSchema);
  if (values.status === 'Rechazada' && (!values.admin_notes || !values.admin_notes.trim())) {
    errors.admin_notes = 'El motivo de rechazo es obligatorio si se rechazará una aplicación, y opcional al aprobar';
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Create assignment (linkage)
// ---------------------------------------------------------------------------

export interface CreateAssignmentFormValues {
  collaborator_id: number;
  project_id: number;
  reason_for_linking: string;
  role_in_project?: string;
  admin_notes?: string;
}

export const createAssignmentSchema: FormSchema<CreateAssignmentFormValues> = {
  collaborator_id: validateCollaboratorId,
  project_id: validateProjectId,
  reason_for_linking: validateReasonForLinking,
  role_in_project: validateRoleInProject,
  admin_notes: validateAdminNotes,
};

export function validateCreateAssignmentForm(
  values: CreateAssignmentFormValues
): FormErrors<CreateAssignmentFormValues> {
  return validateForm(values, createAssignmentSchema);
}

// ---------------------------------------------------------------------------
// End assignment
// ---------------------------------------------------------------------------

export interface EndAssignmentFormValues {
  end_status: string;
  end_reason?: string;
}

export const endAssignmentSchema: FormSchema<EndAssignmentFormValues> = {
  end_status: validateAssignmentEndStatus,
  end_reason: validateEndReason,
};

export function validateEndAssignmentForm(
  values: EndAssignmentFormValues
): FormErrors<EndAssignmentFormValues> {
  const errors = validateForm(values, endAssignmentSchema);
  if (
    ['Finalizado', 'Removido'].includes(values.end_status) &&
    (!values.end_reason || !values.end_reason.trim())
  ) {
    errors.end_reason = 'El motivo de cierre es obligatorio';
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Update assignment
// ---------------------------------------------------------------------------

export interface UpdateAssignmentFormValues {
  role_in_project?: string;
  status?: string;
  end_reason?: string;
}

export const updateAssignmentSchema: FormSchema<UpdateAssignmentFormValues> = {
  role_in_project: validateRoleInProject,
  status: validateAssignmentStatus,
  end_reason: validateEndReason,
};

export function validateUpdateAssignmentForm(
  values: UpdateAssignmentFormValues
): FormErrors<UpdateAssignmentFormValues> {
  const errors = validateForm(values, updateAssignmentSchema);
  const hasAny =
    (values.role_in_project && values.role_in_project.trim()) ||
    (values.status && values.status.trim()) ||
    (values.end_reason && values.end_reason.trim());
  if (!hasAny) {
    errors.status = 'Debes enviar al menos un campo para actualizar la vinculación';
  } else if (
    ['Finalizado', 'Removido'].includes(values.status ?? '') &&
    (!values.end_reason || !values.end_reason.trim())
  ) {
    errors.end_reason = 'El motivo de cierre es obligatorio';
  }
  return errors;
}
