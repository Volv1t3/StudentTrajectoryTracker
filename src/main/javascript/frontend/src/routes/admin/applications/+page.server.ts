import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { apiGet, apiPatch } from '$lib/server/api';
import { getAdminAccessToken } from '$lib/server/auth';
import type { Application, Project } from '$lib/types';

type ProjectCategory = {
  id: number;
  name: string;
  slug: string;
  category: string;
  is_system?: boolean;
};

type AdminApplicationApi = Application & {
  collaborator_name?: string;
  collaborator_email?: string;
  collaborator_usfq_email?: string | null;
  project_title?: string;
  project_slug?: string;
  project_participation_mode?: string | null;
  project_categories?: ProjectCategory[] | string | null;
  responsible_admin_id?: number | null;
  responsible_admin_name?: string | null;
  responsible_admin_email?: string | null;
};

type ApplicationListResponse = {
  data: AdminApplicationApi[];
  meta: { page: number; limit: number; total: number };
  summary?: {
    total?: number;
    status_counts?: Record<string, number>;
  };
};

type ApiErrorResponse = {
  error?: {
    message?: string;
  };
};

function getErrorMessage(data: unknown, fallback: string): string {
  const payload = data as ApiErrorResponse | null;
  return payload?.error?.message || fallback;
}

function parseCategories(value: AdminApplicationApi['project_categories']): ProjectCategory[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export const load: PageServerLoad = async ({ cookies, url }) => {
  const token = getAdminAccessToken(cookies)!;
  const page = url.searchParams.get('page') || '1';

  const [applicationsRes, projectsRes] = await Promise.all([
    apiGet<ApplicationListResponse>(`/api/admin/applications?page=${page}&limit=100`, token),
    apiGet<{ data: Project[] } & { meta: { page: number; limit: number; total: number } }>(
      '/api/admin/projects?page=1&limit=200',
      token,
    ),
  ]);

  const applications = (applicationsRes.ok ? applicationsRes.data.data : []).map((app) => ({
    id: app.id,
    status: app.status,
    applied_at: app.applied_at,
    reason_for_applying: app.reason_for_applying,
    admin_notes: app.admin_notes,
    collaborator_id: app.collaborator_id,
    collaborator_name: app.collaborator_name || 'Colaborador',
    collaborator_email: app.collaborator_usfq_email || app.collaborator_email || '',
    project_id: app.project_id,
    project_title: app.project_title || `Proyecto #${app.project_id}`,
    project_slug: app.project_slug || '',
    project_categories: parseCategories(app.project_categories),
    responsible_admin_id: app.responsible_admin_id || null,
    responsible_admin_name: app.responsible_admin_name || 'Sin responsable',
    responsible_admin_email: app.responsible_admin_email || null,
  }));

  const projects = (projectsRes.ok ? projectsRes.data.data : []).map((project) => ({
    id: project.id,
    nombre: project.title,
  }));

  const statusCounts = applicationsRes.ok
    ? {
        Pendiente: Number(applicationsRes.data.summary?.status_counts?.Pendiente || 0),
        'En_Revisión': Number(applicationsRes.data.summary?.status_counts?.['En_Revisión'] || 0),
        Aprobada: Number(applicationsRes.data.summary?.status_counts?.Aprobada || 0),
        Rechazada: Number(applicationsRes.data.summary?.status_counts?.Rechazada || 0),
        Retirada: Number(applicationsRes.data.summary?.status_counts?.Retirada || 0),
      }
    : {
        Pendiente: 0,
        'En_Revisión': 0,
        Aprobada: 0,
        Rechazada: 0,
        Retirada: 0,
      };

  return {
    applications,
    projects,
    meta: applicationsRes.ok ? applicationsRes.data.meta : { page: 1, limit: 100, total: 0 },
    summary: {
      total: applicationsRes.ok ? Number(applicationsRes.data.summary?.total || 0) : 0,
      statusCounts,
    },
  };
};

export const actions: Actions = {
  approve: async ({ request, cookies }) => {
    const token = getAdminAccessToken(cookies)!;
    const form = await request.formData();
    const id = String(form.get('application_id') || '');
    const admin_notes = String(form.get('admin_notes') || '').trim();
    const role_in_project = String(form.get('role_in_project') || '').trim();
    const body: Record<string, string> = { status: 'Aprobada' };
    if (admin_notes) body.admin_notes = admin_notes;
    if (role_in_project) body.role_in_project = role_in_project;

    const res = await apiPatch(`/api/admin/applications/${id}/status`, body, token);
    if (!res.ok) return fail(res.status, { error: getErrorMessage(res.data, 'No se pudo aprobar la solicitud') });
    return { success: true };
  },

  reject: async ({ request, cookies }) => {
    const token = getAdminAccessToken(cookies)!;
    const form = await request.formData();
    const id = String(form.get('application_id') || '');
    const admin_notes = String(form.get('admin_notes') || '').trim();

    if (!admin_notes) {
      return fail(400, { error: 'El motivo de rechazo es obligatorio' });
    }

    const res = await apiPatch(
      `/api/admin/applications/${id}/status`,
      { status: 'Rechazada', admin_notes },
      token,
    );
    if (!res.ok) return fail(res.status, { error: getErrorMessage(res.data, 'No se pudo rechazar la solicitud') });
    return { success: true };
  },

  withdraw: async ({ request, cookies }) => {
    const token = getAdminAccessToken(cookies)!;
    const form = await request.formData();
    const id = String(form.get('application_id') || '');
    const admin_notes = String(form.get('admin_notes') || '').trim();
    const body: Record<string, string> = { status: 'Retirada' };
    if (admin_notes) body.admin_notes = admin_notes;

    const res = await apiPatch(`/api/admin/applications/${id}/status`, body, token);
    if (!res.ok) return fail(res.status, { error: getErrorMessage(res.data, 'No se pudo retirar la solicitud') });
    return { success: true };
  },

  setInReview: async ({ request, cookies }) => {
    const token = getAdminAccessToken(cookies)!;
    const form = await request.formData();
    const id = String(form.get('application_id') || '');
    const admin_notes = String(form.get('admin_notes') || '').trim();
    const body: Record<string, string> = { status: 'En_Revisión' };
    if (admin_notes) body.admin_notes = admin_notes;

    const res = await apiPatch(`/api/admin/applications/${id}/status`, body, token);
    if (!res.ok) return fail(res.status, { error: getErrorMessage(res.data, 'No se pudo actualizar la solicitud') });
    return { success: true };
  },
};
