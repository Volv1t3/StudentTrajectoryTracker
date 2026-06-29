import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { apiGet, apiPatch } from '$lib/server/api';
import { getAdminAccessToken } from '$lib/server/auth';
import type { Project, PaginatedResponse } from '$lib/types';

type ProjectWithTags = Project & {
  categories?: Array<{ name?: string | null }> | null;
  pending_count?: number | string | null;
};

export const load: PageServerLoad = async ({ cookies, url }) => {
  const token = getAdminAccessToken(cookies)!;
  const page = url.searchParams.get('page') || '1';
  const res = await apiGet<PaginatedResponse<ProjectWithTags>>(`/api/admin/projects?page=${page}`, token);
  const projects = (res.ok ? res.data.data : []).map((p) => ({
    ...p,
    nombre: p.title,
    categoria: (p.categories ?? []).map((category) => category.name).filter(Boolean).join(', ') || 'Sin categoría',
    estado: p.status,
    visible: p.is_visible,
    pending_count: Number(p.pending_count || 0),
  }));
  return {
    projects,
    meta: res.ok ? res.data.meta : { page: 1, limit: 20, total: 0 },
    warning: url.searchParams.get('warning') || '',
  };
};

export const actions: Actions = {
  toggleVisibility: async ({ request, cookies }) => {
    const token = getAdminAccessToken(cookies)!;
    const form = await request.formData();
    const id = form.get('id') as string;
    const isVisible = form.get('is_visible') === 'true';
    const res = await apiPatch(`/api/admin/projects/${id}/visibility`, { is_visible: !isVisible }, token);
    if (!res.ok) return fail(res.status, { error: 'Error' });
    return { success: true };
  }
};
