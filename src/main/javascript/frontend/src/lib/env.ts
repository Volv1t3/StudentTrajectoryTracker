/**
 * Client-side environment variables
 * These are public variables safe to expose to the browser
 */

// In browser, these come from import.meta.env (Vite)
// In SSR, they come from process.env
const isBrowser = typeof window !== 'undefined';

function getPublicEnv(key: string, fallback?: string): string | undefined {
  if (isBrowser) {
    // @ts-ignore - Vite injects these at build time
    return import.meta.env?.[key] || fallback;
  }
  return process.env[key] || fallback;
}

export const PUBLIC_POSTHOG_KEY = getPublicEnv('PUBLIC_POSTHOG_KEY');
export const PUBLIC_POSTHOG_HOST = getPublicEnv('PUBLIC_POSTHOG_HOST', 'https://us.i.posthog.com');
