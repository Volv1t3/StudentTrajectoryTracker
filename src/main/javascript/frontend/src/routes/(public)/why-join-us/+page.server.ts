import type { PageServerLoad } from './$types';
import { apiGet } from '$lib/server/api';
import type { DlabIdentity, ValueProposition, ParticipationStep } from '$lib/types/cms';

export const load: PageServerLoad = async () => {
  const [vpRes, stepsRes, identityRes] = await Promise.all([
    apiGet<ValueProposition[]>('/api/public/content/value_propositions'),
    apiGet<ParticipationStep[]>('/api/public/content/participation_steps'),
    apiGet<DlabIdentity>('/api/public/content/dlab_identity')
  ]);

  const identity = identityRes.ok ? identityRes.data : null;
  const participationSteps = (stepsRes.ok ? stepsRes.data : [])
    .slice()
    .sort((a, b) => a.step_number - b.step_number)
    .map((step, index) => ({
      ...step,
      step_number: index + 1
    }));

  return {
    content: {
      why_join_hero_subtitle: identity?.title ?? 'Conecta con oportunidades de aprendizaje aplicado y trabajo interdisciplinario.'
    },
    valuePropositions: vpRes.ok ? vpRes.data : [],
    participationSteps,
  };
};
