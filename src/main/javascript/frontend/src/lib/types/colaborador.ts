export type TrajectoryStatus = 'nuevo' | 'en_revision' | 'contactado' | 'vinculado' | 'inactivo';

export interface Collaborator {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  second_last_name: string | null;
  personal_email: string;
  usfq_email: string | null;
  phone_number: string | null;
  date_of_birth: string | null;
  password_hash?: string | null;
  major: string;
  current_university_year: number;
  expected_graduation_year: number;
  experience_description: string | null;
  motivation_description: string | null;
  interest_in_machinery: boolean;
  interest_in_design: boolean;
  interest_in_materials: boolean;
  trajectory_status: TrajectoryStatus | 'Nuevo' | 'En_Revisión' | 'Contactado' | 'Vinculado' | 'Inactivo';
  is_active?: boolean;
  profile_complete: boolean;
  intake_source: string | null;
  created_at: string;
  updated_at: string;
}

/** Minimal user info exposed to layout/session */
export interface CollaboratorPublic {
  id: number;
  first_name: string;
  last_name: string;
  personal_email: string;
  trajectory_status: TrajectoryStatus;
}

/** Admin view with computed fields */
export interface CollaboratorAdmin extends Collaborator {
  active_assignment_count: number;
  pending_application_count: number;
  tags: { id: number; name: string; category: string }[] | null;
}
