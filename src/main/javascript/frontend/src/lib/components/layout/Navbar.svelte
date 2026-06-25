<script lang="ts">
  import { page } from '$app/stores';
  import { reset as resetAnalytics } from '$lib/utils/posthog';
  import Button from '$lib/components/ui/Button.svelte';
  import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
  import { Menu, X, ChevronDown } from 'lucide-svelte';

  interface ColabUser {
    id: number;
    nombres?: string;
    trajectory_status?: string;
  }

  interface Props {
    user?: ColabUser | null;
    logo?: string | null;
  }

  let { user = null, logo = null }: Props = $props();

  let menuOpen = $state(false);
  let scrolled = $state(false);
  let userDropOpen = $state(false);

  $effect(() => {
    const handler = () => { scrolled = window.scrollY > 8; };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  });

  $effect(() => {
    const handler = () => { if (menuOpen) menuOpen = false; };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  });

  $effect(() => {
    $page.url;
    menuOpen = false;
    userDropOpen = false;
  });

  function isActive(href: string): boolean {
    return href === '/' ? $page.url.pathname === '/' : $page.url.pathname.startsWith(href);
  }

  function handleLogout() {
    // No canonical event for logout in the agreed taxonomy. Reset PostHog
    // identity so the next session starts anonymous and never re-uses the
    // previous distinct ID. Legacy `user_logged_out` event was removed.
    resetAnalytics();
  }
</script>

<nav
  class="sticky top-0 z-40 transition-all duration-200"
  style="background: var(--bg-surface);"
  class:border-b={scrolled}
  class:shadow-sm={scrolled}
  class:backdrop-blur-md={scrolled}
  style:border-color={scrolled ? 'var(--border)' : 'transparent'}
