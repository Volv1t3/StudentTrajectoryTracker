import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional().nullable(),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1).optional().nullable(),
  secondLastName: z.string().optional().nullable(),
  personalEmail: z.string().email().optional().nullable(),
  usfqEmail: z.string().email().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  major: z.string().min(1).optional().nullable(),
  currentUniversityYear: z.number().int().min(1).max(6).optional().nullable(),
  expectedGraduationYear: z.number().int().optional().nullable(),
  experienceDescription: z.string().optional().nullable(),
  motivationDescription: z.string().optional().nullable(),
  interestInMachinery: z.preprocess((v) => v === 1 || v === true, z.boolean()).optional().nullable(),
  interestInDesign: z.preprocess((v) => v === 1 || v === true, z.boolean()).optional().nullable(),
  interestInMaterials: z.preprocess((v) => v === 1 || v === true, z.boolean()).optional().nullable(),
  tag_ids: z.array(z.number().int().positive()).optional(),
});

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const timeSchema = z.string().regex(timeRegex, 'Must be HH:MM').transform((value) => value.slice(0, 5));

export const updateAvailabilitySchema = z.object({
  slots: z.array(z.object({
    day_of_week: z.enum(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']),
    time_from: timeSchema,
    time_to: timeSchema,
    notes: z.string().max(200).optional(),
  })),
});

export const collaboratorStatusSchema = z.object({
  status: z.enum(['Nuevo', 'En_Revisión', 'Contactado', 'Vinculado', 'Inactivo']),
});

export const collaboratorNoteSchema = z.object({
  note: z.string().min(1).max(2000),
});

export const rejectCollaboratorSchema = z.object({
  reason: z.string().max(2000).optional().nullable(),
});

export const adminCollaboratorSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1),
  secondLastName: z.string().optional().nullable(),
  personalEmail: z.string().email(),
  usfqEmail: z.string().email().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  passwordHash: z.string().min(20).optional().nullable(),
  major: z.string().min(1),
  currentUniversityYear: z.number().int().min(1).max(6),
  expectedGraduationYear: z.number().int().min(2000).max(2100),
  experienceDescription: z.string().optional().nullable(),
  motivationDescription: z.string().optional().nullable(),
  interestInMachinery: z.boolean(),
  interestInDesign: z.boolean(),
  interestInMaterials: z.boolean(),
  trajectoryStatus: z.enum(['Nuevo', 'En_Revisión', 'Contactado', 'Vinculado', 'Inactivo']),
  isActive: z.boolean(),
  profileComplete: z.boolean(),
  intakeSource: z.string().optional().nullable(),
});

export const collaboratorActiveSchema = z.object({
  is_active: z.boolean(),
});
