import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { apiGet, apiAuthenticated } from '$lib/server/api';

export const load: LayoutServerLoad = async ({ locals, url, cookies }) => {
  if (!locals.user || locals.user.role !== 'collaborator') {
    const returnUrl = encodeURIComponent(url.pathname + url.search);
    throw redirect(302, `/login?return=${returnUrl}`);
  }

  const [profileRes, logoRes] = await Promise.all([
    apiAuthenticated<any>('/api/app/profile', cookies),
    apiGet<any[]>('/api/public/media?entity_type=navigation_logo'),
  ]);

  if (!profileRes.ok) {
    // Session could not be recovered — redirect to login
    const returnUrl = encodeURIComponent(url.pathname + url.search);
    throw redirect(302, `/login?return=${returnUrl}`);
  }

  const profile = profileRes.data;
  const logos = logoRes.ok ? logoRes.data : [];

  return {
    logo: logos[0]?.public_url ?? null,
    user: {
      ...locals.user,
      nombres: profile ? `${profile.first_name} ${profile.last_name}` : 'Usuario',
    },
  };
};
