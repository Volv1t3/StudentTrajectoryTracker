import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { api, apiGet, apiPost } from '$lib/server/api';
import { getAdminAccessToken } from '$lib/server/auth';
import { loadAdministratorOptions } from '$lib/server/admin-administrators';
import type { Tag } from '$lib/types';

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

export const load: PageServerLoad = async ({ cookies }) => {
  const token = getAdminAccessToken(cookies)!;
  const [categoriesRes, subcategoriesRes, admins] = await Promise.all([
    apiGet<Tag[]>('/api/admin/tags?scope=system', token),
    apiGet<Tag[]>('/api/admin/tags?scope=project', token),
    loadAdministratorOptions(token),
  ]);
  const systemTags = (categoriesRes.ok ? categoriesRes.data : []).filter((tag) => tag.is_system);
  const projectTags = (subcategoriesRes.ok ? subcategoriesRes.data : []).filter((tag) => !tag.is_system);
  return {
    systemTags,
    projectTags,
    systemTagsMeta: { page: 1, limit: systemTags.length || 1, total: systemTags.length },
    projectTagsMeta: { page: 1, limit: projectTags.length || 1, total: projectTags.length },
    areas: [],
    habilidades: projectTags,
    admins,
  };
};

export const actions: Actions = {
  saveProject: async ({ request, cookies }) => {
    const token = getAdminAccessToken(cookies)!;
    const form = await request.formData();

    const managerId = Number(form.get('responsable_id'));
    const maxCollaboratorsRaw = form.get('cupo_maximo')?.toString().trim();
    const headerImageFile = form.get('header_image_file');
    const headerImageUrl = form.get('header_image_url')?.toString().trim() || null;
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
      header_image_media_asset_id: null,
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

    const res = await apiPost('/api/admin/projects', body, token);
    if (!res.ok) {
      const msg = (res.data as any)?.error?.message || 'Error al crear el proyecto';
      return fail(res.status, { error: msg });
    }

    const projectId = Number((res.data as any)?.id);
    if (headerImageFile instanceof File && headerImageFile.size > 0 && Number.isInteger(projectId) && projectId > 0) {
      const uploadRes = await uploadProjectImage(projectId, headerImageFile, token);
      if (!uploadRes.ok || !uploadRes.data?.mediaAssetId) {
        await notifyMediaFailure(projectId, 'create', 'upload', token);
        throw redirect(302, buildWarningRedirect('Proyecto creado, pero la imagen principal no pudo cargarse.'));
      }

      const patchRes = await api('/api/admin/projects/' + projectId, {
        method: 'PUT',
        accessToken: token,
        body: {
          ...body,
          header_image_media_asset_id: uploadRes.data.mediaAssetId,
          header_image_url: null,
        },
      });
      if (!patchRes.ok) {
        if (uploadRes.data?.path) {
          await cleanupUploadedMedia(uploadRes.data.path, token);
        }
        await notifyMediaFailure(projectId, 'create', 'attach', token);
        throw redirect(302, buildWarningRedirect('Proyecto creado, pero la imagen principal no pudo aplicarse.'));
      }
    }

    throw redirect(302, '/admin/projects');
  }
};
