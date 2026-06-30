import { z } from 'zod';
import { isUsfqEmail, normalizeEmail } from '../utils/email.utils.js';

export const contactInquirySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().transform(normalizeEmail),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(4000),
});
