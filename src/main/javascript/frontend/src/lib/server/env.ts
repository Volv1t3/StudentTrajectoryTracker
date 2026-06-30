import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Environment configuration loader
 * 1. First checks process.env for production/CI environments
 * 2. Falls back to src/res/envs/frontend.env for dev/test
 */

let fallbackEnv: Record<string, string> | null = null;

function loadFallbackEnv(): Record<string, string> {
  if (fallbackEnv) return fallbackEnv;
  
  // Try multiple possible paths for the fallback env file
  const possiblePaths = [
    resolve(process.cwd(), '../../../../res/envs/frontend.env'),
    resolve(process.cwd(), '../../../res/envs/frontend.env'),
    resolve(process.cwd(), 'src/res/envs/frontend.env'),
  ];
  
  for (const envPath of possiblePaths) {
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, 'utf-8');
      fallbackEnv = {};
      
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.slice(0, eqIndex).trim();
          const value = trimmed.slice(eqIndex + 1).trim();
          fallbackEnv[key] = value;
        }
      }
      
      console.log(`[env] Loaded fallback env from: ${envPath}`);
      return fallbackEnv;
    }
  }
  
  fallbackEnv = {};
  return fallbackEnv;
}

/**
 * Get environment variable with fallback to dev env file
 */
export function env(key: string): string | undefined {
  // First check process.env (production/CI)
  if (process.env[key]) {
    return process.env[key];
  }
  
  // Fall back to dev env file
  const fallback = loadFallbackEnv();
  return fallback[key];
}

/**
 * Get required environment variable (throws if missing)
 */
export function envRequired(key: string): string {
  const value = env(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Export individual env vars for convenience
export const SUPABASE_URL = () => envRequired('SUPABASE_URL');
export const SUPABASE_PUBLISHABLE_KEY = () => envRequired('SUPABASE_PUBLISHABLE_KEY');
export const RESEND_API_KEY = () => envRequired('RESEND_API_KEY');
export const SITE_URL = () => env('SITE_URL') || 'http://localhost:5173';
export const PUBLIC_POSTHOG_KEY = () => env('PUBLIC_POSTHOG_KEY');
export const PUBLIC_POSTHOG_HOST = () => env('PUBLIC_POSTHOG_HOST') || 'https://us.i.posthog.com';
export const POSTHOG_ADMIN_DASHBOARD_EMBED_URL = () => env('POSTHOG_ADMIN_DASHBOARD_EMBED_URL') || '';
export const POSTHOG_ADMIN_DASHBOARD_PUBLIC_URL = () => env('POSTHOG_ADMIN_DASHBOARD_PUBLIC_URL') || '';
