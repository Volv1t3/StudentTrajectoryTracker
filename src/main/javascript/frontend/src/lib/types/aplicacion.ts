export type ApplicationStatus = 'Pendiente' | 'En_Revisión' | 'Aprobada' | 'Rechazada' | 'Retirada';

export interface Application {
  id: number;
  collaborator_id: number;
  project_id: number;
  reason_for_applying: string;
  status: ApplicationStatus;
  applied_at: string;
  reviewed_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  approver_admin_id: number | null;
  admin_notes: string | null;
}
