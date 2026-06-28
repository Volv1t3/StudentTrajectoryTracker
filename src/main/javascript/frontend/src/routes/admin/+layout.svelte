<script lang="ts">
  import { page } from '$app/stores';
  import { BarChart3 } from 'lucide-svelte';
  import Navbar from '$lib/components/layout/Navbar.svelte';
  import { identify, distinctIdForAdmin, reset } from '$lib/utils/posthog';

  const navItems = [
    { href: '/admin/colaboradores', label: 'Colaboradores' },
    { href: '/admin/administradores', label: 'Administradores' },
    { href: '/admin/projects', label: 'Proyectos' },
    { href: '/admin/events', label: 'Eventos' },
    { href: '/admin/applications', label: 'Solicitudes' },
    { href: '/admin/linkage', label: 'Vinculación' },
    { href: '/admin/content', label: 'Content Management System' },
    { href: '/admin/analytics', label: 'Analítica'},
  ];

  let { data, children }: { data: { admin: any; logo?: string | null }; children: import('svelte').Snippet } = $props();

  $effect(() => {
    $page.url.pathname;
  });

  // Identify the operator as `admin:{id}`. Never email, never user ID.
  let lastIdentifiedAdminId: string | null = null;
  $effect(() => {
    const adminId = data?.admin?.id;
    if (!adminId) {
      if (lastIdentifiedAdminId !== null) {
        reset();
        lastIdentifiedAdminId = null;
      }
      return;
    }
    const did = distinctIdForAdmin(adminId);
    if (did === lastIdentifiedAdminId) return;
    lastIdentifiedAdminId = did;
    identify(did, { role: 'admin' });
  });
  function handleAdminLogout() {
    reset();
  }

  let isLoginPage = $derived($page.url.pathname === '/admin/login');
</script>

{#if isLoginPage}
  {@render children()}
{:else}
<div class="min-h-screen flex flex-col" style="background: var(--bg-primary); color: var(--text-primary);">
  <Navbar
    logo={data.logo}
    brandHref="/admin/colaboradores"
    brandLabel="DLAB"
    {navItems}
    identity={{
      label: data.admin.name,
      logoutAction: '/api/auth/admin/logout',
      logoutLabel: 'Cerrar sesión'
    }}
    containerClass="max-w-10xl"
    desktopLogoClass="h-32 w-auto"
    mobileLogoClass="h-14 w-auto max-w-full object-contain"
    drawerLogoClass="h-14 w-auto max-w-full object-contain"
    onLogout={handleAdminLogout}
  />

  <main class="flex-1 min-h-0" style="background: var(--bg-secondary);">{@render children()}</main>
</div>
{/if}
