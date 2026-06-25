export type AuditActorType = 'administrator' | 'system';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'assign'
  | 'unassign'
  | 'status_change'
  | 'login';

export interface AuditLog {
  id: number;
  actor_type: AuditActorType;
  actor_id: number | null;
  action: AuditAction;
  entity_type: string;
  entity_id: number;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  description: string | null;
  ip_address: string | null;
  created_at: string;
}
