/**
 * content.ts — validation for admin CMS content forms (home hero, identity,
 * value propositions, participation steps, social links, contact info).
 *
 * Authority:
 *   - DB: `src/main/sql/db/db_init_ordered.sql`
 *       home_hero.headline             VARCHAR(255) NOT NULL
 *       home_hero.subheadline          VARCHAR(500) NULL
 *       home_hero.primary_cta_label    VARCHAR(100) NOT NULL
 *       home_hero.primary_cta_url      VARCHAR(500) NOT NULL
 *       home_hero.secondary_cta_label  VARCHAR(100) NULL
 *       home_hero.secondary_cta_url    VARCHAR(500) NULL
 *       dlab_identity.title            VARCHAR(255)
 *       dlab_identity.mission_title    VARCHAR(255) NULL
 *       dlab_identity.vision_title     VARCHAR(255) NULL
 *       value_propositions.title       VARCHAR(200) NOT NULL
 *       value_propositions.icon_identifier VARCHAR(100) NULL
 *       value_propositions.target_audience VARCHAR(200) NULL
 *       participation_steps.title          VARCHAR(200)
 *       participation_steps.icon_identifier VARCHAR(100) NULL
 *       social_links.platform          VARCHAR(100)
 *       social_links.url               VARCHAR(1000)
 *       contact_info.first_name        VARCHAR(100)
 *       contact_info.last_name         VARCHAR(100)
 *       contact_info.title_description VARCHAR(255) NULL
 *       contact_info.contact_email     VARCHAR(255) NULL
 *       contact_info.contact_phone     VARCHAR(30)  NULL
 *       contact_info.physical_location VARCHAR(300) NULL
 *       contact_info.cta_headline      VARCHAR(255) NULL
 *   - Backend Zod: `backend/src/validators/content.validator.js`
 */

import {
  composeValidators,
  email,
  enumOf,
  intRange,
  maxLength,
  optional,
  required,
  url,
  validateForm,
  type FormErrors,
  type FormSchema,
  type Validator,
} from './core.js';

export const CONTENT_LIMITS = Object.freeze({
  headline: { min: 1, max: 255 },
  subheadline: { max: 500 },
  ctaLabel: { min: 1, max: 100 },
  ctaUrl: { max: 500 },
  identityTitle: { min: 1, max: 255 },
  identitySectionTitle: { max: 255 },
  vpTitle: { min: 1, max: 200 },
  vpTargetAudience: { max: 200 },
  iconIdentifier: { max: 100 },
  stepTitle: { min: 1, max: 200 },
  socialPlatform: { min: 1, max: 100 },
  socialUrl: { min: 1, max: 1000 },
  contactName: { min: 1, max: 100 },
  contactMiddleName: { max: 100 },
  contactTitleDescription: { max: 255 },
  contactEmail: { max: 255 },
  contactPhone: { max: 30 },
  contactPhysicalLocation: { max: 300 },
  contactCtaHeadline: { max: 255 },
  sortOrder: { min: 0, max: 255 },
  stepNumber: { min: 0, max: 255 },
});

// ---------------------------------------------------------------------------
// Home hero
// ---------------------------------------------------------------------------

export interface HomeHeroFormValues {
  headline: string;
  subheadline?: string | null;
  primary_cta_label: string;
  secondary_cta_label?: string | null;
}

export const homeHeroSchema: FormSchema<HomeHeroFormValues> = {
  headline: composeValidators(
    required('El titular es obligatorio'),
    maxLength(CONTENT_LIMITS.headline.max)
  ),
  subheadline: optional(maxLength(CONTENT_LIMITS.subheadline.max)),
  primary_cta_label: composeValidators(
    required('La etiqueta del botón es obligatoria'),
    maxLength(CONTENT_LIMITS.ctaLabel.max)
  ),
  secondary_cta_label: optional(maxLength(CONTENT_LIMITS.ctaLabel.max)),
};

export function validateHomeHeroForm(values: HomeHeroFormValues): FormErrors<HomeHeroFormValues> {
  return validateForm(values, homeHeroSchema);
}

// ---------------------------------------------------------------------------
// DLab identity
// ---------------------------------------------------------------------------

export interface DlabIdentityFormValues {
  title: string;
  body: string;
  mission_title?: string | null;
  mission_body?: string | null;
  vision_title?: string | null;
  vision_body?: string | null;
}

export const dlabIdentitySchema: FormSchema<DlabIdentityFormValues> = {
  title: composeValidators(
    required('El título es obligatorio'),
    maxLength(CONTENT_LIMITS.identityTitle.max)
  ),
  body: required('El contenido es obligatorio'),
  mission_title: optional(maxLength(CONTENT_LIMITS.identitySectionTitle.max)),
  vision_title: optional(maxLength(CONTENT_LIMITS.identitySectionTitle.max)),
};

export function validateDlabIdentityForm(
  values: DlabIdentityFormValues
): FormErrors<DlabIdentityFormValues> {
  return validateForm(values, dlabIdentitySchema);
}

// ---------------------------------------------------------------------------
// Value propositions
// ---------------------------------------------------------------------------

export interface ValuePropositionFormValues {
  title: string;
  description: string;
  icon_identifier?: string | null;
  target_audience?: string | null;
  sort_order?: number;
  is_visible?: boolean;
}

