export const USFQ_EMAIL_REGEX = /@([a-z0-9-]+\.)*usfq\.edu\.ec$/i;

export const normalizeEmail = (email) => (email || '').trim().toLowerCase();

export const isUsfqEmail = (email) => USFQ_EMAIL_REGEX.test(normalizeEmail(email));
