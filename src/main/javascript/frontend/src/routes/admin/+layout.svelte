<script lang="ts">
  import { page } from '$app/stores';
  import { Menu, X, LogOut, BarChart3 } from 'lucide-svelte';
  import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
  import { identify, distinctIdForAdmin, reset } from '$lib/utils/posthog';

  const navItems = [
    { href: '/admin/colaboradores', label: 'Colaboradores' },
    { href: '/admin/administradores', label: 'Administradores' },
    { href: '/admin/projects', label: 'Proyectos' },
    { href: '/admin/events', label: 'Eventos' },
    { href: '/admin/applications', label: 'Solicitudes' },
    { href: '/admin/linkage', label: 'Vinculación' },
    { href: '/admin/content', label: 'Contenido CMS' },
    { href: '/admin/analytics', label: 'Analítica', icon: BarChart3 },
  ];

  let { data, children }: { data: { admin: any; logo?: string | null }; children: import('svelte').Snippet } = $props();
  let menuOpen = $state(false);
  let scrolled = $state(false);

  $effect(() => {
    const handler = () => { scrolled = window.scrollY > 8; };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  });

  $effect(() => {
    $page.url.pathname;
    menuOpen = false;
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

  function isActive(href: string): boolean {
    return $page.url.pathname.startsWith(href);
  }

  function handleAdminLogout() {
    reset();
  }

  let isLoginPage = $derived($page.url.pathname === '/admin/login');
</script>

{#if isLoginPage}
  {@render children()}
{:else}
<div class="min-h-screen flex flex-col" style="background: var(--bg-primary); color: var(--text-primary);">
  <!-- Horizontal Navbar -->
  <nav
    class="sticky top-0 z-40 transition-all duration-200"
    style="background: var(--bg-surface);"
    class:border-b={scrolled}
    class:shadow-sm={scrolled}
    class:backdrop-blur-md={scrolled}
    style:border-color={scrolled ? 'var(--border)' : 'transparent'}
  >
    <div class="max-w-10xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 md:h-18">
        <!-- Desktop Nav -->
        <div class="hidden md:flex items-center justify-between w-full">
          <a href="/admin/colaboradores" aria-label="DLAB Admin" class="transition-opacity duration-150 hover:opacity-80">
            {#if data.logo}
              <img src={data.logo} alt="DLAB Logo" class="h-32 w-auto" />
            {:else}
              <span class="text-xl font-black" style="color: var(--text-primary);">DLAB</span>
            {/if}
          </a>

          <div class="flex items-center gap-6">
            {#each navItems as item}
              {@const ItemIcon = item.icon}
              <a href={item.href} class="nav-link text-md font-medium transition-colors flex items-center gap-1.5" class:text-[--accent]={isActive(item.href)} class:text-[--text-secondary]={!isActive(item.href)}>
                {#if ItemIcon}<ItemIcon size={14} />{/if}
                {item.label}
              </a>
            {/each}
          </div>

          <div class="flex items-center gap-3">
            <ThemeToggle />
            <div class="relative">
              <span class="text-sm font-medium px-3 py-2" style="color: var(--text-secondary); font-family: var(--font-subheading);">
                {data.admin.name}
              </span>
            </div>
            <form method="POST" action="/api/auth/admin/logout" class="inline" onsubmit={handleAdminLogout}>
              <button type="submit" class="text-sm font-medium px-3 py-2 rounded-lg transition-colors cursor-pointer" style="color: var(--color-red);">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>

        <!-- Mobile burger -->
        <button
          onclick={() => menuOpen = !menuOpen}
          aria-label="Menú"
          aria-expanded={menuOpen}
          class="md:hidden flex items-center p-2 rounded-lg transition-colors"
          style="color: var(--text-secondary);"
        >
          {#if menuOpen}
            <X size={20} />
          {:else}
            <Menu size={20} />
          {/if}
        </button>
      </div>
    </div>

    <!-- Mobile drawer -->
    {#if menuOpen}
      <button type="button" class="fixed inset-0 z-40 md:hidden" style="background: color-mix(in srgb, var(--bg-primary) 45%, transparent);" onclick={() => menuOpen = false} aria-label="Cerrar menú"></button>
      <div class="fixed top-0 right-0 h-full w-[85vw] max-w-80 z-50 md:hidden flex flex-col shadow-2xl transition-transform duration-300" class:translate-x-0={menuOpen} class:translate-x-full={!menuOpen} style="background: var(--bg-surface);">
        <div class="flex items-center justify-between p-5 border-b" style="border-color: var(--border);">
          {#if data.logo}
            <img src={data.logo} alt="DLAB Logo" class="h-32 w-auto" />
          {:else}
            <span class="text-lg font-black" style="color: var(--text-primary);">DLAB</span>
          {/if}
          <div class="flex items-center gap-2">
            <ThemeToggle iconSize={16} buttonClass="p-1.5 rounded-lg transition-colors cursor-pointer" />
            <button onclick={() => menuOpen = false} class="p-1.5 rounded-lg" style="color: var(--text-secondary);">
              <X size={18} />
            </button>
          </div>
        </div>

        <nav class="flex-1 overflow-y-auto p-4 space-y-1">
          {#each navItems as item}
            {@const ItemIcon = item.icon}
            <a href={item.href} class="flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors" style="color: var(--text-secondary); font-family: var(--font-subheading);" class:text-[--accent]={isActive(item.href)}>
              {#if ItemIcon}<ItemIcon size={16} />{/if}
              {item.label}
            </a>
          {/each}
        </nav>

        <div class="p-4 border-t space-y-2" style="border-color: var(--border); font-family: var(--font-subheading);">
          <form method="POST" action="/api/auth/admin/logout" onsubmit={handleAdminLogout}>
            <button type="submit" class="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm transition-colors rounded-lg" style="color: var(--color-red);">
              <LogOut size={16} /> Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    {/if}
  </nav>

  <main class="flex-1 min-h-0" style="background: var(--bg-secondary);">{@render children()}</main>
</div>
{/if}
