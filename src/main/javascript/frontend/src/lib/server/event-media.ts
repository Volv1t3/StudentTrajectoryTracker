import { api } from './api';

function buildWarningRedirect(message: string) {
  return `/admin/events?warning=${encodeURIComponent(message)}`;
}

export function buildEventWarningRedirect(messages: string[]) {
  return buildWarningRedirect(messages.join(' '));
}

export async function uploadEventImage(eventId: number, file: File, altText: string, token: string) {
  const uploadForm = new FormData();
  uploadForm.set('resource_type', 'event');
  uploadForm.set('resource_id', String(eventId));
  uploadForm.set('alt_text', altText);
  uploadForm.set('image', file);
  return api<{ publicUrl: string; mediaAssetId: number; path: string }>('/api/media/upload', {
    method: 'POST',
    body: uploadForm,
    accessToken: token,
  });
}

export async function notifyEventMediaFailure(eventId: number, operation: 'create' | 'edit', stage: 'upload' | 'attach', token: string) {
  await api(`/api/admin/events/${eventId}/media-failure-notification`, {
    method: 'POST',
    accessToken: token,
    body: { operation, stage },
  });
}

export async function cleanupUploadedEventMedia(path: string, token: string) {
  await api('/api/media', {
    method: 'DELETE',
    accessToken: token,
    body: {
      path,
      resource_type: 'event',
    },
  });
}

