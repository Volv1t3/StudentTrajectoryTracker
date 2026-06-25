import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { apiGet, apiPatch, apiPost } from '$lib/server/api';
import { getAdminAccessToken } from '$lib/server/auth';

function normalizeStatus(status: string) {
  return status
    .toLowerCase()
    .replace(/[ó]/g, 'o')
    .replace(/[í]/g, 'i')
    .replace(/\s+/g, '_');
}

function parseTags(tags: unknown) {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string') {
    try {
      return JSON.parse(tags);
    } catch {
      return [];
    }
  }
  return [];
}

export const load: PageServerLoad = async ({ params, cookies }) => {
  const token = getAdminAccessToken(cookies)!;
  const res = await apiGet<any>(`/api/admin/collaborators/${params.id}`, token);
  if (!res.ok) throw error(404, 'Colaborador no encontrado');
  const collaborator = res.data;
  const parsedTags = parseTags(collaborator.tags).filter((tag: any) => tag?.name);
  const normalizedStatus = normalizeStatus(collaborator.trajectory_status);

  return {
    colaborador: {
      id: collaborator.id,
      firstName: collaborator.first_name || '',
      middleName: collaborator.middle_name || '',
      lastName: collaborator.last_name || '',
      secondLastName: collaborator.second_last_name || '',
      personalEmail: collaborator.personal_email || '',
      usfqEmail: collaborator.usfq_email || collaborator.personal_email || '',
      phoneNumber: collaborator.phone_number || '',
      dateOfBirth: collaborator.date_of_birth || '',
      major: collaborator.major || '',
      currentUniversityYear: collaborator.current_university_year || 1,
      expectedGraduationYear: collaborator.expected_graduation_year || new Date().getFullYear() + 1,
      experienceDescription: collaborator.experience_description || '',
      motivationDescription: collaborator.motivation_description || '',
      interestInMachinery: Boolean(collaborator.interest_in_machinery),
      interestInDesign: Boolean(collaborator.interest_in_design),
      interestInMaterials: Boolean(collaborator.interest_in_materials),
      trajectoryStatus: collaborator.trajectory_status || 'Nuevo',
      normalizedTrajectoryStatus: normalizedStatus,
      profileComplete: Boolean(collaborator.profile_complete),
      habilidades: parsedTags.map((tag: any) => tag.name),
      habilidadIds: parsedTags.map((tag: any) => tag.id).filter(Boolean),
      availabilitySlots: collaborator.availability_slots || [],
      activacionPendiente: Boolean(collaborator.activation_pending),
      notaInterna: collaborator.note || '',
      updated_at: collaborator.updated_at,
      aplicaciones: (collaborator.applications || []).map((application: any) => ({
        id: application.id,
        proyecto_id: application.project_id,
        proyecto_nombre: application.project_title || `Proyecto #${application.project_id}`,
        estado: application.status,
        fecha_aplicacion: application.applied_at,
      })),
    },
  };
};

export const actions: Actions = {
  markInReview: async ({ params, cookies }) => {
    const token = getAdminAccessToken(cookies)!;
    const res = await apiPatch(`/api/admin/collaborators/${params.id}/status`, { status: 'En_Revisión' }, token);
    if (!res.ok) return fail(res.status, { error: (res.data as any)?.error?.message || 'Error' });
    throw redirect(303, `/admin/colaboradores/${params.id}`);
  },

  addNote: async ({ request, params, cookies }) => {
    const token = getAdminAccessToken(cookies)!;
    const form = await request.formData();
    const note = form.get('note') as string;
    if (!note) return fail(400, { error: 'Nota requerida' });
    const res = await apiPost(`/api/admin/collaborators/${params.id}/notes`, { note }, token);
    if (!res.ok) return fail(res.status, { error: (res.data as any)?.error?.message || 'Error' });
    return { success: true };
  },

  approve: async ({ params, cookies }) => {
    const token = getAdminAccessToken(cookies)!;
    const res = await apiPost(`/api/admin/collaborators/${params.id}/approve`, {}, token);
    if (!res.ok) return fail(res.status, { error: (res.data as any)?.error?.message || 'Error' });
    throw redirect(303, `/admin/colaboradores/${params.id}`);
  },

  reject: async ({ request, params, cookies }) => {
    const token = getAdminAccessToken(cookies)!;
    const form = await request.formData();
    const reason = String(form.get('reason') || '').trim();
    const res = await apiPost(`/api/admin/collaborators/${params.id}/reject`, { reason }, token);
    if (!res.ok) return fail(res.status, { error: (res.data as any)?.error?.message || 'Error' });
    throw redirect(303, '/admin/colaboradores');
  },

  deactivate: async ({ params, cookies }) => {
    const token = getAdminAccessToken(cookies)!;
    const res = await apiPatch(`/api/admin/collaborators/${params.id}/status`, { status: 'Inactivo' }, token);
    if (!res.ok) return fail(res.status, { error: (res.data as any)?.error?.message || 'Error' });
    throw redirect(303, `/admin/colaboradores/${params.id}`);
  },
};
