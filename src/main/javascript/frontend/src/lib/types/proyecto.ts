export type ProjectStatus = 'Activo' | 'En_Pausa' | 'Completado' | 'Archivado' | 'Próximo';

export interface ProjectMeetingDayEntry {
  id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  notes: string | null;
}

export interface Project {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  target_audience: string | null;
  required_skills: string | null;
  participation_mode: 'Presencial' | 'Remoto' | 'Híbrido' | null;
  header_image_media_asset_id: number | null;
  video_media_asset_id: number | null;
  header_image_url: string | null;
  video_url: string | null;
  status: ProjectStatus;
  is_highlighted: boolean;
  is_visible: boolean;
  max_collaborators: number | null;
  current_collaborator_count: number;
  created_by_admin_id: number;
  created_at: string;
  updated_at: string;
}

/** Public view from vw_public_projects */
export interface ProjectPublic extends Project {
  tags: { id: number; name: string; slug: string; category: string; is_system?: boolean }[] | null;
  categories?: { id: number; name: string; slug: string; category: string; is_system?: boolean }[] | null;
  subcategories?: { id: number; name: string; slug: string; category: string; is_system?: boolean }[] | null;
  required_skill_items?: { id: number; name: string; slug: string }[] | null;
  meeting_days: ProjectMeetingDayEntry[] | null;
  meeting_days_summary: string | null;
  weekly_duration_minutes: number | null;
  managers?: Array<{
    id: number;
    project_id: number;
    admin_id: number;
    is_primary: boolean;
    assigned_at: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    second_last_name: string | null;
    usfq_email: string;
    personal_email: string;
  }> | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}
