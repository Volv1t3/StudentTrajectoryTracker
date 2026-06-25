import posthog from 'posthog-js';
import { PUBLIC_POSTHOG_KEY, PUBLIC_POSTHOG_HOST } from '$env/static/public';
import { markInitialized, setPostHogClient } from '$lib/utils/posthog';
import type { HandleClientError } from '@sveltejs/kit';

function deriveUiHost(host: string | undefined): string {
	if (!host) return 'https://us.posthog.com';

	try {
		const url = new URL(host);
		if (url.hostname === 'us.i.posthog.com') return 'https://us.posthog.com';
		if (url.hostname === 'eu.i.posthog.com') return 'https://eu.posthog.com';
		return `${url.protocol}//${url.hostname}`;
	} catch {
		return 'https://us.posthog.com';
	}
}

/**
 * Initialize posthog-js once on the client.
 *
 * - Reads from the canonical public env contract: PUBLIC_POSTHOG_KEY / PUBLIC_POSTHOG_HOST.
 * - Browser transport stays on the SvelteKit `/ingest` reverse proxy (see hooks.server.ts).
 * - No-ops if the key isn't configured (e.g. local dev without analytics).
 */
export async function init() {
	if (!PUBLIC_POSTHOG_KEY) {
		// Analytics is optional locally — don't initialize if no key is set.
		return;
	}

	posthog.init(PUBLIC_POSTHOG_KEY, {
		api_host: '/dlab-analytics',
		ui_host: deriveUiHost(PUBLIC_POSTHOG_HOST),
		defaults: '2026-01-30',
		capture_pageview: true,
		capture_pageleave: true,
		capture_dead_clicks: true,
		capture_heatmaps: true,
		capture_exceptions: true,
		person_profiles: 'identified_only'
	});

	setPostHogClient(posthog);
	markInitialized();
}

export const handleError: HandleClientError = async ({ error, status, message }) => {
	try {
		posthog.captureException(error);
	} catch {
		// Never let analytics throw inside the error handler.
	}

	return {
		message,
		status
	};
};
