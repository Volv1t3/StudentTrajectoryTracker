export type AssignmentStatus = 'Activo' | 'Pausado' | 'Finalizado' | 'Removido';

export interface Assignment {
  id: number;
  collaborator_id: number;
  project_id: number;
  application_id: number | null;
  assigned_by_admin_id: number;
  role_in_project: string | null;
  assigned_at: string;
  ended_at: string | null;
  end_reason: string | null;
  status: AssignmentStatus;
}

export interface AssignmentRow extends Assignment {
  collaborator_name: string;
  collaborator_email: string;
  collaborator_usfq_email?: string | null;
  project_title: string;
  project_slug: string;
  assigned_by_admin_name?: string | null;
}

export interface AssignmentSummary {
  total: number;
  statusCounts: Record<AssignmentStatus, number>;
}

export interface ManualLinkagePayload {
  collaborator_id: number;
  project_id: number;
  reason_for_linking: string;
  role_in_project?: string;
  admin_notes?: string;
}

export interface CollaboratorAssignment {
  id: number;
  collaborator_id: number;
  project_id: number;
  application_id: number | null;
  assigned_by_admin_id: number | null;
  role_in_project: string | null;
  assigned_at: string;
  ended_at: string | null;
  end_reason: string | null;
  status: AssignmentStatus;
  project_title?: string;
  project_slug?: string;
  project_short_description?: string | null;
  project_status?: string | null;
  project_participation_mode?: string | null;
  project_categories?: Array<{ id: number; name: string; slug: string; category: string; is_system?: boolean }> | string | null;
  project_subcategories?: Array<{ id: number; name: string; slug: string; category: string; is_system?: boolean }> | string | null;
  meeting_days_summary?: string | null;
  meeting_days?: Array<{ day_of_week: string; time_from: string; time_to: string; notes?: string | null }> | string | null;
  responsible_admin_id?: number | null;
  responsible_admin_name?: string | null;
  responsible_admin_email?: string | null;
}