export const valuePropositionSchema: FormSchema<ValuePropositionFormValues> = {
  title: composeValidators(
    required('El título es obligatorio'),
    maxLength(CONTENT_LIMITS.vpTitle.max)
  ),
  description: required('La descripción es obligatoria'),
  icon_identifier: optional(maxLength(CONTENT_LIMITS.iconIdentifier.max)),
  target_audience: optional(maxLength(CONTENT_LIMITS.vpTargetAudience.max)),
  sort_order: optional(intRange(CONTENT_LIMITS.sortOrder.min, CONTENT_LIMITS.sortOrder.max)),
};

export function validateValuePropositionForm(
  values: ValuePropositionFormValues
): FormErrors<ValuePropositionFormValues> {
  return validateForm(values, valuePropositionSchema);
}

// ---------------------------------------------------------------------------
// Participation steps
// ---------------------------------------------------------------------------

export interface ParticipationStepFormValues {
  step_number?: number;
  title: string;
  description: string;
  icon_identifier?: string | null;
  is_visible?: boolean;
}

export const participationStepSchema: FormSchema<ParticipationStepFormValues> = {
  step_number: optional(intRange(CONTENT_LIMITS.stepNumber.min, CONTENT_LIMITS.stepNumber.max)),
  title: composeValidators(
    required('El título es obligatorio'),
    maxLength(CONTENT_LIMITS.stepTitle.max)
  ),
  description: required('La descripción es obligatoria'),
  icon_identifier: optional(maxLength(CONTENT_LIMITS.iconIdentifier.max)),
};

export function validateParticipationStepForm(
  values: ParticipationStepFormValues
): FormErrors<ParticipationStepFormValues> {
  return validateForm(values, participationStepSchema);
}

// ---------------------------------------------------------------------------
// Social links
// ---------------------------------------------------------------------------

export interface SocialLinkFormValues {
  platform: string;
  url: string;
  icon_identifier?: string | null;
  sort_order?: number;
  is_visible?: boolean;
}

export const socialLinkSchema: FormSchema<SocialLinkFormValues> = {
  platform: composeValidators(
    required('La plataforma es obligatoria'),
    maxLength(CONTENT_LIMITS.socialPlatform.max)
  ),
  url: composeValidators(
    required('La URL es obligatoria'),
    url('URL inválida'),
    maxLength(CONTENT_LIMITS.socialUrl.max)
  ),
  icon_identifier: optional(maxLength(CONTENT_LIMITS.iconIdentifier.max)),
  sort_order: optional(intRange(CONTENT_LIMITS.sortOrder.min, CONTENT_LIMITS.sortOrder.max)),
};

export function validateSocialLinkForm(
  values: SocialLinkFormValues
): FormErrors<SocialLinkFormValues> {
  return validateForm(values, socialLinkSchema);
}

// ---------------------------------------------------------------------------
// Contact info (CMS singleton — not the inbound contact form)
// ---------------------------------------------------------------------------

export interface ContactInfoFormValues {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  title_description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  physical_location?: string | null;
  cta_headline?: string | null;
  cta_description?: string | null;
  is_active?: boolean;
}

const optionalEmailOrEmpty: Validator<unknown> = (value) => {
  if (value == null || value === '') return null;
  const err = email()(value);
  if (err) return err;
  return maxLength(CONTENT_LIMITS.contactEmail.max)(value);
};

export const contactInfoSchema: FormSchema<ContactInfoFormValues> = {
  first_name: composeValidators(
    required('El nombre es obligatorio'),
    maxLength(CONTENT_LIMITS.contactName.max)
  ),
  middle_name: optional(maxLength(CONTENT_LIMITS.contactMiddleName.max)),
  last_name: composeValidators(
    required('El apellido es obligatorio'),
    maxLength(CONTENT_LIMITS.contactName.max)
  ),
  title_description: optional(maxLength(CONTENT_LIMITS.contactTitleDescription.max)),
  contact_email: optionalEmailOrEmpty,
  contact_phone: optional(maxLength(CONTENT_LIMITS.contactPhone.max)),
  physical_location: optional(maxLength(CONTENT_LIMITS.contactPhysicalLocation.max)),
  cta_headline: optional(maxLength(CONTENT_LIMITS.contactCtaHeadline.max)),
};

export function validateContactInfoForm(
  values: ContactInfoFormValues
): FormErrors<ContactInfoFormValues> {
  return validateForm(values, contactInfoSchema);
}

// ---------------------------------------------------------------------------
// Toggles / reorder
// ---------------------------------------------------------------------------

export const validateBooleanToggle: Validator<unknown> = (value) =>
  typeof value === 'boolean' ? null : 'Valor booleano requerido';

export const validateOrderedIds: Validator<unknown> = (value) => {
  if (!Array.isArray(value) || value.length === 0) return 'Lista de orden requerida';
  if (!value.every((v) => Number.isInteger(v) && (v as number) > 0)) {
    return 'Todos los identificadores deben ser enteros positivos';
  }
  return null;
};

export const REORDER_KIND = ['value_propositions', 'participation_steps', 'social_links'] as const;
export type ReorderKind = (typeof REORDER_KIND)[number];

export const validateReorderKind: Validator<unknown> = enumOf(REORDER_KIND);
