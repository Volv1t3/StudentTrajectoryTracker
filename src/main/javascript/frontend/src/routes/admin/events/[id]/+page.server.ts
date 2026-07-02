import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { apiGet, apiPut } from '$lib/server/api';
import { getAdminAccessToken } from '$lib/server/auth';
import { loadAdministratorOptions } from '$lib/server/admin-administrators';
import { validateBucketUpload } from '$lib/server/upload-limits';
import type { Event } from '$lib/types';
import {
  buildEventWarningRedirect,
  cleanupUploadedEventMedia,
  notifyEventMediaFailure,
  uploadEventImage,
} from '$lib/server/event-media';

const eventTypeMap: Record<string, string> = {
  Taller: 'Taller',
  Charla: 'Charla',
  Convocatoria: 'Convocatoria',
  Hackatón: 'Hackatón',
  Día_De_Demostración: 'Día_De_Demostración',
  Visita: 'Visita',
  Otro: 'Otro',
};

const statusMap: Record<string, string> = {
  'Próximo': 'Próximo',
  Abierto: 'Abierto',
  En_Curso: 'En_Curso',
  Finalizado: 'Finalizado',
  Cancelado: 'Cancelado',
};

function formatDateTimeLocal(value?: string | null) {
  if (!value) return '';
  return String(value).replace(' ', 'T').slice(0, 16);
}

function toNullable(value: FormDataEntryValue | null) {
  const trimmed = value?.toString().trim();
  return trimmed ? trimmed : null;
}

type ManagerLike = {
  administrator_id?: number;
};

type EventDetail = Event & {
  managers?: ManagerLike[];
};

export const load: PageServerLoad = async ({ params, cookies }) => {
  const token = getAdminAccessToken(cookies)!;
  const [res, admins] = await Promise.all([
    apiGet<EventDetail>(`/api/admin/events/${params.id}`, token),
    loadAdministratorOptions(token),
  ]);
  if (!res.ok) throw error(404, 'Evento no encontrado');

  const e = res.data;
  const event = {
    ...e,
    nombre: e.title,
    tipo: e.type,
    descripcion_corta: e.short_description,
    descripcion_larga: e.full_description,
    fecha_inicio: formatDateTimeLocal(e.event_date),
    fecha_fin: formatDateTimeLocal(e.event_end_date),
    registration_deadline: formatDateTimeLocal(e.registration_deadline),
    target_audience: e.target_audience ?? '',
    lugar: e.location,
    cupo_maximo: e.capacity,
    link_externo: e.registration_url,
    banner_image_url: e.banner_image_url ?? '',
    poster_image_url: e.poster_image_url ?? '',
    video_url: e.video_url ?? '',
    estado: e.status,
    visible: e.is_visible,
    responsable_id: e.managers?.[0]?.administrator_id ?? '',
  };

  return { event, admins };
};

export const actions: Actions = {
  saveEvent: async ({ request, params, cookies }) => {
    const token = getAdminAccessToken(cookies)!;
    const form = await request.formData();
    const managerId = Number(form.get('responsable_id'));
    const capacityRaw = form.get('cupo_maximo')?.toString().trim();
    const bannerImageFile = form.get('banner_image_file');
    const posterImageFile = form.get('poster_image_file');
    const bannerUploadError = validateBucketUpload(bannerImageFile, 'El banner');
    if (bannerUploadError) {
      return fail(400, { error: bannerUploadError });
    }
    const posterUploadError = validateBucketUpload(posterImageFile, 'El afiche');
    if (posterUploadError) {
      return fail(400, { error: posterUploadError });
    }
    const bannerImageUrl = toNullable(form.get('banner_image_url'));
    const posterImageUrl = toNullable(form.get('poster_image_url'));

    const body = {
      title: form.get('nombre')?.toString().trim() || '',
      slug: form.get('slug')?.toString().trim() || undefined,
      type: eventTypeMap[form.get('tipo')?.toString().trim() || 'Otro'] || 'Otro',
      short_description: form.get('descripcion_corta')?.toString().trim() || '',
      full_description: form.get('descripcion_larga')?.toString().trim() || '',
      target_audience: toNullable(form.get('target_audience')) || undefined,
      location: toNullable(form.get('lugar')),
      event_date: form.get('fecha_inicio')?.toString().trim() || '',
      event_end_date: toNullable(form.get('fecha_fin')),
      registration_deadline: toNullable(form.get('registration_deadline')),
      capacity: capacityRaw ? Number(capacityRaw) : null,
      banner_image_url: bannerImageFile instanceof File && bannerImageFile.size > 0 ? null : bannerImageUrl,
      poster_image_url: posterImageFile instanceof File && posterImageFile.size > 0 ? null : posterImageUrl,
      video_url: toNullable(form.get('video_url')),
      registration_url: toNullable(form.get('link_externo')),
      status: statusMap[form.get('estado')?.toString() || 'Próximo'] || 'Próximo',
      is_visible: form.has('visible'),
      managers: Number.isInteger(managerId) && managerId > 0 ? [{ administratorId: managerId, isPrimary: true }] : [],
    };

    const res = await apiPut(`/api/admin/events/${params.id}`, body, token);
    if (!res.ok) {
      const msg = (res.data as any)?.error?.message || 'Error al guardar el evento';
      return fail(res.status, { error: msg });
    }

    const eventId = Number(params.id);
    const warnings: string[] = [];
    const mediaAttachments = [];

    if (bannerImageFile instanceof File && bannerImageFile.size > 0) {
      mediaAttachments.push({
        file: bannerImageFile,
        altText: 'Banner del evento',
        mediaField: 'banner_media_asset_id',
        urlField: 'banner_image_url',
        uploadWarning: 'El evento se actualizó, pero el banner no pudo cargarse.',
        attachWarning: 'El evento se actualizó, pero el banner no pudo aplicarse.',
      });
    }

    if (posterImageFile instanceof File && posterImageFile.size > 0) {
      mediaAttachments.push({
        file: posterImageFile,
        altText: 'Afiche del evento',
        mediaField: 'poster_media_asset_id',
        urlField: 'poster_image_url',
        uploadWarning: 'El evento se actualizó, pero el afiche no pudo cargarse.',
        attachWarning: 'El evento se actualizó, pero el afiche no pudo aplicarse.',
      });
    }

    for (const attachment of mediaAttachments) {
      const uploadRes = await uploadEventImage(eventId, attachment.file, attachment.altText, token);
      if (!uploadRes.ok || !uploadRes.data?.mediaAssetId) {
        await notifyEventMediaFailure(eventId, 'edit', 'upload', token);
        warnings.push(attachment.uploadWarning);
        continue;
      }

      const attachRes = await apiPut(`/api/admin/events/${eventId}`, {
        [attachment.mediaField]: uploadRes.data.mediaAssetId,
        [attachment.urlField]: null,
      }, token);

      if (!attachRes.ok) {
        if (uploadRes.data?.path) {
          await cleanupUploadedEventMedia(uploadRes.data.path, token);
        }
        await notifyEventMediaFailure(eventId, 'edit', 'attach', token);
        warnings.push(attachment.attachWarning);
      }
    }

    if (warnings.length > 0) {
      throw redirect(302, buildEventWarningRedirect(warnings));
    }

    throw redirect(302, '/admin/events');
  }
};
