<script lang="ts">
  import { page } from '$app/stores';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { ModeWatcher } from 'mode-watcher';
  import { identify, distinctIdForCollaborator, capture } from '$lib/utils/posthog';
  import '../app.css';

  interface Props {
    data: { user?: { id: number; role: string; nombres?: string; usfq_email?: string | null; major?: string | null } | null };
    children: import('svelte').Snippet;
  }

  let { data, children }: Props = $props();

  // Identify the visitor as soon as we know who they are. Backend is the
  // authoritative emitter for lifecycle events; this only ties the browser
  // session to a stable internal ID — never to email.
  let lastIdentifiedId: string | null = null;
  $effect(() => {
    const u = data.user;
    if (!u || u.role !== 'collaborator') return;
    const did = distinctIdForCollaborator(u.id);
    if (did === lastIdentifiedId) return;
    lastIdentifiedId = did;
    identify(did, {
      role: 'collaborator',
      name: u.nombres,
      usfq_email: u.usfq_email,
      major: u.major
    });
  });

  function routeGroupFromPath(pathname: string): 'public' | 'auth' | 'app' | 'admin' {
    if (pathname.startsWith('/admin')) return 'admin';
    if (
      pathname.startsWith('/login') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/activate') ||
      pathname.startsWith('/forgot-password')
    ) return 'auth';
    if (
      pathname.startsWith('/profile') ||
      pathname.startsWith('/my-applications') ||
      pathname.startsWith('/my-projects')
    ) return 'app';
    return 'public';
  }

  let lastTrackedPageview: string | null = null;
  $effect(() => {
    const href = $page.url.href;
    if (!href || href === lastTrackedPageview) return;
    lastTrackedPageview = href;

    const pathname = $page.url.pathname;
    const routeGroup = routeGroupFromPath(pathname);
    const distinctRole =
      routeGroup === 'admin'
        ? 'admin'
        : data.user?.role === 'collaborator'
          ? 'collaborator'
          : 'anonymous';

    capture('$pageview', {
      $current_url: href,
      route: pathname,
      route_group: routeGroup,
      distinct_role: distinctRole
    });
  });
</script>

<svelte:head>
  <title>DLAB — Development Lab | USFQ</title>
  <meta name="description" content="Public-facing informational and transactional website for DLAB at USFQ." />
</svelte:head>

<ModeWatcher defaultMode="dark" />

<div class="min-h-screen flex flex-col" style="background: var(--bg-primary); color: var(--text-primary);">
  {#key $page.url.pathname}
    <div class="min-h-screen flex flex-col" in:fly={{ y: 12, duration: 200, easing: cubicOut }} out:fly={{ y: -8, opacity: 0, duration: 150 }}>
      {@render children()}
    </div>
  {/key}
</div>
