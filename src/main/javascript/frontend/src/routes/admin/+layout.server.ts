import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getAdminAccessToken } from '$lib/server/auth';
import { apiGet } from '$lib/server/api';

export const load: LayoutServerLoad = async ({ cookies, url, locals }) => {
  if (url.pathname === '/admin/login') return {};

  if (!locals.user || locals.user.role !== 'admin') throw redirect(302, '/admin/login');

  const token = locals.accessToken ?? getAdminAccessToken(cookies);
  if (!token) throw redirect(302, '/admin/login');

  const [logoRes, adminRes] = await Promise.all([
    apiGet<any[]>('/api/public/media?entity_type=navigation_logo', token),
    apiGet<any>(`/api/admin/administrators/${locals.user.id}`, token),
  ]);

  const logos = logoRes.ok ? logoRes.data : [];
  const admin = adminRes.ok ? adminRes.data : null;

  return {
    admin: {
      id: locals.user.id,
      name: admin ? `${admin.first_name} ${admin.last_name}` : 'Admin',
    },
    logo: logos[0]?.public_url ?? null,
  };
};
