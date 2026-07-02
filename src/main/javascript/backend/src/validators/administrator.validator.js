import { z } from 'zod';
import { passwordPolicySchema } from './password.policy.js';

// DB limit references (db_init_ordered.sql, administrators table):
//   first_name        VARCHAR(100)
//   middle_name       VARCHAR(100)
//   last_name         VARCHAR(100)
//   second_last_name  VARCHAR(100)
//   personal_email    VARCHAR(255)
//   usfq_email        VARCHAR(255)
//   phone_number      VARCHAR(20)

export const adminAdministratorSchema = z.object({
  firstName: z.string({ required_error: 'El nombre es obligatorio', invalid_type_error: 'El nombre es obligatorio' })
    .min(1, 'El nombre es obligatorio')
    .max(100, 'Máximo 100 caracteres'),
  middleName: z.string().max(100, 'Máximo 100 caracteres').optional().nullable(),
  lastName: z.string({ required_error: 'El apellido es obligatorio', invalid_type_error: 'El apellido es obligatorio' })
    .min(1, 'El apellido es obligatorio')
    .max(100, 'Máximo 100 caracteres'),
  secondLastName: z.string().max(100, 'Máximo 100 caracteres').optional().nullable(),
  personalEmail: z.string({ required_error: 'El correo personal es obligatorio', invalid_type_error: 'El correo personal es obligatorio' })
    .min(1, 'El correo personal es obligatorio')
    .max(255, 'Máximo 255 caracteres')
    .email('Correo electrónico inválido'),
  usfqEmail: z.string({ required_error: 'El correo institucional es obligatorio', invalid_type_error: 'El correo institucional es obligatorio' })
    .min(1, 'El correo institucional es obligatorio')
    .max(255, 'Máximo 255 caracteres')
    .email('Correo electrónico inválido'),
  phoneNumber: z.string().max(20, 'Máximo 20 caracteres').optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  password: passwordPolicySchema.optional().nullable(),
  isActive: z.boolean({ invalid_type_error: 'El estado activo debe ser verdadero o falso' }).optional(),
});
