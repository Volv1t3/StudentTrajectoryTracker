import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { api, apiGet, apiPut } from '$lib/server/api';
import { getAdminAccessToken } from '$lib/server/auth';
import { loadAdministratorOptions } from '$lib/server/admin-administrators';
import { validateBucketUpload } from '$lib/server/upload-limits';
import type { Project, Tag } from '$lib/types';

function buildWarningRedirect(message: string) {
  return `/admin/projects?warning=${encodeURIComponent(message)}`;
}

async function uploadProjectImage(projectId: number, file: File, token: string) {
  const uploadForm = new FormData();
  uploadForm.set('resource_type', 'project');
  uploadForm.set('resource_id', String(projectId));
  uploadForm.set('alt_text', 'Imagen principal del proyecto');
  uploadForm.set('image', file);
  return api<{ publicUrl: string; mediaAssetId: number; path: string }>('/api/media/upload', {
    method: 'POST',
    body: uploadForm,
    accessToken: token,
  });
}

async function notifyMediaFailure(projectId: number, operation: 'create' | 'edit', stage: 'upload' | 'attach', token: string) {
  await api(`/api/admin/projects/${projectId}/media-failure-notification`, {
    method: 'POST',
    accessToken: token,
    body: { operation, stage },
  });
}

async function cleanupUploadedMedia(path: string, token: string) {
  await api('/api/media', {
    method: 'DELETE',
    accessToken: token,
    body: {
      path,
      resource_type: 'project',
    },
  });
}

async function notifyMediaFailureSafely(projectId: number, operation: 'create' | 'edit', stage: 'upload' | 'attach', token: string) {
  try {
    await notifyMediaFailure(projectId, operation, stage, token);
  } catch (error) {
    console.error('[projects/edit] Failed to notify media failure', { projectId, operation, stage, error });
  }
}

async function cleanupUploadedMediaSafely(path: string, token: string) {
  try {
    await cleanupUploadedMedia(path, token);
  } catch (error) {
    console.error('[projects/edit] Failed to cleanup uploaded media', { path, error });
  }
}

function parseLegacySkillText(value?: string | null) {
  return (value || '')
    .split(/[,;\n]/)
    .map((skill) => skill.trim())
    .filter(Boolean)
    .map((name) => ({ name, slug: undefined }));
}

type ManagerLike = {
  administrator_id?: number;
};

type ProjectDetail = Project & {
  managers?: ManagerLike[];
  tags?: Array<{ id: number; name: string; slug: string; category: string; is_system?: boolean }> | null;
  categories?: Array<{ id: number; name: string; slug: string; category: string; is_system?: boolean }> | null;
  subcategories?: Array<{ id: number; name: string; slug: string; category: string; is_system?: boolean }> | null;
  requiredSkillItems?: Array<{ id: number; name: string; slug: string }> | null;
  meetingDays?: Array<{ id: number; day_of_week?: string; start_time?: string; end_time?: string; notes?: string | null; dayOfWeek?: string; startTime?: string; endTime?: string }>;
};

export const load: PageServerLoad = async ({ params, cookies }) => {
  const token = getAdminAccessToken(cookies)!;
  const [res, categoriesRes, subcategoriesRes, admins] = await Promise.all([
    apiGet<ProjectDetail>(`/api/admin/projects/${params.id}`, token),
    apiGet<Tag[]>('/api/admin/tags?scope=system', token),
    apiGet<Tag[]>('/api/admin/tags?scope=project', token),
    loadAdministratorOptions(token),
  ]);
  if (!res.ok) throw error(404, 'Proyecto no encontrado');

  const p = res.data;
  const requiredSkillItems = (p.requiredSkillItems?.length ?? 0) > 0
    ? p.requiredSkillItems ?? []
    : parseLegacySkillText(p.required_skills);
  const project = {
    ...p,
    slug: p.slug,
    nombre: p.title,
    descripcion_corta: p.short_description,
    descripcion_larga: p.full_description,
    modalidad: p.participation_mode,
    cupo_maximo: p.max_collaborators,
    estado: p.status,
    visible: p.is_visible,
    responsable_id: p.managers?.[0]?.administrator_id ?? '',
    target_audience: p.target_audience ?? '',
    required_skills: p.required_skills ?? '',
    header_image_url: p.header_image_url ?? '',
    video_url: p.video_url ?? '',
    category_tags_json: JSON.stringify((p.categories ?? []).map((tag) => tag.id)),
    subcategory_tags_json: JSON.stringify((p.subcategories ?? []).map((tag) => tag.id)),
    new_tags_json: JSON.stringify([]),
    required_skill_items_json: JSON.stringify(requiredSkillItems.map((skill) => ({ name: skill.name, slug: skill.slug }))),
    meeting_days_json: JSON.stringify((p.meetingDays ?? []).map((day) => ({
      dayOfWeek: day.day_of_week ?? day.dayOfWeek,
      startTime: day.start_time ?? day.startTime,
      endTime: day.end_time ?? day.endTime,
      notes: day.notes ?? '',
    }))),
  };

  return {
    project,
    areas: [],
    systemTags: (categoriesRes.ok ? categoriesRes.data : []).filter((tag) => tag.is_system),
    projectTags: (subcategoriesRes.ok ? subcategoriesRes.data : []).filter((tag) => !tag.is_system),
    systemTagsMeta: {
      page: 1,
      limit: (categoriesRes.ok ? categoriesRes.data.filter((tag) => tag.is_system).length : 0) || 1,
      total: categoriesRes.ok ? categoriesRes.data.filter((tag) => tag.is_system).length : 0,
    },
    projectTagsMeta: {
      page: 1,
      limit: (subcategoriesRes.ok ? subcategoriesRes.data.filter((tag) => !tag.is_system).length : 0) || 1,
      total: subcategoriesRes.ok ? subcategoriesRes.data.filter((tag) => !tag.is_system).length : 0,
    },
    habilidades: (subcategoriesRes.ok ? subcategoriesRes.data : []).filter((tag) => !tag.is_system),
    admins,
  };
};

