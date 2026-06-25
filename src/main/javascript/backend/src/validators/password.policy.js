import { z } from 'zod';

export const PASSWORD_POLICY_HINT = 'La contraseña debe tener al menos 12 caracteres, 1 mayúscula y 2 números';

export function validatePasswordPolicy(value) {
  if (typeof value !== 'string' || value.length < 12) {
    return PASSWORD_POLICY_HINT;
  }

  if (!/[A-ZÁÉÍÓÚÑ]/.test(value)) {
    return PASSWORD_POLICY_HINT;
  }

  const digitMatches = value.match(/\d/g) || [];
  if (digitMatches.length < 2) {
    return PASSWORD_POLICY_HINT;
  }

  return null;
}

export const passwordPolicySchema = z.string().superRefine((value, ctx) => {
  const error = validatePasswordPolicy(value);
  if (error) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: error,
    });
  }
});
