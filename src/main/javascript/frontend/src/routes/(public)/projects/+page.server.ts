import type { PageServerLoad } from './$types';
import { apiGet } from '$lib/server/api';
import type { ProjectPublic, PaginatedResponse } from '$lib/types/proyecto';
import type { Tag } from '$lib/types/tag';

const PROJECT_STATUS_OPTIONS = ['Activo', 'En_Pausa', 'Completado', 'Archivado', 'Próximo'] as const;

function parseLegacySkillText(value?: string | null) {
  return (value || '')
    .split(/[,;\n]/)
    .map((skill) => skill.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

export const load: PageServerLoad = async ({ url }) => {
  const tag = url.searchParams.get('tag') || '';
  const status = url.searchParams.get('status') || '';
  const search = url.searchParams.get('search') || '';
  const page = url.searchParams.get('page') || '1';

  const params = new URLSearchParams();
  if (tag) params.set('tag', tag);
  if (status) params.set('status', status);
  if (search) params.set('search', search);
  params.set('page', page);

  const [projectsRes, tagsRes] = await Promise.all([
    apiGet<PaginatedResponse<ProjectPublic>>(`/api/public/projects?${params}`),
    apiGet<Tag[]>('/api/public/tags?scope=system'),
  ]);

  const rawProjects = projectsRes.ok ? projectsRes.data.data : [];
  const projects = rawProjects.map((p) => {
    const categories = p.categories ?? [];
    const requiredSkills = (p.required_skill_items ?? []).length > 0
      ? (p.required_skill_items ?? [])
      : parseLegacySkillText(p.required_skills);
    const weeklyMinutes = p.weekly_duration_minutes ?? 0;
    const weeklyHours = Math.floor(weeklyMinutes / 60);
    const weeklyMins = weeklyMinutes % 60;
    const durationLabel = weeklyMinutes === 0
      ? null
      : weeklyHours === 0
        ? `${weeklyMins}min/sem`
        : weeklyMins === 0
          ? `${weeklyHours} hrs/sem`
          : `${weeklyHours}h ${weeklyMins}min/sem`;
    return {
      id: p.id,
      nombre: p.title,
      slug: p.slug,
      estado: p.status,
      categorias: categories.map((category) => category.name),
      categoria: categories.map((category) => category.name).join(', ') || 'Sin categoría definida',
      descripcion_corta: p.short_description,
      duracion_semanal: durationLabel,
      modalidad: p.participation_mode || 'No definida',
      habilidades_requeridas: requiredSkills.map((skill) => skill.name),
      current_collaborator_count: p.current_collaborator_count ?? 0,
      max_collaborators: p.max_collaborators ?? null,
    };
  });

  return {
    projects,
    categories: tagsRes.ok ? tagsRes.data.map((tag) => tag.name) : [],
    meta: projectsRes.ok ? projectsRes.data.meta : { page: 1, limit: 20, total: 0 },
    tags: tagsRes.ok ? tagsRes.data : [],
    statusOptions: [...PROJECT_STATUS_OPTIONS],
    selectedFilters: {
      tag,
      status,
      search,
      page,
    },
  };
};
