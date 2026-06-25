export type StorageType = 'local' | 'cloud';

export interface MediaAsset {
  id: number;
  original_filename: string;
  stored_filename: string;
  public_url: string;
  storage_type: StorageType;
  storage_path: string | null;
  mime_type: string;
  file_size_bytes: number | null;
  entity_type: string | null;
  entity_id: number | null;
  alt_text: string | null;
  caption: string | null;
  uploaded_by_admin_id: number | null;
  created_at: string;
}
