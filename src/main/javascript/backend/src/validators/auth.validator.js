import { z } from 'zod';
import { isUsfqEmail, normalizeEmail } from '../utils/email.utils.js';
import { passwordPolicySchema } from './password.policy.js';

const usfqEmailSchema = z.string().email().transform(normalizeEmail).refine(isUsfqEmail, 'Debe usar un correo institucional USFQ');
const emailSchema = z.string().email().transform(normalizeEmail);

export const registerSchema = z.object({
  first_name: z.string().min(1).max(100),
  middle_name: z.string().max(100).optional().nullable(),
  last_name: z.string().min(1).max(100),
  second_last_name: z.string().max(100).optional().nullable(),
  personal_email: emailSchema,
  usfq_email: usfqEmailSchema,
  phone_number: z.string().min(7).max(20),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha invalida'),
  major: z.string().min(1).max(150),
  current_university_year: z.coerce.number().int().min(1).max(12),
  expected_graduation_year: z.coerce.number().int(),
  motivation_description: z.string().min(50),
  experience_description: z.string().optional().nullable(),
  interest_in_machinery: z.boolean(),
  interest_in_design: z.boolean(),
  interest_in_materials: z.boolean(),
  tag_names: z.array(z.string().min(2).max(50)).min(1),
  availability_slots: z.array(z.object({
    day_of_week: z.enum(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']),
    time_from: z.string(),
    time_to: z.string(),
    notes: z.string().optional()
  })).min(1),
});

export const activateSchema = z.object({
  token: z.string().min(1),
  password: passwordPolicySchema,
});

export const loginSchema = z.object({
  email: usfqEmailSchema,
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: usfqEmailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  new_password: passwordPolicySchema,
  confirm: z.string(),
}).refine((d) => d.new_password === d.confirm, { message: 'Passwords must match', path: ['confirm'] });
