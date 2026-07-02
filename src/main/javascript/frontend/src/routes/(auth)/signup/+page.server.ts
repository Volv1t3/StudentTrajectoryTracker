import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { apiGet, apiPost } from '$lib/server/api';
import type { Tag } from '$lib/types/tag';
import { isUsfqEmail, normalizeEmail } from '$lib/utils';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function splitFullName(value: string) {
  const parts = value.split(/\s+/).filter(Boolean);
  return {
    primary: parts[0] || '',
    secondary: parts.length > 1 ? parts.slice(1).join(' ') : null,
  };
}

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();
  if (user && user.role === 'collaborator') throw redirect(302, '/profile');

  const tagsRes = await apiGet<Tag[]>('/api/public/tags');
  return {
    carreras: [],
    habilidades: tagsRes.ok ? tagsRes.data : [],
    areas: tagsRes.ok ? tagsRes.data : [],
  };
};

export const actions: Actions = {
  register: async ({ request }) => {
    const data = await request.formData();

    const nombres = (data.get('nombres') as string)?.trim() || '';
    const apellidos = (data.get('apellidos') as string)?.trim() || '';
    const institutionalEmail = normalizeEmail(data.get('correo_institucional') as string);
    const personalEmail = normalizeEmail(data.get('correo_personal') as string);
    const phoneNumber = (data.get('telefono') as string)?.trim() || '';
    const dateOfBirth = (data.get('fecha_nacimiento') as string)?.trim() || '';
    const semester = parseInt((data.get('semestre') as string) || '1', 10) || 1;
    const graduationYearRaw = parseInt((data.get('anio_graduacion') as string) || '', 10);
    const graduationYear = Number.isFinite(graduationYearRaw) ? graduationYearRaw : NaN;
    const motivation = (data.get('motivacion') as string)?.trim() || '';
    const experience = (data.get('experiencia_previa') as string)?.trim() || '';
    const major = ((data.get('carrera') as string) || '').trim();
    const consentAccepted = data.get('consentimiento_datos') === 'on';
    const tagNames = data.getAll('new_tags').map((tag) => String(tag).trim()).filter(Boolean);
    const interestInMachinery = data.getAll('interestInMachinery').includes('true');
    const interestInDesign = data.getAll('interestInDesign').includes('true');
    const interestInMaterials = data.getAll('interestInMaterials').includes('true');
    const { primary: firstName, secondary: middleName } = splitFullName(nombres);
    const { primary: lastName, secondary: secondLastName } = splitFullName(apellidos);

    let availabilitySlots: any[] = [];
    try {
      const slotsStr = data.get('availability_slots') as string;
      if (slotsStr) {
        availabilitySlots = JSON.parse(slotsStr);
      }
    } catch {
      availabilitySlots = [];
    }

    const body = {
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      second_last_name: secondLastName,
      personal_email: personalEmail,
      usfq_email: institutionalEmail,
      phone_number: phoneNumber,
      date_of_birth: dateOfBirth,
      major,
      expected_graduation_year: graduationYear,
      current_university_year: Math.min(Math.max(semester, 1), 12),
      motivation_description: motivation,
      experience_description: experience || null,
      interest_in_machinery: interestInMachinery,
      interest_in_design: interestInDesign,
      interest_in_materials: interestInMaterials,
      tag_names: tagNames,
      availability_slots: availabilitySlots,
    };

    if (!body.first_name || !body.last_name || !body.personal_email || !body.usfq_email || !body.phone_number || !body.date_of_birth || !body.major || !body.motivation_description) {
      return fail(400, { error: 'Todos los campos obligatorios son requeridos' });
    }

    if (!Number.isFinite(graduationYear) || graduationYear <= 2026) {
      return fail(400, { errors: { anio_graduacion: 'El año de graduación debe ser un número mayor a 2026' } });
    }

    if (!emailRegex.test(body.personal_email)) {
      return fail(400, { errors: { correo_personal: 'Debes ingresar un correo personal valido' } });
    }

    if (availabilitySlots.length === 0) {
      return fail(400, { errors: { disponibilidad_semanal: 'Debes registrar al menos un día disponible' } });
    }

    if (!isUsfqEmail(body.usfq_email)) {
      return fail(400, { error: 'Debes usar un correo institucional que termine en .usfq.edu.ec' });
    }

    if (tagNames.length === 0) {
      return fail(400, { errors: { habilidades: 'Debes registrar al menos una habilidad' } });
    }

    if (!interestInMachinery && !interestInDesign && !interestInMaterials) {
      return fail(400, { error: 'Debes seleccionar al menos un area de interes' });
    }

    if (!consentAccepted) {
      return fail(400, { errors: { consentimiento_datos: 'Debes aceptar el consentimiento para continuar' } });
    }

    const res = await apiPost('/api/auth/register', body);

    if (!res.ok) {
      const apiError = (res.data as any)?.error ?? null;
      const msg = apiError?.message || 'Error en el registro';
      return fail(res.status, { error: msg, apiError });
    }

    return { success: true, nombre: body.first_name };
  }
};
