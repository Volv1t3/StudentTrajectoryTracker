import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { apiGet, apiAuthenticated } from '$lib/server/api';
import type { Tag } from '$lib/types/tag';

export const load: PageServerLoad = async ({ cookies }) => {
  const [profileRes, tagsRes, availabilityRes] = await Promise.all([
    apiAuthenticated<any>('/api/app/profile', cookies),
    apiGet<Tag[]>('/api/public/tags'),
    apiAuthenticated<{ slots: any[] }>('/api/app/availability', cookies),
  ]);

  const p = profileRes.ok ? profileRes.data : null;
  const slots = availabilityRes.ok ? (availabilityRes.data?.slots || []) : [];

  return {
    colaborador: p
      ? {
          id: p.id,
          firstName: p.first_name || '',
          middleName: p.middle_name || '',
          lastName: p.last_name || '',
          secondLastName: p.second_last_name || '',
          personalEmail: p.personal_email || '',
          usfqEmail: p.usfq_email || '',
          phoneNumber: p.phone_number || '',
          dateOfBirth: p.date_of_birth ? new Date(p.date_of_birth).toISOString().slice(0, 10) : '',
          major: p.major || '',
          currentUniversityYear: p.current_university_year || 1,
          expectedGraduationYear: p.expected_graduation_year || new Date().getFullYear() + 1,
          experienceDescription: p.experience_description || '',
          motivationDescription: p.motivation_description || '',
          interestInMachinery: Boolean(p.interest_in_machinery),
          interestInDesign: Boolean(p.interest_in_design),
          interestInMaterials: Boolean(p.interest_in_materials),
          trajectoryStatus: p.trajectory_status || 'Nuevo',
          profileComplete: Boolean(p.profile_complete),
          habilidades: (p.tags || []).map((t: any) => t?.name).filter(Boolean),
          habilidadIds: (p.tags || []).map((t: any) => t?.id).filter(Boolean),
          availabilitySlots: slots,
        }
      : null,
    allTags: tagsRes.ok ? tagsRes.data : [],
  };
};

export const actions: Actions = {
  updateProfile: async ({ request, cookies }) => {
    const form = await request.formData();

    // Create new tags first
    const newTags = form.getAll('new_tags').map(t => String(t).trim()).filter(Boolean);
    const newTagIds: number[] = [];
    
    for (const tagName of newTags) {
      const res = await apiAuthenticated<{ id: number }>('/api/app/tags', cookies, {
        method: 'POST',
        body: { name: tagName }
      });
      if (!res.ok) {
        const apiError = (res.data as any)?.error ?? null;
        const msg = apiError?.message || `No se pudo crear la habilidad "${tagName}"`;
        return fail(res.status, { error: msg, apiError });
      }
      if (!res.data?.id) {
        const msg = `La habilidad "${tagName}" no devolvió un identificador válido`;
        return fail(500, { error: msg, apiError: { code: 'ERR_TAG_CREATE', message: msg } });
      }
      newTagIds.push(res.data.id);
    }

    // Only send fields that the user actually submitted
    const body: Record<string, unknown> = {};

    const str = (key: string) => { const v = form.get(key) as string | null; return v?.trim() || undefined; };
    const num = (key: string) => { const v = form.get(key) as string | null; const n = Number(v); return Number.isFinite(n) ? n : undefined; };

    if (str('firstName')) body.firstName = str('firstName');
    if (str('middleName') !== undefined) body.middleName = str('middleName') || null;
    if (str('lastName')) body.lastName = str('lastName');
    if (str('secondLastName') !== undefined) body.secondLastName = str('secondLastName') || null;
    if (str('personalEmail')) body.personalEmail = str('personalEmail');
    // Do not allow updating institutional (USFQ) email from profile edit.
    // Institutional email must be managed separately (keep current behavior: ignore any usfqEmail field).
    if (str('phoneNumber') !== undefined) body.phoneNumber = str('phoneNumber') || null;
    if (str('dateOfBirth')) body.dateOfBirth = str('dateOfBirth');
    if (str('major')) body.major = str('major');
    if (num('currentUniversityYear')) body.currentUniversityYear = num('currentUniversityYear');
    if (num('expectedGraduationYear')) body.expectedGraduationYear = num('expectedGraduationYear');
    if (form.has('experienceDescription')) body.experienceDescription = str('experienceDescription') || null;
    if (form.has('motivationDescription')) body.motivationDescription = str('motivationDescription') || null;
    
    // Checkboxes: always send explicit boolean values (required NOT NULL in DB)
    body.interestInMachinery = form.has('interestInMachinery') ? form.getAll('interestInMachinery').includes('true') : false;
    body.interestInDesign = form.has('interestInDesign') ? form.getAll('interestInDesign').includes('true') : false;
    body.interestInMaterials = form.has('interestInMaterials') ? form.getAll('interestInMaterials').includes('true') : false;

    // Combine existing tag IDs with newly created ones
    const existingTagIds = form.getAll('tag_ids').map(Number).filter((id) => Number.isInteger(id) && id > 0);
    const allTagIds = [...existingTagIds, ...newTagIds];
    if (allTagIds.length) body.tag_ids = allTagIds;

    const res = await apiAuthenticated('/api/app/profile', cookies, {
      method: 'PUT',
      body
    });
    if (!res.ok) {
      const apiError = (res.data as any)?.error ?? null;
      const msg = apiError?.message || 'Error al actualizar perfil';
      return fail(res.status, { error: msg, apiError });
    }

    // Update availability if provided
    const availabilitySlotsStr = form.get('availability_slots') as string | null;
    if (availabilitySlotsStr) {
      try {
        const slots = JSON.parse(availabilitySlotsStr);
        if (!Array.isArray(slots)) {
          const msg = 'La disponibilidad enviada no es válida';
          return fail(400, {
            error: msg,
            apiError: { code: 'ERR_VALIDATION', message: msg, fields: { slots: msg } },
          });
        }
        const availabilityRes = await apiAuthenticated('/api/app/availability', cookies, {
          method: 'PUT',
          body: { slots }
        });
        if (!availabilityRes.ok) {
          const apiError = (availabilityRes.data as any)?.error ?? null;
          const msg = apiError?.message || 'Error al actualizar disponibilidad';
          return fail(availabilityRes.status, { error: msg, apiError });
        }
      } catch {
        const msg = 'No se pudo procesar la disponibilidad semanal';
        return fail(400, {
          error: msg,
          apiError: { code: 'ERR_VALIDATION', message: msg, fields: { slots: msg } },
        });
      }
    }

    return { success: true };
  }
};
