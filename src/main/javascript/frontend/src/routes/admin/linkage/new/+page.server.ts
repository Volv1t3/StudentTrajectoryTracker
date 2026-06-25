import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { apiGet, apiPost } from '$lib/server/api';
import { getAdminAccessToken } from '$lib/server/auth';
import type {
  ManualLinkagePayload,
  Project,
  ProjectMeetingDayEntry,
} from '$lib/types';

type ProjectTag = {
  id: number;
  name: string;
  slug: string;
  category: string;
  is_system?: boolean;
};

type ProjectOptionApi = Project & {
  tags?: ProjectTag[] | string | null;
  categories?: ProjectTag[] | string | null;
  subcategories?: ProjectTag[] | string | null;
  required_skill_items?: Array<{ id?: number; name: string; slug?: string }> | string | null;
  meeting_days?: ProjectMeetingDayEntry[] | string | null;
  meeting_days_summary?: string | null;
  responsible_admin_id?: number | null;
  responsible_admin_name?: string | null;
  responsible_admin_email?: string | null;
};

type CollaboratorTag = {
  id: number;
  name: string;
  category?: string;
};

type AvailabilitySlot = {
  day_of_week: string;
  time_from: string;
  time_to: string;
  notes?: string | null;
};

type CollaboratorOptionApi = {
  id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  second_last_name?: string | null;
  personal_email: string;
  usfq_email?: string | null;
  phone_number?: string | null;
  major?: string | null;
  current_university_year?: number | null;
  expected_graduation_year?: number | null;
  experience_description?: string | null;
  motivation_description?: string | null;
  trajectory_status?: string | null;
  tags?: CollaboratorTag[] | string | null;
  availability_slots?: AvailabilitySlot[] | string | null;
};

type PaginatedResponse<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number };
};

function getErrorMessage(data: unknown, fallback: string) {
  const payload = data as { error?: { message?: string } } | null;
  return payload?.error?.message || fallback;
}