export const actions: Actions = {
  saveProject: async ({ request, params, cookies }) => {
    const token = getAdminAccessToken(cookies)!;
    const form = await request.formData();

    const managerId = Number(form.get('responsable_id'));
    const maxCollaboratorsRaw = form.get('cupo_maximo')?.toString().trim();
    const headerImageFile = form.get('header_image_file');
    const headerImageUrl = form.get('header_image_url')?.toString().trim() || null;
    const uploadError = validateBucketUpload(headerImageFile, 'La imagen principal');
    if (uploadError) {
      return fail(400, { error: uploadError });
    }
    const parseJson = <T>(value: FormDataEntryValue | null): T => {
      if (!value) return [] as T;
      try { return JSON.parse(value.toString()) as T; } catch { return [] as T; }
    };

    const body = {
      slug: form.get('slug')?.toString().trim() || undefined,
      title: form.get('nombre')?.toString().trim() || '',
      short_description: form.get('descripcion_corta')?.toString().trim() || '',
      full_description: form.get('descripcion_larga')?.toString().trim() || '',
      target_audience: form.get('target_audience')?.toString().trim() || undefined,
      required_skills: form.get('required_skills_text')?.toString().trim() || undefined,
      participation_mode: form.get('modalidad')?.toString().trim() || null,
      header_image_media_asset_id: headerImageFile instanceof File && headerImageFile.size > 0 ? null : undefined,
      header_image_url: headerImageFile instanceof File && headerImageFile.size > 0 ? null : (headerImageUrl || null),
      video_url: form.get('video_url')?.toString().trim() || null,
      status: form.get('estado')?.toString().trim() || 'Próximo',
      is_visible: form.has('visible'),
      is_highlighted: form.has('highlighted'),
      max_collaborators: maxCollaboratorsRaw ? Number(maxCollaboratorsRaw) : null,
      tags: [
        ...parseJson<number[]>(form.get('category_tags_json')),
        ...parseJson<number[]>(form.get('subcategory_tags_json')),
      ],
      new_tags: parseJson<Array<{ name: string; slug?: string; category?: string }>>(form.get('new_tags_json')),
      required_skill_items: parseJson<Array<{ name: string; slug?: string }>>(form.get('required_skill_items_json')),
      meetingDays: parseJson<Array<{ dayOfWeek: string; startTime: string; endTime: string; notes?: string }>>(form.get('meeting_days_json')),
      managers: Number.isInteger(managerId) && managerId > 0 ? [{ administratorId: managerId, isPrimary: true }] : [],
    };

    const res = await apiPut(`/api/admin/projects/${params.id}`, body, token);
    if (!res.ok) {
      const msg = (res.data as any)?.error?.message || 'Error al guardar el proyecto';
      return fail(res.status, { error: msg });
    }

    const projectId = Number(params.id);
    if (headerImageFile instanceof File && headerImageFile.size > 0 && Number.isInteger(projectId) && projectId > 0) {
      let uploadRes;
      try {
        uploadRes = await uploadProjectImage(projectId, headerImageFile, token);
      } catch (error) {
        await notifyMediaFailureSafely(projectId, 'edit', 'upload', token);
        console.error('[projects/edit] Header image upload failed', { projectId, error });
        throw redirect(302, buildWarningRedirect('Proyecto actualizado, pero la imagen principal no pudo cargarse.'));
      }

      if (!uploadRes.ok || !uploadRes.data?.mediaAssetId) {
        await notifyMediaFailureSafely(projectId, 'edit', 'upload', token);
        throw redirect(302, buildWarningRedirect('Proyecto actualizado, pero la imagen principal no pudo cargarse.'));
      }

      let attachRes;
      try {
        attachRes = await apiPut(`/api/admin/projects/${projectId}`, {
          ...body,
          header_image_media_asset_id: uploadRes.data.mediaAssetId,
          header_image_url: null,
        }, token);
      } catch (error) {
        if (uploadRes.data?.path) {
          await cleanupUploadedMediaSafely(uploadRes.data.path, token);
        }
        await notifyMediaFailureSafely(projectId, 'edit', 'attach', token);
        console.error('[projects/edit] Failed to attach uploaded header image', { projectId, error });
        throw redirect(302, buildWarningRedirect('Proyecto actualizado, pero la imagen principal no pudo aplicarse.'));
      }

      if (!attachRes.ok) {
        if (uploadRes.data?.path) {
          await cleanupUploadedMediaSafely(uploadRes.data.path, token);
        }
        await notifyMediaFailureSafely(projectId, 'edit', 'attach', token);
        throw redirect(302, buildWarningRedirect('Proyecto actualizado, pero la imagen principal no pudo aplicarse.'));
      }
    }

    throw redirect(302, '/admin/projects');
  }
};
