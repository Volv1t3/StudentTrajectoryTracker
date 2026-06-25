import type { PageServerLoad } from './$types';
import { apiGet } from '$lib/server/api';
import type { DlabIdentity, ValueProposition } from '$lib/types/cms';

export const load: PageServerLoad = async () => {
  const [identityRes, mediaRes, vpRes] = await Promise.all([
    apiGet<DlabIdentity>('/api/public/content/dlab_identity'),
    apiGet<any[]>('/api/public/media?entity_type=value_propositions'),
    apiGet<ValueProposition[]>('/api/public/content/value_propositions')
  ]);

  const identity = identityRes.ok ? identityRes.data : null;
  const media = mediaRes.ok ? mediaRes.data : [];

  const missionImage = media.find((m) => m.original_filename === '0_mision.jpg')?.public_url;
  const visionImage = media.find((m) => m.original_filename === '0_vision.jpeg')?.public_url;

  return {
    content: {
      about_hero_subtitle: identity?.title ?? '',
      identity_text: identity?.body ?? '',
      mission_title: identity?.mission_title ?? '',
      mission_text: identity?.mission_body ?? '',
      vision_title: identity?.vision_title ?? '',
      vision_text: identity?.vision_body ?? ''
    },
    valuePropositions: vpRes.ok ? vpRes.data : [],
    missionImage,
    visionImage
  };
};
