/**
 * Backend-owned PostHog analytics service.
 *
 * Singleton-per-process client. Captures lifecycle/state-transition events
 * AFTER successful persistence. All emission helpers are guarded so analytics
 * failures cannot break business writes.
 *
 * Public surface:
 *   - capture(distinctId, event, properties)
 *   - identify(distinctId, properties)
 *   - distinctIdForCollaborator(id) -> "collaborator:{id}"
 *   - distinctIdForAdmin(id) -> "admin:{id}"
 *   - shutdownAnalytics() (registered automatically)
 */

import { PostHog } from 'posthog-node';
import { env } from '../config/env.js';

let client = null;
let shutdownRegistered = false;
let warnedDisabled = false;

const isEnabled = () => Boolean(env.POSTHOG_KEY && env.POSTHOG_HOST);

function getClient() {
  if (client) return client;
  if (!isEnabled()) {
    if (!warnedDisabled) {
      // eslint-disable-next-line no-console
      console.warn('[analytics] PostHog disabled: POSTHOG_KEY/POSTHOG_HOST not configured');
      warnedDisabled = true;
    }
    return null;
  }

  try {
    client = new PostHog(env.POSTHOG_KEY, {
      host: env.POSTHOG_HOST,
      // Local/dev traffic is low-volume, so flush each event promptly instead
      // of waiting for a larger batch that may never fill during manual testing.
      flushAt: 1,
      flushInterval: 1_000,
      // Avoid noisy network errors crashing the process; PostHog client logs internally.
      requestTimeout: 5_000,
    });
    // eslint-disable-next-line no-console
    console.info(`[analytics] PostHog enabled (${env.POSTHOG_HOST})`);

    if (!shutdownRegistered) {
      shutdownRegistered = true;
      const shutdown = async () => {
        try {
          await shutdownAnalytics();
        } catch (_e) {
          // swallow — shutdown should never throw
        }
      };
      process.once('SIGTERM', shutdown);
      process.once('SIGINT', shutdown);
      process.once('beforeExit', shutdown);
    }
    return client;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[analytics] failed to initialize PostHog client:', err?.message || err);
    client = null;
    return null;
  }
}

export function initializeAnalytics() {
  return getClient();
}

/**
 * Build a stable distinct ID for a collaborator user.
 * @param {number|string} id
 */
export function distinctIdForCollaborator(id) {
  return `collaborator:${id}`;
}

/**
 * Build a stable distinct ID for an administrator user.
 * @param {number|string} id
 */
export function distinctIdForAdmin(id) {
  return `admin:${id}`;
}

/**
 * Strip undefined/null and empty-string values from a properties bag so
 * PostHog dashboards don't get polluted with empty fields.
 */
function cleanProps(props) {
  if (!props || typeof props !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

/**
 * Safely emit a PostHog event. Never throws; failures are logged.
 *
 * @param {string} distinctId   Stable internal ID (e.g. "collaborator:42")
 * @param {string} event        Canonical event name from the shared taxonomy
 * @param {object} [properties] Event properties bag
 */
export function capture(distinctId, event, properties = {}) {
  try {
    const ph = getClient();
    if (!ph) return;
    if (!distinctId || !event) return;
    ph.capture({
      distinctId: String(distinctId),
      event: String(event),
      properties: {
        source_system: 'backend',
        ...cleanProps(properties),
      },
    });
    void ph.flush().catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('[analytics] flush after capture failed:', err?.message || err);
    });
  } catch (err) {
    // Analytics MUST NOT break business writes. Log only.
    // eslint-disable-next-line no-console
    console.warn('[analytics] capture failed:', err?.message || err);
  }
}

/**
 * Safely identify a user with person properties. Never throws.
 *
 * @param {string} distinctId
 * @param {object} [properties]
 */
export function identify(distinctId, properties = {}) {
  try {
    const ph = getClient();
    if (!ph) return;
    if (!distinctId) return;
    ph.identify({
      distinctId: String(distinctId),
      properties: cleanProps(properties),
    });
    void ph.flush().catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('[analytics] flush after identify failed:', err?.message || err);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[analytics] identify failed:', err?.message || err);
  }
}

/**
 * Flush and shutdown the PostHog client. Safe to call multiple times.
 */
export async function shutdownAnalytics() {
  const ph = client;
  client = null;
  if (!ph) return;
  try {
    await ph.shutdown();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[analytics] shutdown failed:', err?.message || err);
  }
}

export default { capture, identify, shutdownAnalytics, distinctIdForCollaborator, distinctIdForAdmin };
