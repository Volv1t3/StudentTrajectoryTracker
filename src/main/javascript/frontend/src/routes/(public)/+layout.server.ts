import type { LayoutServerLoad } from './$types';
import { apiGet } from '$lib/server/api';
import type { ContactInfo, SocialLink } from '$lib/types/cms';

export const load: LayoutServerLoad = async ({ locals }) => {
  const [contactRes, socialRes, logoRes] = await Promise.all([
    apiGet<ContactInfo[]>('/api/public/content/contact_info'),
    apiGet<SocialLink[]>('/api/public/content/social_links'),
    apiGet<any[]>('/api/public/media?entity_type=navigation_logo'),
  ]);

  const contacts = contactRes.ok ? contactRes.data : [];
  const contact = contacts[0] ?? null;
  const socialLinks = socialRes.ok ? socialRes.data : [];
  const logos = logoRes.ok ? logoRes.data : [];

  const findSocial = (platform: string) => {
    const entry = socialLinks.find((link) => link.platform?.toLowerCase() === platform.toLowerCase());
    return entry?.url ?? '';
  };

  return {
    logo: logos[0]?.public_url ?? null,
    siteContent: {
      footer_tagline: 'Development Lab — USFQ',
      contact_email: contact?.contact_email ?? '',
      contact_location: contact?.physical_location ?? '',
      social_instagram: findSocial('instagram'),
      social_usfq: findSocial('usfq')
    }
  };
};
