import { z } from 'zod';
import { normalizeEmail } from '../utils/email.utils.js';

// No DB-bound length authority for contact_inquiries (handled in-memory/email).
// Application-level limits below mirror prior product limits.

export const contactInquirySchema = z.object({
  name: z.string({ required_error: 'El nombre es obligatorio', invalid_type_error: 'El nombre es obligatorio' })
    .min(1, 'El nombre es obligatorio')
    .max(200, 'Máximo 200 caracteres'),
  email: z.string({ required_error: 'El correo es obligatorio', invalid_type_error: 'El correo es obligatorio' })
    .min(1, 'El correo es obligatorio')
    .max(255, 'Máximo 255 caracteres')
    .email('Correo electrónico inválido')
    .transform(normalizeEmail),
  subject: z.string({ required_error: 'El asunto es obligatorio', invalid_type_error: 'El asunto es obligatorio' })
    .min(1, 'El asunto es obligatorio')
    .max(200, 'Máximo 200 caracteres'),
  message: z.string({ required_error: 'El mensaje es obligatorio', invalid_type_error: 'El mensaje es obligatorio' })
    .min(1, 'El mensaje es obligatorio')
    .max(4000, 'Máximo 4000 caracteres'),
});
