import app from './app.js';
import { env } from './config/env.js';
import { initializeAnalytics, shutdownAnalytics } from './services/analytics.service.js';

initializeAnalytics();

const server = app.listen(env.PORT, () => console.log(`DLAB API running on port ${env.PORT}`));

async function gracefulShutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`[server] received ${signal}, shutting down`);
  try { await shutdownAnalytics(); } catch (_e) { /* never throw on shutdown */ }
  server.close(() => process.exit(0));
  // hard timeout fallback
  setTimeout(() => process.exit(0), 10_000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
