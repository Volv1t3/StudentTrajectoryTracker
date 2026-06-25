import { z } from 'zod';

// Helpers — accept "" alongside null/undefined for optional textual fields.
const optionalString = z.string().optional().nullable().transform((v) => (v == null || v === '' ? null : v));

// =============================================================================
// SINGLETON SECTIONS
// =============================================================================

// home_hero — DB columns:
//   headline, subheadline, primary_cta_label, primary_cta_url,
//   secondary_cta_label, secondary_cta_url, background_image_url
// Admin CMS only edits the textual fields; URLs/background are preserved
// server-side from the currently active row.
export const homeHeroSchema = z.object({
  headline: z.string().min(1).max(255),
  subheadline: optionalString,
  primary_cta_label: z.string().min(1).max(100),
  secondary_cta_label: optionalString,
});

// dlab_identity — admin CMS edits only the textual identity/mission/vision fields.
export const dlabIdentitySchema = z.object({
  title: z.string().min(1).max(255),
  body: z.string().min(1),
  mission_title: optionalString,
  mission_body: optionalString,
  vision_title: optionalString,
  vision_body: optionalString,
});

// =============================================================================
// REPEATABLE SECTIONS
// =============================================================================

// value_propositions — admin CMS edits only textual + ordering/visibility fields.
export const valuePropositionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  icon_identifier: optionalString,
  target_audience: optionalString,
  sort_order: z.number().int().min(0).max(255).optional(),
  is_visible: z.boolean().optional(),
});

// participation_steps — DB columns:
//   step_number, title, description, icon_identifier, is_visible
export const participationStepSchema = z.object({
  step_number: z.number().int().min(0).max(255).optional(),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  icon_identifier: optionalString,
  is_visible: z.boolean().optional(),
});

// social_links — DB columns:
//   platform, url, icon_identifier, sort_order, is_visible
export const socialLinkSchema = z.object({
  platform: z.string().min(1).max(100),
  url: z.string().url().max(1000),
  icon_identifier: optionalString,
  sort_order: z.number().int().min(0).max(255).optional(),
  is_visible: z.boolean().optional(),
});

// contact_info — admin CMS edits textual/contact fields only; maps_url remains
// non-editable in this UI.
export const contactInfoSchema = z.object({
  first_name: z.string().min(1).max(100),
  middle_name: z.string().max(100).optional().nullable(),
  last_name: z.string().min(1).max(100),
  title_description: z.string().max(255).optional().nullable(),
  contact_email: z.string().email().optional().nullable().or(z.literal('')),
  contact_phone: z.string().max(30).optional().nullable(),
  physical_location: z.string().max(300).optional().nullable(),
  cta_headline: z.string().max(255).optional().nullable(),
  cta_description: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

// =============================================================================
// REORDER / TOGGLE SCHEMAS
// =============================================================================

// Reorder payload: { ordered_ids: [int, int, int, ...] }
// The position of each id in the array is its new sort/step ordinal.
export const reorderSchema = z.object({
  ordered_ids: z.array(z.number().int().positive()).min(1),
});

// Visibility toggle payload: { is_visible: boolean }
export const visibilityToggleSchema = z.object({
  is_visible: z.boolean(),
});

// Active toggle payload: { is_active: boolean }
export const activeToggleSchema = z.object({
  is_active: z.boolean(),
});