>
  <div class="max-w-7xl mx-auto px-4 sm:px-8 lg:px-8">
    <div class="flex items-center justify-between h-16 lg:h-18">
      <!-- Desktop Nav -->
      <div class="hidden lg:flex items-center justify-between w-full  ">
        <a href="/" aria-label="DLAB inicio" class="transition-opacity duration-150 hover:opacity-80">
          {#if logo}
            <img src={logo} alt="DLAB Logo" class="h-16 w-auto" />
          {:else}
            <span class="text-xl font-black" style="color: var(--text-primary);">D.Lab</span>
          {/if}
        </a>

        <div class="flex items-center gap-6">
          <a href="/" class="nav-link text-md font-medium" class:active={isActive('/')} class:text-[--accent]={isActive('/')} class:text-[--text-secondary]={!isActive('/')}>
            Inicio
          </a>
          <a href="/about-us" class="nav-link text-md font-medium text-[--text-secondary]" class:active={isActive('/about-us')} class:text-[--accent]={isActive('/about-us')}>
            Sobre nosotros
          </a>
          <a href="/why-join-us" class="nav-link text-md font-medium text-[--text-secondary]" class:active={isActive('/why-join-us')} class:text-[--accent]={isActive('/why-join-us')}>
            ¿Por qué unirse?
          </a>
          <a href="/projects" class="nav-link text-md font-medium text-[--text-secondary]" class:active={isActive('/projects')} class:text-[--accent]={isActive('/projects')}>
            Proyectos
          </a>
          <a href="/events" class="nav-link text-md font-medium text-[--text-secondary]" class:active={isActive('/events')} class:text-[--accent]={isActive('/events')}>
            Eventos
          </a>
          <a href="/contact" class="nav-link text-md font-medium text-[--text-secondary]" class:active={isActive('/contact')} class:text-[--accent]={isActive('/contact')}>
            Contacto
          </a>
        </div>

        <div class="flex items-center gap-3">
          <ThemeToggle />
          {#if user === null}
            <Button variant="ghost" size="sm" label="Iniciar sesión" href="/login" />
            <Button variant="primary" size="sm" label="Únete al D.Lab" href="/signup" />
          {:else}
            <div class="relative">
              <button
                onclick={() => userDropOpen = !userDropOpen}
                class="flex items-center gap-2 text-sm font-medium cursor-pointer rounded-lg px-3 py-2 transition-colors"
                style="color: var(--text-secondary); font-family: var(--font-subheading);"
              >
                <div class="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center" style="background: var(--accent); color: var(--color-text-on-dark);">
                  {(user.nombres || 'U').split(' ')[0].charAt(0)}
                </div>
                {(user.nombres || 'Usuario')}
                <ChevronDown size={14} style="color: var(--text-muted);" />
              </button>
              {#if userDropOpen}
                <button type="button" class="fixed inset-0 z-40" onclick={() => userDropOpen = false} aria-label="Cerrar menú"></button>
                <div class="absolute right-0 top-full mt-1 w-44 rounded-xl border shadow-lg z-50 overflow-hidden" style="background: var(--bg-surface); border-color: var(--border);">
                  <a href="/profile" class="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-[--bg-secondary]" style="color: var(--text-secondary);">
                    Mi perfil
                  </a>
                  <a href="/my-applications" class="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-[--bg-secondary]" style="color: var(--text-secondary);">
                    Mis solicitudes
                  </a>
                  <a href="/my-assignments" class="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-[--bg-secondary]" style="color: var(--text-secondary);">
                    Mis vinculaciones
                  </a>
                  <div class="border-t" style="border-color: var(--border);"></div>
                  <form method="POST" action="/api/auth/logout" onsubmit={handleLogout}>
                    <button type="submit" class="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-[--bg-secondary]" style="color: var(--color-red);">
                      Cerrar sesión
                    </button>
                  </form>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      <!-- Mobile burger -->
      <button
        onclick={() => menuOpen = !menuOpen}
        aria-label="Menú"
        aria-expanded={menuOpen}
        class="lg:hidden flex items-center p-2 rounded-lg transition-colors"
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
    <button type="button" class="fixed inset-0 z-40 lg:hidden" style="background: color-mix(in srgb, var(--bg-primary) 45%, transparent);" onclick={() => menuOpen = false} aria-label="Cerrar menú"></button>
    <div class="fixed top-0 right-0 h-full w-[85vw] max-w-80 z-50 lg:hidden flex flex-col shadow-2xl transition-transform duration-300" class:translate-x-0={menuOpen} class:translate-x-full={!menuOpen} style="background: var(--bg-surface);">
      <div class="flex items-center justify-between p-5 border-b" style="border-color: var(--border);">
        {#if logo}
          <img src={logo} alt="DLAB Logo" class="h-32 w-auto" />
        {:else}
          <span class="text-lg font-black" style="color: var(--text-primary);">D.Lab</span>
        {/if}
        <div class="flex items-center gap-2">
          <ThemeToggle iconSize={16} buttonClass="p-1.5 rounded-lg transition-colors cursor-pointer" />
          <button onclick={() => menuOpen = false} class="p-1.5 rounded-lg" style="color: var(--text-secondary);">
            <X size={18} />
          </button>
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto p-4 space-y-1">
        <a href="/" class="drawer-link flex items-center gap-3 px-4 py-3 rounded-lg --font-subheading" style="color: var(--text-secondary); font-family: var(--font-subheading);" class:active={isActive('/')} class:text-[--accent]={isActive('/')}>
          Inicio
        </a>
        <a href="/about-us" class="drawer-link flex items-center gap-3 px-4 py-3 rounded-lg font-bold" style="color: var(--text-secondary); font-family: var(--font-subheading);" class:active={isActive('/about-us')} class:text-[--accent]={isActive('/about-us')}>
          Sobre nosotros
        </a>
        <a href="/why-join-us" class="drawer-link flex items-center gap-3 px-4 py-3 rounded-lg font-bold" style="color: var(--text-secondary); font-family: var(--font-subheading);" class:active={isActive('/why-join-us')} class:text-[--accent]={isActive('/why-join-us')}>
          ¿Por qué unirse?
        </a>
        <a href="/projects" class="drawer-link flex items-center gap-3 px-4 py-3 rounded-lg font-bold" style="color: var(--text-secondary); font-family: var(--font-subheading);" class:active={isActive('/projects')} class:text-[--accent]={isActive('/projects')}>
          Proyectos
        </a>
        <a href="/events" class="drawer-link flex items-center gap-3 px-4 py-3 rounded-lg font-medium" style="color: var(--text-secondary); font-family: var(--font-subheading);" class:active={isActive('/events')} class:text-[--accent]={isActive('/events')}>
          Eventos
        </a>
        <a href="/contact" class="drawer-link flex items-center gap-3 px-4 py-3 rounded-lg font-medium" style="color: var(--text-secondary); font-family: var(--font-subheading);" class:active={isActive('/contact')} class:text-[--accent]={isActive('/contact')}>
          Contacto
        </a>
      </nav>

      <div class="p-4 border-t space-y-2" style="border-color: var(--border); font-family: var(--font-subheading);">
        {#if user === null}
          <Button variant="outline" href="/login" fullWidth label="Iniciar sesión" classes='font-subheading'/>
          <Button variant="outline" href="/signup" fullWidth label="Únete al D.Lab" classes='font-subheading' />
        {:else}
          <Button variant="primary" href="/profile" fullWidth label="Mi perfil" />
          <Button variant="primary" href="/my-applications" fullWidth label="Mis solicitudes" />
          <Button variant="primary" href="/my-assignments" fullWidth label="Mis vinculaciones" />
          <form method="POST" action="/api/auth/logout" onsubmit={handleLogout}>
            <Button variant="primary" fullWidth label="Cerrar sesión" type="submit" />
          </form>
        {/if}
      </div>
    </div>
  {/if}
</nav>
