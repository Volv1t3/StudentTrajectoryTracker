import { z } from 'zod';
import { passwordPolicySchema } from './password.policy.js';

export const adminAdministratorSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1),
  secondLastName: z.string().optional().nullable(),
  personalEmail: z.string().email(),
  usfqEmail: z.string().email(),
  phoneNumber: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  password: passwordPolicySchema.optional().nullable(),
  isActive: z.boolean().optional(),
});
