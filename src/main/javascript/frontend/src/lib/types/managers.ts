export interface ProjectManager {
  id: number;
  project_id: number;
  admin_id: number;
  is_primary: boolean;
  assigned_at: string;
}

export interface EventManager {
  id: number;
  event_id: number;
  admin_id: number;
  is_primary: boolean;
  assigned_at: string;
}
