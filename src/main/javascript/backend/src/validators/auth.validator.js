import { z } from 'zod';
import { isUsfqEmail, normalizeEmail } from '../utils/email.utils.js';
import { passwordPolicySchema } from './password.policy.js';

// DB limit references (db_init_ordered.sql):
//   collaborators.first_name        VARCHAR(100)
//   collaborators.middle_name       VARCHAR(100)
//   collaborators.last_name         VARCHAR(100)
//   collaborators.second_last_name  VARCHAR(100)
//   collaborators.personal_email    VARCHAR(255)
//   collaborators.usfq_email        VARCHAR(255)
//   collaborators.phone_number      VARCHAR(20)
//   collaborators.major             VARCHAR(150)
//   tags.name                       VARCHAR(100)
//   availability_slots.notes        VARCHAR(200)

const usfqEmailSchema = z.string({ required_error: 'El correo institucional es obligatorio', invalid_type_error: 'El correo institucional es obligatorio' })
  .min(1, 'El correo institucional es obligatorio')
  .max(255, 'Máximo 255 caracteres')
  .email('Correo electrónico inválido')
  .transform(normalizeEmail)
  .refine(isUsfqEmail, 'Debe usar un correo institucional USFQ');

const personalEmailSchema = z.string({ required_error: 'El correo personal es obligatorio', invalid_type_error: 'El correo personal es obligatorio' })
  .min(1, 'El correo personal es obligatorio')
  .max(255, 'Máximo 255 caracteres')
  .email('Correo electrónico inválido')
  .transform(normalizeEmail);

const dateOfBirthSchema = z.string({ required_error: 'La fecha de nacimiento es obligatoria', invalid_type_error: 'La fecha de nacimiento es obligatoria' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (formato AAAA-MM-DD)');

const dayEnumSchema = z.enum(
  ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
  { errorMap: () => ({ message: 'Día de la semana inválido' }) },
);

export const registerSchema = z.object({
  first_name: z.string({ required_error: 'El nombre es obligatorio', invalid_type_error: 'El nombre es obligatorio' })
    .min(1, 'El nombre es obligatorio')
    .max(100, 'Máximo 100 caracteres'),
  middle_name: z.string().max(100, 'Máximo 100 caracteres').optional().nullable(),
  last_name: z.string({ required_error: 'El apellido es obligatorio', invalid_type_error: 'El apellido es obligatorio' })
    .min(1, 'El apellido es obligatorio')
    .max(100, 'Máximo 100 caracteres'),
  second_last_name: z.string().max(100, 'Máximo 100 caracteres').optional().nullable(),
  personal_email: personalEmailSchema,
  usfq_email: usfqEmailSchema,
  phone_number: z.string({ required_error: 'El número de teléfono es obligatorio', invalid_type_error: 'El número de teléfono es obligatorio' })
    .min(7, 'El número de teléfono debe tener al menos 7 caracteres')
    .max(20, 'Máximo 20 caracteres'),
  date_of_birth: dateOfBirthSchema,
  major: z.string({ required_error: 'La carrera es obligatoria', invalid_type_error: 'La carrera es obligatoria' })
    .min(1, 'La carrera es obligatoria')
    .max(150, 'Máximo 150 caracteres'),
  current_university_year: z.coerce.number({ invalid_type_error: 'El año académico debe ser un número' })
    .int('El año académico debe ser un número entero')
    .min(1, 'El año académico debe ser al menos 1')
    .max(12, 'El año académico debe ser como máximo 12'),
  expected_graduation_year: z.coerce.number({ invalid_type_error: 'El año de graduación debe ser un número' })
    .int('El año de graduación debe ser un número entero'),
  motivation_description: z.string({ required_error: 'La motivación es obligatoria', invalid_type_error: 'La motivación es obligatoria' })
    .min(50, 'La motivación debe tener al menos 50 caracteres'),
  experience_description: z.string().optional().nullable(),
  interest_in_machinery: z.boolean({ required_error: 'Indica si tienes interés en maquinaria', invalid_type_error: 'Indica si tienes interés en maquinaria' }),
  interest_in_design: z.boolean({ required_error: 'Indica si tienes interés en diseño', invalid_type_error: 'Indica si tienes interés en diseño' }),
  interest_in_materials: z.boolean({ required_error: 'Indica si tienes interés en materiales', invalid_type_error: 'Indica si tienes interés en materiales' }),
  tag_names: z.array(
    z.string()
      .min(2, 'El nombre de la etiqueta debe tener al menos 2 caracteres')
      .max(50, 'El nombre de la etiqueta debe tener como máximo 50 caracteres'),
  ).min(1, 'Debes seleccionar al menos una etiqueta'),
  availability_slots: z.array(z.object({
    day_of_week: dayEnumSchema,
    time_from: z.string({ required_error: 'La hora de inicio es obligatoria', invalid_type_error: 'La hora de inicio es obligatoria' })
      .min(1, 'La hora de inicio es obligatoria'),
    time_to: z.string({ required_error: 'La hora de fin es obligatoria', invalid_type_error: 'La hora de fin es obligatoria' })
      .min(1, 'La hora de fin es obligatoria'),
    notes: z.string().max(200, 'Máximo 200 caracteres').optional(),
  })).min(1, 'Debes registrar al menos una franja de disponibilidad'),
});

export const activateSchema = z.object({
  token: z.string({ required_error: 'El token es obligatorio', invalid_type_error: 'El token es obligatorio' })
    .min(1, 'El token es obligatorio'),
  password: passwordPolicySchema,
});

export const loginSchema = z.object({
  email: usfqEmailSchema,
  password: z.string({ required_error: 'La contraseña es obligatoria', invalid_type_error: 'La contraseña es obligatoria' })
    .min(1, 'La contraseña es obligatoria'),
});

export const forgotPasswordSchema = z.object({
  email: usfqEmailSchema,
});

export const adminPasswordResetRequestSchema = z.object({
  administrator_id: z.coerce.number({ required_error: 'El administrador es obligatorio', invalid_type_error: 'El administrador es obligatorio' })
    .int('El administrador es inválido')
    .positive('El administrador es inválido'),
});

export const resetPasswordSchema = z.object({
  token: z.string({ required_error: 'El token es obligatorio', invalid_type_error: 'El token es obligatorio' })
    .min(1, 'El token es obligatorio'),
  new_password: passwordPolicySchema,
  confirm: z.string({ required_error: 'Debes confirmar la contraseña', invalid_type_error: 'Debes confirmar la contraseña' }),
}).refine((d) => d.new_password === d.confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm'],
});
