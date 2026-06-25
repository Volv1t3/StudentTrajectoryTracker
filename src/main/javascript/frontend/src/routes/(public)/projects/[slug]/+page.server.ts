import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { apiGet, apiAuthenticated } from '$lib/server/api';
import type { Application, CollaboratorAssignment, ProjectPublic } from '$lib/types';

function parseLegacySkillText(value?: string | null) {
  return (value || '')
    .split(/[,;\n]/)
    .map((skill) => skill.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

export const load: PageServerLoad = async ({ params, locals, cookies }) => {
  const [projectRes, profileRes, appsRes, assignmentsRes] = await Promise.all([
    apiGet<ProjectPublic>(`/api/public/projects/${params.slug}`),
    locals.user ? apiAuthenticated<any>('/api/app/profile', cookies) : Promise.resolve(null),
    locals.user ? apiAuthenticated<Application[]>('/api/app/applications', cookies) : Promise.resolve(null),
    locals.user ? apiAuthenticated<CollaboratorAssignment[]>('/api/app/assignments', cookies) : Promise.resolve(null),
  ]);
  if (!projectRes.ok) throw error(404, 'Proyecto no encontrado');

  const p = projectRes.data;
  const responsibleManager = p.managers?.find((manager) => manager.is_primary) ?? p.managers?.[0] ?? null;
  const responsibleName = responsibleManager
    ? [responsibleManager.first_name, responsibleManager.middle_name, responsibleManager.last_name, responsibleManager.second_last_name]
        .filter(Boolean)
        .join(' ')
    : null;
  const requiredSkills = (p.required_skill_items ?? []).length > 0
    ? (p.required_skill_items ?? [])
    : parseLegacySkillText(p.required_skills);
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
    estado: p.status,
    categoria: (p.categories ?? []).map((tag) => tag.name).join(', ') || 'Sin categoría definida',
    descripcion_corta: p.short_description,
    descripcion_larga: p.full_description,
    disponibilidad_semanal_requerida: durationLabel,
    modalidad: p.participation_mode || 'No definida',
    habilidades_requeridas: requiredSkills.map((skill) => skill.name),
    categorias: (p.categories ?? []).map((tag) => ({ id: tag.id, name: tag.name, slug: tag.slug, category: tag.category })),
    subcategorias: (p.subcategories ?? []).map((tag) => ({ id: tag.id, name: tag.name, slug: tag.slug, category: tag.category })),
    header_image_url: p.header_image_url,
    video_url: p.video_url,
    meeting_days: p.meeting_days ?? [],
    meeting_days_summary: p.meeting_days_summary,
    responsable_nombre: responsibleName,
    responsable_usfq_email: responsibleManager?.usfq_email ?? null,
    current_collaborator_count: p.current_collaborator_count ?? 0,
    max_collaborators: p.max_collaborators ?? null,
  };

  const activeAssignmentCount = profileRes?.ok ? Number(profileRes.data?.active_assignment_count || 0) : 0;
  const hasReachedProjectLimit = activeAssignmentCount >= 2;
  const applications = appsRes?.ok ? appsRes.data : [];
  const assignments = assignmentsRes?.ok ? assignmentsRes.data : [];
  const hasLiveApplicationForProject = applications.some(
    (application) => application.project_id === project.id && ['Pendiente', 'En_Revisión'].includes(application.status),
  );
  const hasLiveAssignmentForProject = assignments.some(
    (assignment) => assignment.project_id === project.id && ['Activo', 'Pausado'].includes(assignment.status),
  );
  const isProjectFull = project.max_collaborators !== null && project.current_collaborator_count >= project.max_collaborators;
  const projectAcceptsApplications = project.estado === 'Activo';

  return {
    project,
    user: locals.user,
    activeAssignmentCount,
    hasReachedProjectLimit,
    hasLiveApplicationForProject,
    hasLiveAssignmentForProject,
    isProjectFull,
    projectAcceptsApplications,
  };
};
