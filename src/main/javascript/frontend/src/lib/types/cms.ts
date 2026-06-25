export interface HomeHero {
  id: number;
  headline: string;
  subheadline: string | null;
  primary_cta_label: string;
  primary_cta_url: string;
  secondary_cta_label: string | null;
  secondary_cta_url: string | null;
  background_image_url: string | null;
  is_active: boolean;
  updated_by_admin_id: number | null;
  updated_at: string;
}

export interface DlabIdentity {
  id: number;
  title: string;
  body: string;
  mission_title: string | null;
  mission_body: string | null;
  vision_title: string | null;
  vision_body: string | null;
  image_url: string | null;
  video_url: string | null;
  is_active: boolean;
  updated_by_admin_id: number | null;
  updated_at: string;
}

export interface ValueProposition {
  id: number;
  title: string;
  description: string;
  icon_identifier: string | null;
  image_url: string | null;
  target_audience: string | null;
  sort_order: number;
  is_visible: boolean;
  updated_by_admin_id: number | null;
  updated_at: string;
}

export interface ParticipationStep {
  id: number;
  step_number: number;
  title: string;
  description: string;
  icon_identifier: string | null;
  is_visible: boolean;
  updated_by_admin_id: number | null;
  updated_at: string;
}

export interface ContactInfo {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  title_description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  physical_location: string | null;
  maps_url: string | null;
  cta_headline: string | null;
  cta_description: string | null;
  is_active: boolean;
  updated_by_admin_id: number | null;
  updated_at: string;
}

export interface SocialLink {
  id: number;
  platform: string;
  url: string;
  icon_identifier: string | null;
  sort_order: number;
  is_visible: boolean;
  updated_by_admin_id: number | null;
  updated_at: string;
}
