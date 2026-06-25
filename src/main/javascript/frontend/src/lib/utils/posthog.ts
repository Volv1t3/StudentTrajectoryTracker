/**
 * Canonical browser PostHog wrapper for DLAB.
 *
 * - SSR-safe: every call is a no-op on the server.
 * - Uses the exact same `posthog-js` instance initialized in `hooks.client.ts`.
 * - Pages and components MUST import from this module instead of importing
 *   `posthog-js` directly (single capture surface).
 *
 * Frontend events automatically receive `source_system: 'frontend'`.
 * Backend authoritative events (signup, activation, application lifecycle,
 * assignments) are emitted from `analytics.service.js` server-side and carry
 * `source_system: 'backend'`.
 *
 * Identity contract (must match backend):
 *   collaborator -> `collaborator:{id}`
 *   admin        -> `admin:{id}`
 * Email is NEVER used as the distinct ID.
 */

const isBrowser = () => typeof window !== 'undefined';
type PostHogLike = {
  capture: (event: string, props?: Record<string, any>) => void;
  identify: (distinctId: string, props?: Record<string, any>) => void;
  reset: () => void;
};
type QueuedAction = (ph: PostHogLike) => void;

let client: PostHogLike | null = null;
let initialized = false;
let queuedActions: QueuedAction[] = [];

function enqueueOrRun(action: QueuedAction): void {
  if (!isBrowser()) return;
  if (!initialized) {
    queuedActions.push(action);
    return;
  }
  if (!client) return;
  action(client);
}

export function setPostHogClient(posthogClient: PostHogLike): void {
  client = posthogClient;
}

export function markInitialized(): void {
  if (!isBrowser()) return;
  initialized = true;
  if (!client || queuedActions.length === 0) return;

  const pending = queuedActions;
  queuedActions = [];
  for (const action of pending) action(client);
}

function safeCapture(event: string, props?: Record<string, any>): void {
  if (!isBrowser() || !event) return;
  const merged = { source_system: 'frontend', ...(props || {}) };
  enqueueOrRun((ph) => ph.capture(event, merged));
}

function safeIdentify(distinctId: string, props?: Record<string, any>): void {
  if (!isBrowser() || !distinctId) return;
  enqueueOrRun((ph) => ph.identify(distinctId, props));
}

function safeReset(): void {
  if (!isBrowser()) return;
  enqueueOrRun((ph) => ph.reset());
}

/** Build the canonical distinct ID for a collaborator. */
export function distinctIdForCollaborator(id: number | string): string {
  return `collaborator:${id}`;
}

/** Build the canonical distinct ID for an administrator. */
export function distinctIdForAdmin(id: number | string): string {
  return `admin:${id}`;
}

/** Capture a canonical event from the browser. SSR-safe, no-throw. */
export function capture(event: string, props?: Record<string, any>): void {
  safeCapture(event, props);
}

/** Identify the current visitor with a stable internal ID. */
export function identify(distinctId: string, props?: Record<string, any>): void {
  safeIdentify(distinctId, props);
}

/** Clear identity (e.g. on logout). */
export function reset(): void {
  safeReset();
}

/** Default export keeps backward-compatible `posthog.capture` / `posthog.identify` call sites. */
const posthog = {
  capture,
  identify,
  reset,
  distinctIdForCollaborator,
  distinctIdForAdmin,
};

export default posthog;
