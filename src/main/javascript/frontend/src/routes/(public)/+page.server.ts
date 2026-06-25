import type { PageServerLoad } from './$types';
import { apiGet } from '$lib/server/api';
import type { HomeHero, DlabIdentity, ValueProposition, ParticipationStep } from '$lib/types/cms';

export const load: PageServerLoad = async () => {
  const [heroRes, identityRes, vpRes, stepsRes, mediaRes] = await Promise.all([
    apiGet<HomeHero>('/api/public/content/home_hero'),
    apiGet<DlabIdentity>('/api/public/content/dlab_identity'),
    apiGet<ValueProposition[]>('/api/public/content/value_propositions'),
    apiGet<ParticipationStep[]>('/api/public/content/participation_steps'),
    apiGet<any[]>('/api/public/media?entity_type=value_propositions'),
  ]);

  const hero = heroRes.ok ? heroRes.data : null;
  const identity = identityRes.ok ? identityRes.data : null;
  const media = mediaRes.ok ? mediaRes.data : [];

  // Find mission and vision images
  const missionImage = media.find((m) => m.original_filename === '0_mision.jpg')?.public_url;
  const visionImage = media.find((m) => m.original_filename === '0_vision.jpeg')?.public_url;

  // Map backend CMS sections into the flat `content` object expected by the page
  const content = {
    hero_eyebrow: 'D.Lab · USFQ',
    hero_title: hero?.headline ?? '',
    hero_subtitle: hero?.subheadline ?? '',
    hero_primary_cta_label: hero?.primary_cta_label ?? '',
    hero_secondary_cta_label: hero?.secondary_cta_label ?? '',
    what_is_dlab_text: identity?.body ?? '',
    mission_title: identity?.mission_title ?? '',
    mission_text: identity?.mission_body ?? '',
    vision_title: identity?.vision_title ?? '',
    vision_text: identity?.vision_body ?? '',
  };

  return {
    content,
    valuePropositions: vpRes.ok ? vpRes.data : [],
    participationSteps: stepsRes.ok ? stepsRes.data : [],
    missionImage,
    visionImage,
  };
};
