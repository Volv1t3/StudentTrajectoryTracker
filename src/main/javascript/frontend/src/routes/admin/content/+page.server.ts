import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { apiGet, apiPut, apiPost, apiPatch, apiDelete } from '$lib/server/api';
import { getAdminAccessToken } from '$lib/server/auth';
import type {
  HomeHero,
  DlabIdentity,
  ContactInfo,
  ValueProposition,
  ParticipationStep,
  SocialLink,
} from '$lib/types';

// =============================================================================
// EDITABLE DEFAULTS — used when no row exists yet so the form renders cleanly
// =============================================================================

const HOME_HERO_DEFAULT: HomeHero = {
  id: 0,
  headline: '',
  subheadline: null,
  primary_cta_label: '',
  primary_cta_url: '',
  secondary_cta_label: null,
  secondary_cta_url: null,
  background_image_url: null,
  is_active: true,
  updated_by_admin_id: null,
  updated_at: '',
};

const DLAB_IDENTITY_DEFAULT: DlabIdentity = {
  id: 0,
  title: '',
  body: '',
  mission_title: '',
  mission_body: '',
  vision_title: '',
  vision_body: '',
  image_url: null,
  video_url: null,
  is_active: true,
  updated_by_admin_id: null,
  updated_at: '',
};

// =============================================================================
// LOAD — pulls all CMS sections in parallel
// =============================================================================

export const load: PageServerLoad = async ({ cookies }) => {
  const token = getAdminAccessToken(cookies)!;

  const [heroRes, identityRes, vpRes, stepsRes, contactsRes, socialRes] = await Promise.all([
    apiGet<HomeHero | null>('/api/admin/content/home_hero', token),
    apiGet<DlabIdentity | null>('/api/admin/content/dlab_identity', token),
    apiGet<ValueProposition[]>('/api/admin/content/value_propositions', token),
    apiGet<ParticipationStep[]>('/api/admin/content/participation_steps', token),
    apiGet<ContactInfo[]>('/api/admin/content/contact_info', token),
    apiGet<SocialLink[]>('/api/admin/content/social_links', token),
  ]);

  return {
    homeHero: heroRes.ok && heroRes.data ? heroRes.data : { ...HOME_HERO_DEFAULT },
    dlabIdentity: identityRes.ok && identityRes.data ? identityRes.data : { ...DLAB_IDENTITY_DEFAULT },
    valuePropositions: vpRes.ok && Array.isArray(vpRes.data) ? vpRes.data : [],
    participationSteps: stepsRes.ok && Array.isArray(stepsRes.data) ? stepsRes.data : [],
    contacts: contactsRes.ok && Array.isArray(contactsRes.data) ? contactsRes.data : [],
    socialLinks: socialRes.ok && Array.isArray(socialRes.data) ? socialRes.data : [],
  };
};

// =============================================================================
// FORM HELPERS
// =============================================================================

function str(form: FormData, name: string): string {
  return form.get(name)?.toString().trim() ?? '';
}

function strOrNull(form: FormData, name: string): string | null {
  const v = form.get(name)?.toString().trim();
  return v ? v : null;
}

function bool(form: FormData, name: string): boolean {
  return form.has(name);
}

function num(form: FormData, name: string, dflt = 0): number {
  const raw = form.get(name)?.toString().trim();
  if (!raw) return dflt;
  const n = Number(raw);
  return Number.isFinite(n) ? n : dflt;
}

function intArrFromJson(value: FormDataEntryValue | null): number[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value.toString());
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => Number(x))
      .filter((x) => Number.isInteger(x) && x > 0);
  } catch {
    return [];
  }
}

function pickError(data: unknown): string {
  const d = data as { error?: { message?: string }; message?: string } | null;
  return d?.error?.message || d?.message || 'Error inesperado';
}

const ok = (scope: string) => ({ success: true as const, scope, error: null });
const ko = (status: number, scope: string, error: string) =>
  fail(status, { success: false as const, scope, error });

// =============================================================================
// ACTIONS — payload shapes match backend validators exactly (snake_case).
// Field name remapping happens here; the Svelte component sends raw form data.
// =============================================================================

