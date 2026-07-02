import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { apiDelete, apiGet, apiPatch } from '$lib/server/api';
import { getAdminAccessToken } from '$lib/server/auth';
import type {
  AssignmentRow,
  AssignmentStatus,
  AssignmentSummary,
  Project,
  ProjectMeetingDayEntry,
} from '$lib/types';

type ApiErrorResponse = {
  error?: {
    message?: string;
  };
};

type AssignmentListResponse = {
  data: AssignmentRow[];
  summary?: {
    total?: number;
    status_counts?: Record<string, number>;
  };
};

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

type PaginatedResponse<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number };
};

function getErrorMessage(data: unknown, fallback: string) {
  const payload = data as ApiErrorResponse | null;
  return payload?.error?.message || fallback;
}

function normalizeAssignmentResponse(payload: AssignmentListResponse | AssignmentRow[] | null | undefined) {
  if (Array.isArray(payload)) {
    return {
      rows: payload,
      summary: undefined,
    };
  }

  return {
    rows: Array.isArray(payload?.data) ? payload.data : [],
    summary: payload?.summary,
  };
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

function parseLegacySkillText(value?: string | null) {
  return (value || '')
    .split(/[,;\n]/)
    .map((skill) => skill.trim())
    .filter(Boolean)
    .map((name) => ({ name, slug: name.toLowerCase().replace(/\s+/g, '-') }));
}

export const load: PageServerLoad = async ({ cookies }) => {
  const token = getAdminAccessToken(cookies)!;

  const [assignmentsRes, projectsRes] = await Promise.all([
    apiGet<AssignmentListResponse | AssignmentRow[]>('/api/admin/assignments', token),
    apiGet<PaginatedResponse<ProjectOptionApi>>('/api/admin/projects?page=1&limit=200', token),
  ]);

  const assignmentPayload = assignmentsRes.ok ? normalizeAssignmentResponse(assignmentsRes.data) : { rows: [], summary: undefined };

  // console.log(assignmentPayload) This is being received and has the two mapped filters
  const summary: AssignmentSummary = assignmentsRes.ok
    ? {
        total: Number(assignmentPayload.summary?.total || assignmentPayload.rows.length || 0),
        statusCounts: {
          Activo: Number(assignmentPayload.summary?.status_counts?.Activo || assignmentPayload.rows.filter((row) => row.status === 'Activo').length || 0),
          Pausado: Number(assignmentPayload.summary?.status_counts?.Pausado || assignmentPayload.rows.filter((row) => row.status === 'Pausado').length || 0),
          Finalizado: Number(assignmentPayload.summary?.status_counts?.Finalizado || assignmentPayload.rows.filter((row) => row.status === 'Finalizado').length || 0),
          Removido: Number(assignmentPayload.summary?.status_counts?.Removido || assignmentPayload.rows.filter((row) => row.status === 'Removido').length || 0),
        },
      }
    : {
        total: 0,
        statusCounts: { Activo: 0, Pausado: 0, Finalizado: 0, Removido: 0 },
      };

  return {
    linkages: assignmentPayload.rows,
    summary,
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
  };
};

export const actions: Actions = {
  updateLinkage: async ({ request, cookies }) => {
    const token = getAdminAccessToken(cookies)!;
    const form = await request.formData();
    const id = String(form.get('id') || '');
    const status = String(form.get('status') || '').trim() as AssignmentStatus | '';
    const roleInProject = String(form.get('role_in_project') || '').trim();
    const endReason = String(form.get('end_reason') || '').trim();
    const body: Record<string, string> = {};

    if (status) body.status = status;
    body.role_in_project = roleInProject;
    if (endReason) body.end_reason = endReason;

    const res = await apiPatch(`/api/admin/assignments/${id}`, body, token);
    if (!res.ok) {
      const apiError = (res.data as any)?.error ?? null;
      return fail(res.status, {
        scope: 'edit',
        assignmentId: Number(id),
        error: getErrorMessage(res.data, 'No se pudo actualizar la vinculación'),
        apiError,
      });
    }

    return { success: true };
  },

  deleteLinkage: async ({ request, cookies }) => {
    const token = getAdminAccessToken(cookies)!;
    const form = await request.formData();
    const id = String(form.get('id') || '');
    const res = await apiDelete(`/api/admin/assignments/${id}`, token);

    if (!res.ok) {
      const apiError = (res.data as any)?.error ?? null;
      return fail(res.status, {
        scope: 'edit',
        assignmentId: Number(id),
        error: getErrorMessage(res.data, 'No se pudo eliminar la vinculación'),
        apiError,
      });
    }

    return { success: true };
  },
};
