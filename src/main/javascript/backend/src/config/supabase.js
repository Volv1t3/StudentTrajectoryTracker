import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Node.js versions < 22 do not provide a global WebSocket implementation.
// Supabase Realtime requires a WebSocket constructor; provide the `ws` package
// as a global WebSocket so the client can initialize without additional changes.
try {
  // dynamic import so this works in environments where `ws` isn't available
  const { default: WebSocket } = await import('ws');
  if (!globalThis.WebSocket) globalThis.WebSocket = WebSocket;
} catch (err) {
  // If ws isn't installed, RealtimeClient will throw a helpful error; keep behavior unchanged
}

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