export const actions: Actions = {
  // ---------------------------------------------------------------------------
  // SINGLETONS
  // ---------------------------------------------------------------------------

  /** PUT /api/admin/content/home_hero — sp_content_upsert_home_hero */
  saveHomeHero: async ({ cookies, request }) => {
    const token = getAdminAccessToken(cookies)!;
    const f = await request.formData();
    const currentHeroRes = await apiGet<HomeHero | null>('/api/admin/content/home_hero', token);
    const currentHero = currentHeroRes.ok && currentHeroRes.data ? currentHeroRes.data : null;
    const payload = {
      headline: str(f, 'headline'),
      subheadline: strOrNull(f, 'subheadline'),
      primary_cta_label: str(f, 'primary_cta_label'),
      primary_cta_url: currentHero?.primary_cta_url ?? '/signup',
      secondary_cta_label: strOrNull(f, 'secondary_cta_label'),
      secondary_cta_url: currentHero?.secondary_cta_url ?? '/projects',
      background_image_url: currentHero?.background_image_url ?? null,
    };
    const res = await apiPut('/api/admin/content/home_hero', payload, token);
    if (!res.ok) return ko(res.status, 'home_hero', pickError(res.data));
    return ok('home_hero');
  },

  /** PUT /api/admin/content/dlab_identity — generic singleton path */
  saveDlabIdentity: async ({ cookies, request }) => {
    const token = getAdminAccessToken(cookies)!;
    const f = await request.formData();
    const payload = {
      title: str(f, 'title'),
      body: str(f, 'body'),
      mission_title: strOrNull(f, 'mission_title'),
      mission_body: strOrNull(f, 'mission_body'),
      vision_title: strOrNull(f, 'vision_title'),
      vision_body: strOrNull(f, 'vision_body'),
    };
    const res = await apiPut('/api/admin/content/dlab_identity', payload, token);
    if (!res.ok) return ko(res.status, 'dlab_identity', pickError(res.data));
    return ok('dlab_identity');
  },

  // ---------------------------------------------------------------------------
  // VALUE PROPOSITIONS
  // ---------------------------------------------------------------------------

  createValueProposition: async ({ cookies, request }) => {
    const token = getAdminAccessToken(cookies)!;
    const f = await request.formData();
    const listRes = await apiGet<ValueProposition[]>('/api/admin/content/value_propositions', token);
    const items = listRes.ok && Array.isArray(listRes.data) ? listRes.data : [];
    const maxOrder = items.reduce((max, item) => Math.max(max, item.sort_order), -1);
    const payload = {
      title: str(f, 'title'),
      description: str(f, 'description'),
      icon_identifier: strOrNull(f, 'icon_identifier'),
      target_audience: strOrNull(f, 'target_audience'),
      sort_order: maxOrder + 1,
      is_visible: bool(f, 'is_visible'),
    };
    const res = await apiPost('/api/admin/content/value_propositions', payload, token);
    if (!res.ok) return ko(res.status, 'value_propositions:create', pickError(res.data));
    return ok('value_propositions:create');
  },

  updateValueProposition: async ({ cookies, request }) => {
    const token = getAdminAccessToken(cookies)!;
    const f = await request.formData();
    const id = num(f, 'id');
    if (!id) return ko(400, 'value_propositions:update', 'Falta el id');
    const payload = {
      title: str(f, 'title'),
      description: str(f, 'description'),
      icon_identifier: strOrNull(f, 'icon_identifier'),
      target_audience: strOrNull(f, 'target_audience'),
      sort_order: num(f, 'sort_order', 0),
      is_visible: bool(f, 'is_visible'),
    };
    const res = await apiPut(`/api/admin/content/value_propositions/${id}`, payload, token);
    if (!res.ok) return ko(res.status, `value_propositions:update:${id}`, pickError(res.data));
    return ok(`value_propositions:update:${id}`);
  },

  deleteValueProposition: async ({ cookies, request }) => {
    const token = getAdminAccessToken(cookies)!;
    const f = await request.formData();
    const id = num(f, 'id');
    if (!id) return ko(400, 'value_propositions:delete', 'Falta el id');
    const res = await apiDelete(`/api/admin/content/value_propositions/${id}`, token);
    if (!res.ok) return ko(res.status, `value_propositions:delete:${id}`, pickError(res.data));
    return ok(`value_propositions:delete:${id}`);
  },

  reorderValuePropositions: async ({ cookies, request }) => {
    const token = getAdminAccessToken(cookies)!;
    const f = await request.formData();
    const ordered_ids = intArrFromJson(f.get('ordered_ids_json'));
    if (ordered_ids.length === 0)
      return ko(400, 'value_propositions:reorder', 'Lista de ids vacía');
    const res = await apiPatch(
      '/api/admin/content/value_propositions/reorder',
      { ordered_ids },
      token,
    );
    if (!res.ok) return ko(res.status, 'value_propositions:reorder', pickError(res.data));
    return ok('value_propositions:reorder');
  },

  // ---------------------------------------------------------------------------
  // PARTICIPATION STEPS
  // ---------------------------------------------------------------------------

  createParticipationStep: async ({ cookies, request }) => {
    const token = getAdminAccessToken(cookies)!;
    const f = await request.formData();
    const listRes = await apiGet<ParticipationStep[]>('/api/admin/content/participation_steps', token);
    const items = listRes.ok && Array.isArray(listRes.data) ? listRes.data : [];
    const maxNumber = items.reduce((max, item) => Math.max(max, item.step_number), 0);
    const payload = {
      step_number: maxNumber + 1,
      title: str(f, 'title'),
      description: str(f, 'description'),
      icon_identifier: strOrNull(f, 'icon_identifier'),
      is_visible: bool(f, 'is_visible'),
    };
    const res = await apiPost('/api/admin/content/participation_steps', payload, token);
    if (!res.ok) return ko(res.status, 'participation_steps:create', pickError(res.data));
    return ok('participation_steps:create');
  },

  updateParticipationStep: async ({ cookies, request }) => {
    const token = getAdminAccessToken(cookies)!;
    const f = await request.formData();
    const id = num(f, 'id');
    if (!id) return ko(400, 'participation_steps:update', 'Falta el id');
    const payload = {
      step_number: num(f, 'step_number', 0),
      title: str(f, 'title'),
      description: str(f, 'description'),
      icon_identifier: strOrNull(f, 'icon_identifier'),
      is_visible: bool(f, 'is_visible'),
    };
    const res = await apiPut(`/api/admin/content/participation_steps/${id}`, payload, token);
    if (!res.ok) return ko(res.status, `participation_steps:update:${id}`, pickError(res.data));
    return ok(`participation_steps:update:${id}`);
  },

  deleteParticipationStep: async ({ cookies, request }) => {
    const token = getAdminAccessToken(cookies)!;
    const f = await request.formData();
    const id = num(f, 'id');
    if (!id) return ko(400, 'participation_steps:delete', 'Falta el id');
    const res = await apiDelete(`/api/admin/content/participation_steps/${id}`, token);
    if (!res.ok) return ko(res.status, `participation_steps:delete:${id}`, pickError(res.data));
    return ok(`participation_steps:delete:${id}`);
  },

  reorderParticipationSteps: async ({ cookies, request }) => {
    const token = getAdminAccessToken(cookies)!;
    const f = await request.formData();
    const ordered_ids = intArrFromJson(f.get('ordered_ids_json'));
    if (ordered_ids.length === 0)
      return ko(400, 'participation_steps:reorder', 'Lista de ids vacía');
    const res = await apiPatch(
      '/api/admin/content/participation_steps/reorder',
      { ordered_ids },
      token,
    );
    if (!res.ok) return ko(res.status, 'participation_steps:reorder', pickError(res.data));
    return ok('participation_steps:reorder');
  },

  // ---------------------------------------------------------------------------
  // SOCIAL LINKS
  // ---------------------------------------------------------------------------

  createSocialLink: async ({ cookies, request }) => {
    const token = getAdminAccessToken(cookies)!;
    const f = await request.formData();
    const listRes = await apiGet<SocialLink[]>('/api/admin/content/social_links', token);
    const items = listRes.ok && Array.isArray(listRes.data) ? listRes.data : [];
    const maxOrder = items.reduce((max, item) => Math.max(max, item.sort_order), -1);
    const payload = {
      platform: str(f, 'platform'),
      url: str(f, 'url'),
      icon_identifier: strOrNull(f, 'icon_identifier'),
      sort_order: maxOrder + 1,
      is_visible: bool(f, 'is_visible'),
    };
    const res = await apiPost('/api/admin/content/social_links', payload, token);
    if (!res.ok) return ko(res.status, 'social_links:create', pickError(res.data));
    return ok('social_links:create');
  },

  updateSocialLink: async ({ cookies, request }) => {
    const token = getAdminAccessToken(cookies)!;
    const f = await request.formData();
    const id = num(f, 'id');
    if (!id) return ko(400, 'social_links:update', 'Falta el id');
    const payload = {
      platform: str(f, 'platform'),
      url: str(f, 'url'),
      icon_identifier: strOrNull(f, 'icon_identifier'),
      sort_order: num(f, 'sort_order', 0),
      is_visible: bool(f, 'is_visible'),
    };
    const res = await apiPut(`/api/admin/content/social_links/${id}`, payload, token);
    if (!res.ok) return ko(res.status, `social_links:update:${id}`, pickError(res.data));
    return ok(`social_links:update:${id}`);
  },

  deleteSocialLink: async ({ cookies, request }) => {
    const token = getAdminAccessToken(cookies)!;
    const f = await request.formData();
    const id = num(f, 'id');
    if (!id) return ko(400, 'social_links:delete', 'Falta el id');
    const res = await apiDelete(`/api/admin/content/social_links/${id}`, token);
    if (!res.ok) return ko(res.status, `social_links:delete:${id}`, pickError(res.data));
    return ok(`social_links:delete:${id}`);
  },

  // ---------------------------------------------------------------------------
  // CONTACT INFO
  // ---------------------------------------------------------------------------

  createContactInfo: async ({ cookies, request }) => {
    const token = getAdminAccessToken(cookies)!;
    const f = await request.formData();
    const payload = {
      first_name: str(f, 'first_name'),
      middle_name: strOrNull(f, 'middle_name'),
      last_name: str(f, 'last_name'),
      title_description: strOrNull(f, 'title_description'),
      contact_email: strOrNull(f, 'contact_email'),
      contact_phone: strOrNull(f, 'contact_phone'),
      physical_location: strOrNull(f, 'physical_location'),
      cta_headline: strOrNull(f, 'cta_headline'),
      cta_description: strOrNull(f, 'cta_description'),
      is_active: bool(f, 'is_active'),
    };
    const res = await apiPost('/api/admin/content/contact_info', payload, token);
    if (!res.ok) return ko(res.status, 'contact_info:create', pickError(res.data));
    return ok('contact_info:create');
  },

  updateContactInfo: async ({ cookies, request }) => {
    const token = getAdminAccessToken(cookies)!;
    const f = await request.formData();
    const id = num(f, 'id');
    if (!id) return ko(400, 'contact_info:update', 'Falta el id');
    const payload = {
      first_name: str(f, 'first_name'),
      middle_name: strOrNull(f, 'middle_name'),
      last_name: str(f, 'last_name'),
      title_description: strOrNull(f, 'title_description'),
      contact_email: strOrNull(f, 'contact_email'),
      contact_phone: strOrNull(f, 'contact_phone'),
      physical_location: strOrNull(f, 'physical_location'),
      cta_headline: strOrNull(f, 'cta_headline'),
      cta_description: strOrNull(f, 'cta_description'),
      is_active: bool(f, 'is_active'),
    };
    const res = await apiPut(`/api/admin/content/contact_info/${id}`, payload, token);
    if (!res.ok) return ko(res.status, `contact_info:update:${id}`, pickError(res.data));
    return ok(`contact_info:update:${id}`);
  },

  deleteContactInfo: async ({ cookies, request }) => {
    const token = getAdminAccessToken(cookies)!;
    const f = await request.formData();
    const id = num(f, 'id');
    if (!id) return ko(400, 'contact_info:delete', 'Falta el id');
    const res = await apiDelete(`/api/admin/content/contact_info/${id}`, token);
    if (!res.ok) return ko(res.status, `contact_info:delete:${id}`, pickError(res.data));
    return ok(`contact_info:delete:${id}`);
  },

  setContactInfoActive: async ({ cookies, request }) => {
    const token = getAdminAccessToken(cookies)!;
    const f = await request.formData();
    const id = num(f, 'id');
    if (!id) return ko(400, 'contact_info:active', 'Falta el id');
    // Read the VALUE of is_active explicitly. The toggle button submits a hidden
    // input whose value is 'on' (activate) or '' (deactivate). Using the bool()
    // helper here would always return true because the field is always present.
    const is_active = f.get('is_active')?.toString() === 'on';
    const res = await apiPatch(
      `/api/admin/content/contact_info/${id}/active`,
      { is_active },
      token,
    );
    if (!res.ok) return ko(res.status, `contact_info:active:${id}`, pickError(res.data));
    return ok(`contact_info:active:${id}`);
  },
};
