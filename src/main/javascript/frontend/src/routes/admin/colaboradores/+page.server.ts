import type { PageServerLoad } from './$types';
import { apiGet } from '$lib/server/api';
import { getAdminAccessToken } from '$lib/server/auth';
import type { CollaboratorAdmin, PaginatedResponse } from '$lib/types';

function normalizeStatus(status: string) {
  return status
    .toLowerCase()
    .replace(/[ó]/g, 'o')
    .replace(/[í]/g, 'i')
    .replace(/\s+/g, '_');
}

export const load: PageServerLoad = async ({ cookies, url }) => {
  const token = getAdminAccessToken(cookies)!;
  const params = new URLSearchParams();
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search');
  const page = url.searchParams.get('page') || '1';
  if (status) params.set('status', status);
  if (search) params.set('search', search);
  params.set('page', page);

  const res = await apiGet<PaginatedResponse<CollaboratorAdmin>>(`/api/admin/collaborators?${params}`, token);
  return {
    colaboradores: res.ok
      ? res.data.data.map((collaborator) => ({
          id: collaborator.id,
          nombres: [collaborator.first_name, collaborator.middle_name].filter(Boolean).join(' '),
          apellidos: [collaborator.last_name, collaborator.second_last_name].filter(Boolean).join(' '),
          correo_institucional: collaborator.usfq_email || collaborator.personal_email,
          carrera_nombre: collaborator.major,
          semestre: collaborator.current_university_year,
          trajectory_status: normalizeStatus(collaborator.trajectory_status),
          created_at: collaborator.created_at,
        }))
      : [],
    meta: res.ok ? res.data.meta : { page: 1, limit: 20, total: 0 },
  };
};
