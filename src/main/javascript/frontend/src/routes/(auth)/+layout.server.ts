import type { LayoutServerLoad } from './$types';
import { apiGet } from '$lib/server/api';

export const load: LayoutServerLoad = async () => {
  const res = await apiGet<any[]>('/api/public/media?entity_type=navigation_logo');
  const logos = res.ok ? res.data : [];
  return { logo: logos[0]?.public_url ?? null };
};
