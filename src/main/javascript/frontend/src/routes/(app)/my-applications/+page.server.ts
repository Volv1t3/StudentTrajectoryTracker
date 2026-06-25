import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { apiAuthenticated } from '$lib/server/api';
import type { Application } from '$lib/types/aplicacion';

type ApplicationListItem = Application & {
  project_title?: string;
  project_slug?: string;
  project_categories?: Array<{ id: number; name: string; slug: string; category: string; is_system?: boolean }> | string | null;
  modality?: string;
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

function parseCategories(value: ApplicationListItem['project_categories']) {
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
  const status = url.searchParams.get('status') || '';
  const params = status ? `?status=${status}` : '';
  const res = await apiAuthenticated<ApplicationListItem[]>(`/api/app/applications${params}`, cookies);

  const applications = (res.ok ? res.data : []).map((app) => ({
    ...app,
    proyecto_nombre: app.project_title,
    proyecto_slug: app.project_slug,
    categorias: parseCategories(app.project_categories),
    categoria: parseCategories(app.project_categories)[0]?.name || 'General',
    modalidad: app.modality || 'No definida',
    fecha_aplicacion: app.applied_at,
    estado: app.status,
    mensaje_motivacion: app.reason_for_applying,
    feedback_admin: app.admin_notes,
  }));

  return { applications };
};

export const actions: Actions = {
  apply: async ({ request, cookies }) => {
    const form = await request.formData();
    const project_id = Number(form.get('project_id'));
    const reason_for_applying = form.get('reason_for_applying') as string;

    if (!project_id || !reason_for_applying) return fail(400, { error: 'Campos requeridos' });

    const res = await apiAuthenticated('/api/app/applications', cookies, {
      method: 'POST',
      body: { project_id, reason_for_applying }
    });
    if (!res.ok) {
      return fail(res.status, { error: getErrorMessage(res.data, 'Error al enviar aplicación') });
    }
    return { success: true };
  },

  withdraw: async ({ request, cookies }) => {
    const form = await request.formData();
    const id = form.get('id') as string;
    const res = await apiAuthenticated(`/api/app/applications/${id}`, cookies, {
      method: 'DELETE'
    });
    if (!res.ok) {
      return fail(res.status, { error: getErrorMessage(res.data, 'Error al retirar aplicación') });
    }
    return { success: true };
  }
};
