import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getAdminAccessToken, decodeAccessToken } from '$lib/server/auth';
import { apiGet } from '$lib/server/api';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
  if (url.pathname === '/admin/login') return {};

  const token = getAdminAccessToken(cookies);
  if (!token) throw redirect(302, '/admin/login');

  const payload = decodeAccessToken(token);
  if (!payload || payload.role !== 'admin') throw redirect(302, '/admin/login');

  const [logoRes, adminRes] = await Promise.all([
    apiGet<any[]>('/api/public/media?entity_type=navigation_logo', token),
    apiGet<any>(`/api/admin/administrators/${payload.sub}`, token),
  ]);

  const logos = logoRes.ok ? logoRes.data : [];
  const admin = adminRes.ok ? adminRes.data : null;

  return {
    admin: {
      id: payload.sub,
      name: admin ? `${admin.first_name} ${admin.last_name}` : 'Admin',
    },
    logo: logos[0]?.public_url ?? null,
  };
};