function parseJsonArray<T>(value: T[] | string | null | undefined): T[] {
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

function buildFullName({
  first_name,
  middle_name,
  last_name,
  second_last_name,
}: {
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  second_last_name?: string | null;
}) {
  return [first_name, middle_name, last_name, second_last_name]
    .filter((part) => typeof part === 'string' && part.trim().length > 0)
    .join(' ');
}

function parseLegacySkillText(value?: string | null) {
  return (value || '')
    .split(/[,;\n]/)
    .map((skill) => skill.trim())
    .filter(Boolean)
    .map((name) => ({ name, slug: name.toLowerCase().replace(/\s+/g, '-') }));
}

function parsePositiveInteger(value: FormDataEntryValue | null) {
  const normalized = Number(value);
  return Number.isInteger(normalized) && normalized > 0 ? normalized : null;
}

function normalizeOptionalString(value: FormDataEntryValue | null) {
  const normalized = String(value || '').trim();
  return normalized.length > 0 ? normalized : undefined;
}

export const load: PageServerLoad = async ({ cookies }) => {
  const token = getAdminAccessToken(cookies)!;

  const [projectsRes, collaboratorsRes, assignmentsRes] = await Promise.all([
    apiGet<PaginatedResponse<ProjectOptionApi>>('/api/admin/projects?page=1&limit=200', token),
    apiGet<PaginatedResponse<CollaboratorOptionApi>>('/api/admin/collaborators?page=1&limit=500', token),
    apiGet<{ data: { collaborator_id: number; project_id: number; status: string }[] }>('/api/admin/assignments', token),
  ]);

  return {
    activeAssignments: (assignmentsRes.ok ? (assignmentsRes.data?.data ?? []) : [])
      .filter((a) => a.status === 'Activo' || a.status === 'Pausado')
      .map((a) => ({ collaborator_id: a.collaborator_id, project_id: a.project_id })),
    projects: (projectsRes.ok ? projectsRes.data.data : []).map((project) => {
      const tags = parseJsonArray<ProjectTag>(project.tags);
      const categories = parseJsonArray<ProjectTag>(project.categories).length > 0
        ? parseJsonArray<ProjectTag>(project.categories)
        : tags.filter((tag) => tag.is_system);
      const subcategories = parseJsonArray<ProjectTag>(project.subcategories).length > 0
        ? parseJsonArray<ProjectTag>(project.subcategories)
        : tags.filter((tag) => !tag.is_system);
      const requiredSkills = parseJsonArray<{ id?: number; name: string; slug?: string }>(project.required_skill_items);
      const meetingDays = parseJsonArray<ProjectMeetingDayEntry>(project.meeting_days);

      return {
        id: project.id,
        title: project.title,
        slug: project.slug,
        short_description: project.short_description,
        full_description: project.full_description,
        target_audience: project.target_audience,
        required_skills: project.required_skills,
        required_skill_items: requiredSkills.length > 0 ? requiredSkills : parseLegacySkillText(project.required_skills),
        meeting_days: meetingDays,
        meeting_days_summary: project.meeting_days_summary || meetingDays.map((day) => `${day.day_of_week} ${day.start_time}-${day.end_time}`).join(', '),
        max_collaborators: project.max_collaborators,
        current_collaborator_count: project.current_collaborator_count,
        status: project.status,
        categories,
        subcategories,
        responsible_admin_id: project.responsible_admin_id || null,
        responsible_admin_name: project.responsible_admin_name || 'Sin responsable',
        responsible_admin_email: project.responsible_admin_email || null,
      };
    }),
    collaborators: (collaboratorsRes.ok ? collaboratorsRes.data.data : []).map((collaborator) => {
      const tags = parseJsonArray<CollaboratorTag>(collaborator.tags).filter((tag) => tag?.name);
      const availabilitySlots = parseJsonArray<AvailabilitySlot>(collaborator.availability_slots).filter((slot) => slot?.day_of_week);
      return {
        id: collaborator.id,
        first_name: collaborator.first_name,
        middle_name: collaborator.middle_name || '',
        last_name: collaborator.last_name,
        second_last_name: collaborator.second_last_name || '',
        full_name: buildFullName(collaborator),
        personal_email: collaborator.personal_email,
        usfq_email: collaborator.usfq_email || '',
        phone_number: collaborator.phone_number || '',
        major: collaborator.major || '',
        current_university_year: collaborator.current_university_year || null,
        expected_graduation_year: collaborator.expected_graduation_year || null,
        experience_description: collaborator.experience_description || '',
        motivation_description: collaborator.motivation_description || '',
        trajectory_status: collaborator.trajectory_status || 'Nuevo',
        tags,
        availability_slots: availabilitySlots,
      };
    }),
  };
};

export const actions: Actions = {
  createManual: async ({ request, cookies }) => {
    const token = getAdminAccessToken(cookies)!;
    const form = await request.formData();
    const collaboratorId = parsePositiveInteger(form.get('collaborator_id'));
    const projectId = parsePositiveInteger(form.get('project_id'));
    const reasonForLinking = String(form.get('reason_for_linking') || '').trim();

    if (!projectId) {
      return fail(400, { error: 'Selecciona un proyecto válido' });
    }

    if (!collaboratorId) {
      return fail(400, { error: 'Selecciona un colaborador válido' });
    }

    if (reasonForLinking.length < 20) {
      return fail(400, { error: 'El motivo de vinculación debe tener al menos 20 caracteres' });
    }

    const body: ManualLinkagePayload = {
      collaborator_id: collaboratorId,
      project_id: projectId,
      reason_for_linking: reasonForLinking,
      role_in_project: normalizeOptionalString(form.get('role_in_project')),
      admin_notes: normalizeOptionalString(form.get('admin_notes')),
    };

    const res = await apiPost('/api/admin/assignments', body, token);
    if (!res.ok) {
      return fail(res.status, {
        error: getErrorMessage(res.data, 'No se pudo crear la vinculación manual'),
      });
    }

    throw redirect(303, '/admin/linkage');
  },
};
