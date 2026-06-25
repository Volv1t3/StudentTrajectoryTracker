import type { PageServerLoad } from './$types';
import {
  POSTHOG_ADMIN_DASHBOARD_EMBED_URL,
  POSTHOG_ADMIN_DASHBOARD_PUBLIC_URL,
} from '$lib/server/env';

/**
 * Resolve the embedded PostHog dashboard URLs from server-side env ONLY.
 *
 * - These keys are NEVER exposed via `$env/static/public` or `$env/dynamic/public`,
 *   so they cannot leak into the client bundle.
 * - The page uses the embed URL inside a same-origin iframe, and falls back to
 *   the public URL via an "Abrir en PostHog" link when the embed isn't set.
 */
export const load: PageServerLoad = async () => {
  const embedUrl = POSTHOG_ADMIN_DASHBOARD_EMBED_URL();
  const publicUrl = POSTHOG_ADMIN_DASHBOARD_PUBLIC_URL();

  return {
    embedUrl: embedUrl || '',
    publicUrl: publicUrl || '',
  };
};
