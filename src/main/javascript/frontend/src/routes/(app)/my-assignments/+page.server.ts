import type { PageServerLoad } from './$types';
import { apiAuthenticated } from '$lib/server/api';
import type { CollaboratorAssignment } from '$lib/types';

type AssignmentTag = {
  id: number;
  name: string;
  slug: string;
  category: string;
  is_system?: boolean;
};

function parseTags(value: CollaboratorAssignment['project_categories'] | CollaboratorAssignment['project_subcategories']) {
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

function parseMeetingDays(value: CollaboratorAssignment['meeting_days']): Array<{ day_of_week: string; time_from: string; time_to: string; notes: string }> {
  if (Array.isArray(value)) {
    return value.map((day) => ({
      day_of_week: day.day_of_week,
      time_from: day.time_from,
      time_to: day.time_to,
      notes: day.notes ?? '',
    }));
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.map((day) => ({
            day_of_week: day.day_of_week,
            time_from: day.time_from,
            time_to: day.time_to,
            notes: day.notes ?? '',
          }))
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

export const load: PageServerLoad = async ({ cookies, url }) => {
  const status = url.searchParams.get('status') || '';
  const params = status ? `?status=${status}` : '';
  const res = await apiAuthenticated<CollaboratorAssignment[]>(`/api/app/assignments${params}`, cookies);

  const assignments = (res.ok ? res.data : []).map((assignment) => {
    const categories = parseTags(assignment.project_categories) as AssignmentTag[];
    const subcategories = parseTags(assignment.project_subcategories) as AssignmentTag[];
    const meetingDays = parseMeetingDays(assignment.meeting_days);

    return {
      ...assignment,
      categories,
      subcategories,
      project_title: assignment.project_title || `Proyecto #${assignment.project_id}`,
      project_slug: assignment.project_slug || '',
      project_short_description: assignment.project_short_description || '',
      project_status: assignment.project_status || 'No definido',
      modality: assignment.project_participation_mode || 'No definida',
      role_label: assignment.role_in_project || 'Sin rol asignado',
      responsible_admin_name: assignment.responsible_admin_name || 'Sin responsable',
      responsible_admin_email: assignment.responsible_admin_email || null,
      meeting_days_summary: assignment.meeting_days_summary || 'Sin horarios definidos',
      meeting_days: meetingDays,
    };
  });

  return { assignments };
};
