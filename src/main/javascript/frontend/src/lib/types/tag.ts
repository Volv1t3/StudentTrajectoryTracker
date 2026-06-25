export type TagCategory = 'Materiales' | 'Maquinaria' | 'Diseño' | 'Software' | 'Investigación' | 'General';

export interface Tag {
  id: number;
  name: string;
  slug: string;
  category: TagCategory;
  is_system: boolean;
  created_by_admin_id: number | null;
  created_at: string;
}
