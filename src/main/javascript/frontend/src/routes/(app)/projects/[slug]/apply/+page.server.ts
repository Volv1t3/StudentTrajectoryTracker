import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { apiGet, apiAuthenticated } from '$lib/server/api';
import type { Application, CollaboratorAssignment, ProjectPublic } from '$lib/types';

type ApiErrorResponse = {
  error?: {
    message?: string;
  };
};

function getErrorMessage(data: unknown, fallback: string): string {
  const payload = data as ApiErrorResponse | null;
  return payload?.error?.message || fallback;
}

export const load: PageServerLoad = async ({ params, cookies }) => {
  const [projectRes, appsRes, profileRes, assignmentsRes] = await Promise.all([
    apiGet<ProjectPublic>(`/api/public/projects/${params.slug}`),
    apiAuthenticated<Application[]>('/api/app/applications', cookies),
    apiAuthenticated<any>('/api/app/profile', cookies),
    apiAuthenticated<CollaboratorAssignment[]>('/api/app/assignments', cookies),
  ]);

  if (!projectRes.ok) {
    throw error(404, 'Proyecto no encontrado');
  }

  const p = projectRes.data;

  const weeklyMinutes = p.weekly_duration_minutes ?? 0;
  const weeklyHours = Math.floor(weeklyMinutes / 60);
  const weeklyMins = weeklyMinutes % 60;
  const durationLabel = weeklyMinutes === 0
    ? null
    : weeklyHours === 0
      ? `${weeklyMins}min/semana`
      : weeklyMins === 0
        ? `${weeklyHours} horas/semana`
        : `${weeklyHours}h ${weeklyMins}min/semana`;
  const project = {
    id: p.id,
    nombre: p.title,
    slug: p.slug,
    disponibilidad_semanal_requerida: durationLabel,
    modalidad: p.participation_mode || 'No definida',
    categoria: p.tags?.[0]?.category || 'General',
    current_collaborator_count: p.current_collaborator_count ?? 0,
    max_collaborators: p.max_collaborators ?? null,
    estado: p.status,
  };

  const applications = appsRes.ok ? appsRes.data : [];
  const assignments = assignmentsRes.ok ? assignmentsRes.data : [];
  const hasLiveApplicationForProject = applications.some((a) => a.project_id === project.id && ['Pendiente', 'En_Revisión'].includes(a.status));
  const hasLiveAssignmentForProject = assignments.some((assignment) => assignment.project_id === project.id && ['Activo', 'Pausado'].includes(assignment.status));
  const activeAssignmentCount = profileRes.ok ? Number(profileRes.data?.active_assignment_count || 0) : 0;
  const hasReachedProjectLimit = activeAssignmentCount >= 2;
  const isProjectFull = project.max_collaborators !== null && project.current_collaborator_count >= project.max_collaborators;
  const projectAcceptsApplications = project.estado === 'Activo';

  return {
    project,
    hasLiveApplicationForProject,
    hasLiveAssignmentForProject,
    activeAssignmentCount,
    hasReachedProjectLimit,
    isProjectFull,
    projectAcceptsApplications,
  };
};

export const actions: Actions = {
  applyToProject: async ({ request, cookies, params }) => {
    const data = await request.formData();
    const project_id = Number(data.get('proyecto_id'));
    const reason_for_applying = (data.get('mensaje_motivacion') as string) || '';
    const disponibilidad_confirmada = data.get('disponibilidad_confirmada');

    if (!project_id) {
      return fail(400, { errors: { mensaje_motivacion: 'Proyecto inválido' } });
    }

    if (!reason_for_applying || reason_for_applying.length < 20) {
      return fail(400, { errors: { mensaje_motivacion: 'Mínimo 20 caracteres' } });
    }

    if (!disponibilidad_confirmada) {
      return fail(400, { errors: { disponibilidad_confirmada: 'Debes confirmar tu disponibilidad' } });
    }

    const [projectRes, appsRes, assignmentsRes, profileRes] = await Promise.all([
      apiGet<ProjectPublic>(`/api/public/projects/${params.slug}`),
      apiAuthenticated<Application[]>('/api/app/applications', cookies),
      apiAuthenticated<CollaboratorAssignment[]>('/api/app/assignments', cookies),
      apiAuthenticated<any>('/api/app/profile', cookies),
    ]);

    if (!projectRes.ok) {
      return fail(404, { error: 'Proyecto no encontrado' });
    }

    const project = projectRes.data;
    const applications = appsRes.ok ? appsRes.data : [];
    const assignments = assignmentsRes.ok ? assignmentsRes.data : [];
    const activeAssignmentCount = profileRes.ok ? Number(profileRes.data?.active_assignment_count || 0) : 0;

    if (project.status !== 'Activo') {
      return fail(409, { error: 'El proyecto no está aceptando solicitudes en este momento' });
    }

    if (project.max_collaborators !== null && project.current_collaborator_count >= project.max_collaborators) {
      return fail(409, { error: 'El proyecto ya alcanzó su cupo máximo' });
    }

    if (assignments.some((assignment) => assignment.project_id === project_id && ['Activo', 'Pausado'].includes(assignment.status))) {
      return fail(409, { error: 'Ya tienes una vinculación activa o pausada con este proyecto' });
    }

    if (applications.some((application) => application.project_id === project_id && ['Pendiente', 'En_Revisión'].includes(application.status))) {
      return fail(409, { error: 'Ya tienes una solicitud pendiente o en revisión para este proyecto' });
    }

    if (activeAssignmentCount >= 2) {
      return fail(409, { error: 'Ya alcanzaste el máximo de 2 proyectos activos' });
    }

    const res = await apiAuthenticated('/api/app/applications', cookies, {
      method: 'POST',
      body: { project_id, reason_for_applying }
    });

    if (!res.ok) {
      return fail(res.status, { error: getErrorMessage(res.data, 'No se pudo enviar la solicitud') });
    }

    return { success: true };
  }
};
