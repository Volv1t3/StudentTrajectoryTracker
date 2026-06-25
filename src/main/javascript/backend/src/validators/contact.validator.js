import { z } from 'zod';
import { isUsfqEmail, normalizeEmail } from '../utils/email.utils.js';

export const contactInquirySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().transform(normalizeEmail).refine(isUsfqEmail, 'Debe usar un correo institucional USFQ'),
  banner_code: z.string().regex(/^\d{6,12}$/, 'El código banner debe tener entre 6 y 12 dígitos'),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(4000),
});
