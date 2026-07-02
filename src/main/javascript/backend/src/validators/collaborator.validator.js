import { z } from 'zod';

// DB limit references (db_init_ordered.sql, collaborators table):
//   first_name        VARCHAR(100)
//   middle_name       VARCHAR(100)
//   last_name         VARCHAR(100)
//   second_last_name  VARCHAR(100)
//   personal_email    VARCHAR(255)
//   usfq_email        VARCHAR(255)
//   phone_number      VARCHAR(20)
//   major             VARCHAR(150)
//   intake_source     VARCHAR(100)
// availability_slots.notes      VARCHAR(200)

const dayEnumSchema = z.enum(
  ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
  { errorMap: () => ({ message: 'Día de la semana inválido' }) },
);

const trajectoryStatusSchema = z.enum(
  ['Nuevo', 'En_Revisión', 'Contactado', 'Vinculado', 'Inactivo'],
  { errorMap: () => ({ message: 'Estado de trayectoria inválido' }) },
);

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio').max(100, 'Máximo 100 caracteres').optional().nullable(),
  middleName: z.string().max(100, 'Máximo 100 caracteres').optional().nullable(),
  lastName: z.string().min(1, 'El apellido es obligatorio').max(100, 'Máximo 100 caracteres').optional().nullable(),
  secondLastName: z.string().max(100, 'Máximo 100 caracteres').optional().nullable(),
  personalEmail: z.string().max(255, 'Máximo 255 caracteres').email('Correo electrónico inválido').optional().nullable(),
  usfqEmail: z.string().max(255, 'Máximo 255 caracteres').email('Correo electrónico inválido').optional().nullable(),
  phoneNumber: z.string().max(20, 'Máximo 20 caracteres').optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  major: z.string().min(1, 'La carrera es obligatoria').max(150, 'Máximo 150 caracteres').optional().nullable(),
  currentUniversityYear: z.number({ invalid_type_error: 'El año académico debe ser un número' })
    .int('El año académico debe ser un número entero')
    .min(1, 'El año académico debe ser al menos 1')
    .max(12, 'El año académico debe ser como máximo 12')
    .optional().nullable(),
  expectedGraduationYear: z.number({ invalid_type_error: 'El año de graduación debe ser un número' })
    .int('El año de graduación debe ser un número entero')
    .optional().nullable(),
  experienceDescription: z.string().optional().nullable(),
  motivationDescription: z.string().optional().nullable(),
  interestInMachinery: z.preprocess((v) => v === 1 || v === true, z.boolean({ invalid_type_error: 'Indica si tienes interés en maquinaria' })).optional().nullable(),
  interestInDesign: z.preprocess((v) => v === 1 || v === true, z.boolean({ invalid_type_error: 'Indica si tienes interés en diseño' })).optional().nullable(),
  interestInMaterials: z.preprocess((v) => v === 1 || v === true, z.boolean({ invalid_type_error: 'Indica si tienes interés en materiales' })).optional().nullable(),
  tag_ids: z.array(
    z.number({ invalid_type_error: 'Etiqueta inválida' })
      .int('Etiqueta inválida')
      .positive('Etiqueta inválida'),
  ).optional(),
});

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const timeSchema = z.string({ required_error: 'La hora es obligatoria', invalid_type_error: 'La hora es obligatoria' })
  .regex(timeRegex, 'Debe tener el formato HH:MM')
  .transform((value) => value.slice(0, 5));

export const updateAvailabilitySchema = z.object({
  slots: z.array(z.object({
    day_of_week: dayEnumSchema,
    time_from: timeSchema,
    time_to: timeSchema,
    notes: z.string().max(200, 'Máximo 200 caracteres').optional(),
  })),
});

export const collaboratorStatusSchema = z.object({
  status: trajectoryStatusSchema,
});

export const collaboratorNoteSchema = z.object({
  note: z.string({ required_error: 'La nota es obligatoria', invalid_type_error: 'La nota es obligatoria' })
    .min(1, 'La nota es obligatoria')
    .max(2000, 'Máximo 2000 caracteres'),
});

export const rejectCollaboratorSchema = z.object({
  reason: z.string().max(2000, 'Máximo 2000 caracteres').optional().nullable(),
});

export const adminCollaboratorSchema = z.object({
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
  usfqEmail: z.string()
    .max(255, 'Máximo 255 caracteres')
    .email('Correo electrónico inválido')
    .optional()
    .nullable(),
  phoneNumber: z.string().max(20, 'Máximo 20 caracteres').optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  passwordHash: z.string().min(20, 'El hash de contraseña debe tener al menos 20 caracteres').optional().nullable(),
  major: z.string({ required_error: 'La carrera es obligatoria', invalid_type_error: 'La carrera es obligatoria' })
    .min(1, 'La carrera es obligatoria')
    .max(150, 'Máximo 150 caracteres'),
  currentUniversityYear: z.number({ invalid_type_error: 'El año académico debe ser un número' })
    .int('El año académico debe ser un número entero')
    .min(1, 'El año académico debe ser al menos 1')
    .max(12, 'El año académico debe ser como máximo 12'),
  expectedGraduationYear: z.number({ invalid_type_error: 'El año de graduación debe ser un número' })
    .int('El año de graduación debe ser un número entero')
    .min(2000, 'El año de graduación debe ser mayor o igual a 2000'),
  experienceDescription: z.string().optional().nullable(),
  motivationDescription: z.string().optional().nullable(),
  interestInMachinery: z.boolean({ required_error: 'Indica si tiene interés en maquinaria', invalid_type_error: 'Indica si tiene interés en maquinaria' }),
  interestInDesign: z.boolean({ required_error: 'Indica si tiene interés en diseño', invalid_type_error: 'Indica si tiene interés en diseño' }),
  interestInMaterials: z.boolean({ required_error: 'Indica si tiene interés en materiales', invalid_type_error: 'Indica si tiene interés en materiales' }),
  trajectoryStatus: trajectoryStatusSchema,
  isActive: z.boolean({ invalid_type_error: 'El estado activo debe ser verdadero o falso' }),
  profileComplete: z.boolean({ invalid_type_error: 'El estado de perfil completo debe ser verdadero o falso' }),
  intakeSource: z.string().max(100, 'Máximo 100 caracteres').optional().nullable(),
});

export const collaboratorActiveSchema = z.object({
  is_active: z.boolean({ required_error: 'El estado activo es obligatorio', invalid_type_error: 'El estado activo debe ser verdadero o falso' }),
});
