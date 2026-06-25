import type { LayoutServerLoad } from './$types';
import { apiAuthenticated } from '$lib/server/api';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
  if (!locals.user || locals.user.role !== 'collaborator' || !locals.accessToken) {
    return { user: locals.user };
  }

  const profileRes = await apiAuthenticated<any>('/api/app/profile', cookies);
  if (profileRes.ok && profileRes.data) {
    return {
      user: {
        ...locals.user,
        nombres: `${profileRes.data.first_name} ${profileRes.data.last_name}`.trim(),
        usfq_email: profileRes.data.usfq_email ?? null,
        major: profileRes.data.major ?? null,
      },
    };
  }

  // Refresh failed or profile not available — treat as unauthenticated
  return { user: null };
};
