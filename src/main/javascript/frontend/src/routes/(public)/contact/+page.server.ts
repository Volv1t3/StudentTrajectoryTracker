import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { apiGet, apiPost } from '$lib/server/api';
import type { ContactInfo, SocialLink } from '$lib/types/cms';
import { isUsfqEmail, normalizeEmail } from '$lib/utils';

export const load: PageServerLoad = async () => {
  const [contactRes, socialRes] = await Promise.all([
    apiGet<ContactInfo[]>('/api/public/content/contact_info'),
    apiGet<SocialLink[]>('/api/public/content/social_links'),
  ]);

  const contacts = contactRes.ok ? contactRes.data : [];
  const contact = contacts[0] ?? null;
  const socialLinks = socialRes.ok ? socialRes.data : [];

  const findSocial = (platform: string) => {
    const entry = socialLinks.find((link) => link.platform?.toLowerCase() === platform.toLowerCase());
    return entry?.url ?? '';
  };

  return {
    content: {
      first_name: contact?.first_name ?? '',
      middle_name: contact?.middle_name ?? '',
      last_name: contact?.last_name ?? '',
      title_description: contact?.title_description ?? '',
      contact_email: contact?.contact_email ?? '',
      contact_location: contact?.physical_location ?? '',
      contact_availability: [contact?.cta_headline, contact?.cta_description].filter(Boolean).join(': ') || '',
      social_instagram: findSocial('instagram'),
      social_usfq: findSocial('usfq')
    }
  };
};

export const actions: Actions = {
  submitContact: async ({ request }) => {
    const form = await request.formData();

    const name = String(form.get('nombre') || '').trim();
    const email = normalizeEmail(String(form.get('correo') || ''));
    const subject = String(form.get('asunto') || '').trim();
    const message = String(form.get('mensaje') || '').trim();
    if (!name) return fail(400, { errors: { nombre: 'El nombre es requerido' } });
    if (!email) return fail(400, { errors: { correo: 'El correo es requerido' } });
    if (!subject) return fail(400, { errors: { asunto: 'El asunto es requerido' } });
    if (!message) return fail(400, { errors: { mensaje: 'El mensaje es requerido' } });

    const res = await apiPost('/api/public/contact', {
      name,
      email,
      subject,
      message
    });

    if (!res.ok) {
      const msg = (res.data as any)?.error?.message || 'No se pudo enviar el mensaje';
      return fail(res.status, { error: msg });
    }

    return { success: true };
  }
};
